const argon2 = require('argon2');
const express = require('express');
const mongoSanitize = require('express-mongo-sanitize');
const fileUpload = require('express-fileupload')
const RD = require('reallydangerous');
const path = require('path');
const cors = require('cors');
const sanitizeFile = require('sanitize-filename');
const sharp = "h" //require('sharp');
const Connection = require('./utils/mongoDB.js')
const ws = require('ws')
const errorHandling = require('./middlewares/errorHandling.js');
const startupChecks = require('./utils/startupChecks.js')
const { checkPermissions, deletePermissions, setPermissions } = require('./utils/permissionUtils.js')

require('dotenv').config()
const signer = new RD.Signer(process.env.SECRET, process.env.SALT);
const app = express();
let server = app.listen(20001, () => console.info('Web server started'));
let wss = new ws.Server({ server })

app.use(express.json());
app.use(fileUpload());
app.use(mongoSanitize());
app.use(cors());




const startCache = async () => {

	let cache = {
		announcements: 0,
		challenges: 0,
		registerDisable: false,
		adminShowDisable: false,
		submissionDisabled: false,
		uploadSize: 512000,
		latestSolveSubmissionID: 0,
		uploadPath: "/var/www/ctf_platform/static/uploads/profile"
	}
	const collections = Connection.collections
	createCache = async () => {
		try {
			await collections.cache.insertOne(cache);
			console.info("Cache created")
		}
		catch (err) {
			console.error(err)
		}
	}

	let checkCache = await collections.cache.findOne(null, { projection: { _id: 0 } })
	if (checkCache === null) await createCache() //First time set-up: (1) Create Cache 
	else {
		// Add any missing cache values
		for (const key in cache) {
			if (!(key in checkCache)) {
				checkCache[key] = cache[key]
				const updateObj = {}
				updateObj[key] = cache[key]
				await collections.cache.updateOne({}, { $set: updateObj })
				console.log("Missing value " + key + " added")
			}
			app.set(key, checkCache[key])
		}
	}
	return true
}

const main = async () => {
	if (await Connection.open()) {

		const collections = Connection.collections
		await startCache()
		await startupChecks.startValidation()

		app.get('/v1/account/disableStates', async (req, res, next) => {
			try {
				if (req.headers.authorization == undefined) throw new Error('MissingToken');
				const username = signer.unsign(req.headers.authorization);
				if (await checkPermissions(username) < 2) throw new Error('Permissions');
				res.send({
					success: true,
					states: { registerDisable: app.get("registerDisable"), adminShowDisable: app.get("adminShowDisable"), uploadSize: app.get("uploadSize"), uploadPath: app.get("uploadPath") }
				});
			}
			catch (err) {
				next(err)
			}

		});

		app.get('/v1/challenge/disableStates', async (req, res, next) => {
			try {
				if (req.headers.authorization == undefined) throw new Error('MissingToken');
				const username = signer.unsign(req.headers.authorization);
				if (await checkPermissions(username) < 2) throw new Error('Permissions');

				res.send({
					success: true,
					states: { submissionDisabled: app.get("submissionDisabled") }
				});
			}
			catch (err) {
				next(err);
			}
		});

		app.post('/v1/adminSettings/', async (req, res, next) => {
			try {
				if (req.headers.authorization == undefined) throw new Error('MissingToken');
				const username = signer.unsign(req.headers.authorization);
				if (await checkPermissions(username) < 2) throw new Error('Permissions');
				const allowedSettings = ["registerDisable", "adminShowDisable", "submissionDisabled", "uploadSize", "uploadPath"]
				if (!allowedSettings.includes(req.body.setting)) return res.send({ success: false, error: "invalid-setting" })
				app.set(req.body.setting, req.body.disable)

				const set = {}
				set[req.body.setting] = req.body.disable
				if ((await collections.cache.updateOne({}, { "$set": set })).matchedCount > 0) {
					res.send({
						success: true
					});
				}
				else {
					throw new Error('Unknown');
				}

			}
			catch (err) {
				next(err);
			}
		})

		app.post('/v1/account/create', async (req, res, next) => {

			let admin = false
			try {

				if (req.headers.authorization !== undefined) {
					const username = signer.unsign(req.headers.authorization);
					if (await checkPermissions(username) >= 2) admin = true
				}
				if (!admin && app.get("registerDisable")) {
					return res.send({ success: false, error: 'registration-disabled' })
				}

				if (!/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(req.body.email)) throw new Error('BadEmail');
				await collections.users.insertOne({
					username: req.body.username.toLowerCase(),
					email: req.body.email.toLowerCase(),
					password: await argon2.hash(req.body.password),
					type: 0,
					score: 0
				});
				res.send({ success: true });
			}
			catch (err) {
				if (err.message == 'BadEmail') {
					res.send({
						success: false,
						error: 'email-formatting'
					});
					return;
				}
				if (err.name == 'MongoError') {
					switch (err.code) {
						case 11000:
							switch (Object.keys(err.keyPattern)[0]) {
								case 'username':
									res.status(403);
									res.send({
										success: false,
										error: 'username-taken'
									});
									return;
								case 'email':
									res.status(403);
									res.send({
										success: false,
										error: 'email-taken'
									});
									return;
							}
							res.send({
								success: false,
								error: 'validation'
							});
					}
				}
				else next(err);
			}
		});
		app.post('/v1/account/taken/username', async (req, res, next) => {
			try {
				res.send({
					success: true,
					taken: await collections.users.countDocuments({ username: req.body.username.toLowerCase() }) > 0 ? true : false
				});
			}
			catch (err) {
				next(err);
			}
		});
		app.post('/v1/account/taken/email', async (req, res, next) => {
			try {
				res.send({
					success: true,
					taken: await collections.users.countDocuments({ email: req.body.email.toLowerCase() }) > 0 ? true : false
				});
			}
			catch (err) {
				next(err);
			}
		});
		app.post('/v1/account/delete', async (req, res, next) => {
			try {
				if (req.headers.authorization == undefined) throw new Error('MissingToken');
				const username = signer.unsign(req.headers.authorization);
				if (await checkPermissions(username) === false) throw new Error('BadToken');
				let userToDelete = username;
				if (req.body.users) {
					if (!Array.isArray(req.body.users)) throw new Error('Validation');
					const usersToDelete = req.body.users;
					if (usersToDelete.includes(username)) return res.send({ success: false, error: 'delete_self' })
					if (checkPermissions(username) < 2) {
						res.status(403);
						res.send({
							success: false,
							error: 'permissions'
						});
						return;
					}

					if ((await collections.users.deleteMany({ username: { $in: usersToDelete } })).deletedCount == 0) {
						res.status(400);
						res.send({
							success: false,
							error: 'not_found'
						});
						return;
					}
					await collections.challs.updateMany({}, {
						$pull: {
							solves: { $in: usersToDelete }
						}
					});
					await collections.challs.updateMany({
						hints: {
							$exists: true
						}
					}, {
						$pull: {
							'hints.$[].purchased': { $in: usersToDelete }
						}
					});
					await collections.challs.deleteMany({ author: { $in: usersToDelete } });
					await collections.transactions.deleteMany({ author: { $in: usersToDelete } });
					usersToDelete.forEach(username => { if (permissions.includes(username)) deletePermissions(username) })

					res.send({ success: true });
				}
				else {
					const user = await collections.users.findOne({ username: userToDelete }, { projection: { password: 1, _id: 0 } });
					if (!(await argon2.verify(user.password, req.body.password))) return res.send({ success: false, error: "wrong-pass" })
					if ((await collections.users.deleteOne({ username: userToDelete.toLowerCase() })).deletedCount == 0) {
						res.status(400);
						res.send({
							success: false,
							error: 'not_found'
						});
						return;
					}
					await collections.challs.updateMany({}, {
						$pull: {
							solves: userToDelete
						}
					});
					await collections.challs.updateMany({
						hints: {
							$exists: true
						}
					}, {
						$pull: {
							'hints.$[].purchased': userToDelete
						}
					});
					await collections.challs.deleteMany({ author: userToDelete });
					await collections.transactions.deleteMany({ author: userToDelete });
					if (permissions.includes(username)) deletePermissions(username);
					res.send({ success: true });
				}

			}
			catch (err) {
				next(err);
			}
		});
		app.post('/v1/account/login', async (req, res, next) => {
			try {
				const user = await collections.users.findOne({ username: req.body.username.toLowerCase() }, { projection: { password: 1, type: 1, _id: 0 } });
				if (!user) throw new Error('WrongDetails');
				else if (await argon2.verify(user.password, req.body.password)) {
					setPermissions(req.body.username, user.type)
					res.send({
						success: true,
						permissions: user.type,
						token: signer.sign(req.body.username.toLowerCase())
					});
				}
				else throw new Error('WrongDetails');
			}
			catch (err) {
				switch (err.message) {
					case 'WrongDetails':
						res.send({
							success: false,
							error: 'wrong-details'
						});
						return true;
				}
				next(err);
			}
		});
		app.get('/v1/account/type', async (req, res, next) => {
			try {
				if (req.headers.authorization == undefined) throw new Error('MissingToken');
				const username = signer.unsign(req.headers.authorization);
				if (await checkPermissions(username) === false) throw new Error('BadToken');
				res.send({
					success: true,
					type: await checkPermissions(username)
				});
			}
			catch (err) {
				next(err);
			}
		});
		app.post('/v1/account/password', async (req, res, next) => {
			try {
				if (req.headers.authorization == undefined) throw new Error('MissingToken');
				const username = signer.unsign(req.headers.authorization);
				if (await checkPermissions(username) === false) throw new Error('BadToken');
				const user = await collections.users.findOne({ username: username }, { projection: { password: 1, _id: 0 } });
				if (!user) throw new Error('NotFound')
				if (req.body.new_password == '') throw new Error('EmptyPassword');
				if (await argon2.verify(user.password, req.body.password)) {
					await collections.users.updateOne(
						{ username: username },
						{ '$set': { password: await argon2.hash(req.body.new_password) } }
					);
					res.send({ success: true });
				}
				else throw new Error('WrongPassword');
			}
			catch (err) {
				switch (err.message) {
					case 'WrongPassword':
						res.status(403);
						res.send({
							success: false,
							error: 'wrong-password'
						});
						return;
					case 'EmptyPassword':
						res.status(400);
						res.send({
							success: false,
							error: 'empty-password'
						});
						return;
				}
				next(err);
			}
		});
		app.post('/v1/account/adminChangePassword', async (req, res, next) => {
			try {
				if (req.headers.authorization == undefined) throw new Error('MissingToken');
				const username = signer.unsign(req.headers.authorization);
				if (await checkPermissions(username) < 2) throw new Error('Permissions');
				if (req.body.password == '') throw new Error('EmptyPassword');
				await collections.users.updateOne(
					{ username: req.body.username },
					{ '$set': { password: await argon2.hash(req.body.password) } }
				);
				res.send({ success: true });
			}
			catch (err) {
				switch (err.message) {
					case 'EmptyPassword':
						res.status(400);
						res.send({
							success: false,
							error: 'empty-password'
						});
						return;
				}
				next(err);
			}
		});
		app.get('/v1/announcements/list/:version', async (req, res, next) => {
			try {
				if (req.headers.authorization == undefined) throw new Error('MissingToken');
				const username = signer.unsign(req.headers.authorization);
				const permissions = await checkPermissions(username);
				if (permissions === false) throw new Error('BadToken');

				//Check announcements version to determine if it needs update
				let version = app.get("announcements")
				if (parseInt(req.params.version) < version) {
					res.send({
						success: true,
						data: await collections.announcements.find(null, null).toArray(),
						version: version
					});
				}
				else {
					res.send({
						success: true,
						data: "UpToDate"
					});
				}

			}
			catch (err) {
				next(err);
			}
		});

		app.get('/v1/announcements/get/:id', async (req, res, next) => {
			try {
				if (req.headers.authorization == undefined) throw new Error('MissingToken');
				const username = signer.unsign(req.headers.authorization);
				const permissions = await checkPermissions(username);
				if (permissions === false) throw new Error('BadToken');

				let announcement = await collections.announcements.findOne({ _id: MongoDB.ObjectID(req.params.id) }, { projection: { _id: 0 } })
				if (announcement !== null) {
					res.send({
						success: true,
						data: announcement
					});
				}
				else {
					throw new Error('NotFound')
				}

			}
			catch (err) {
				next(err);
			}
		});

		app.post('/v1/announcements/create', async (req, res, next) => {
			try {
				if (req.headers.authorization == undefined) throw new Error('MissingToken');
				const username = signer.unsign(req.headers.authorization);
				if (await checkPermissions(username) < 2) throw new Error('Permissions');
				await collections.announcements.insertOne({
					title: req.body.title,
					content: req.body.content,
					timestamp: new Date()
				})
				let version = app.get("announcements")
				app.set("announcements", version + 1)
				if ((await collections.cache.updateOne({}, { '$set': { announcements: version + 1 } })).matchedCount > 0) {
					res.send({ success: true })
				}
				else res.send({ success: false })

			}
			catch (err) {
				next(err);
			}
		});

		app.post('/v1/announcements/edit', async (req, res, next) => {
			try {
				if (req.headers.authorization == undefined) throw new Error('MissingToken');
				const username = signer.unsign(req.headers.authorization);
				if (await checkPermissions(username) < 2) throw new Error('Permissions');
				if ((await collections.announcements.updateOne({ _id: MongoDB.ObjectID(req.body.id) }, {
					"$set": {
						title: req.body.title,
						content: req.body.content,
					}
				})).matchedCount === 0) throw new Error('NotFound');
				let version = app.get("announcements")
				app.set("announcements", version + 1)
				if ((await collections.cache.updateOne({}, { '$set': { announcements: version + 1 } })).matchedCount > 0) res.send({ success: true })
				else res.send({ success: false })

			}
			catch (err) {
				next(err);
			}
		});

		app.post('/v1/announcements/delete', async (req, res, next) => {
			try {
				if (req.headers.authorization == undefined) throw new Error('MissingToken');
				const username = signer.unsign(req.headers.authorization);
				if (await checkPermissions(username) < 2) throw new Error('Permissions');
				if (!Array.isArray(req.body.ids)) throw new Error('Validation');
				let ids = req.body.ids.map((id) => { return MongoDB.ObjectID(id) })
				const delReq = await collections.announcements.deleteMany({ _id: { $in: ids } });
				if (!delReq.result.ok) throw new Error('Unknown');
				if (delReq.deletedCount === 0) throw new Error('NotFound');

				let version = app.get("announcements")
				app.set("announcements", version + 1)
				if ((await collections.cache.updateOne({}, { '$set': { announcements: version + 1 } })).matchedCount > 0) res.send({ success: true })
			}
			catch (err) {
				next(err);
			}
		});

		app.get('/v1/account/list', async (req, res, next) => {
			try {
				if (req.headers.authorization == undefined) throw new Error('MissingToken');
				const username = signer.unsign(req.headers.authorization);
				if (await checkPermissions(username) < 2) throw new Error('Permissions');
				res.send({
					success: true,
					list: (await collections.users.find(null, { projection: { password: 0, _id: 0 } }).toArray())
				});
			}
			catch (err) {
				next(err);
			}
		});
		app.post('/v1/account/permissions', async (req, res, next) => {
			try {
				if (req.headers.authorization == undefined) throw new Error('MissingToken');
				const username = signer.unsign(req.headers.authorization);
				if (await checkPermissions(username) < 2) throw new Error('Permissions');
				if (req.body.type < 0 || req.body.type > 2) throw new Error('OutOfRange');
				if ((await collections.users.updateOne(
					{ username: req.body.username.toLowerCase() },
					{ '$set': { type: parseInt(req.body.type) } }
				)).matchedCount > 0) {
					res.send({ success: true });
				}
				else throw new Error('NotFound');
			}
			catch (err) {
				next(err);
			}
		});

		app.get('/v1/challenge/list/', async (req, res, next) => {
			try {
				if (req.headers.authorization == undefined) throw new Error('MissingToken');
				const username = signer.unsign(req.headers.authorization);
				const permissions = await checkPermissions(username);
				if (permissions === false) throw new Error('BadToken');
				let aggregation = [{
					$match: { visibility: true }
				}, {
					$group: {
						_id: '$category',
						challenges: {
							$push: {
								name: '$name',
								points: '$points',
								solved: { $in: [username.toLowerCase(), '$solves'] },
								firstBlood: { $arrayElemAt: ['$solves', 0] },
								tags: '$tags',
								requires: '$requires'
							}
						}
					}
				}];
				if (permissions == 2) {
					aggregation = [{
						$group: {
							_id: '$category',
							challenges: {
								$push: {
									name: '$name',
									points: '$points',
									solved: { $in: [username.toLowerCase(), '$solves'] },
									firstBlood: { $arrayElemAt: ['$solves', 0] },
									tags: '$tags',
									visibility: '$visibility',
									requires: '$requires'
								}
							}
						}
					}];
				}
				res.send({
					success: true,
					challenges: await collections.challs.aggregate(aggregation).toArray()
				});
			}
			catch (err) {
				next(err);
			}
		});
		app.get('/v1/challenge/list/:category', async (req, res, next) => {
			try {
				if (req.headers.authorization == undefined) throw new Error('MissingToken');
				const username = signer.unsign(req.headers.authorization);
				if (await checkPermissions(username) === false) throw new Error('BadToken');
				const challenges = await collections.challs.aggregate([{
					$match: {
						visibility: true,
						category: req.params.category
					}
				}, {
					$project: {
						_id: 0,
						name: '$name',
						points: '$points',
						solved: { $in: [username.toLowerCase(), '$solves'] },
						firstBlood: { $arrayElemAt: ['$solves', 0] },
						tags: '$tags',
						requires: '$requires'
					}
				}]).toArray();
				if (challenges.length == 0) throw new Error('NotFound')
				res.send({
					success: true,
					challenges: challenges
				});
			}
			catch (err) {
				next(err);
			}
		});
		app.get('/v1/challenge/list_categories', async (req, res, next) => {
			try {
				if (req.headers.authorization == undefined) throw new Error('MissingToken');
				const username = signer.unsign(req.headers.authorization);
				if (await checkPermissions(username) === false) throw new Error('BadToken');
				res.send({
					success: true,
					categories: await collections.challs.distinct('category', { visibility: true })
				});
			}
			catch (err) {
				next(err);
			}
		});
		app.get('/v1/challenge/list_all', async (req, res, next) => {
			try {
				if (req.headers.authorization == undefined) throw new Error('MissingToken');
				const username = signer.unsign(req.headers.authorization);
				if (await checkPermissions(username) < 2) throw new Error('Permissions');
				res.send({
					success: true,
					challenges: (await collections.challs.find({}, { projection: { name: 1, category: 1, points: 1, visibility: 1, solves: 1, _id: 0, requires: 1 } }).toArray())
				});
			}
			catch (err) {
				next(err);
			}
		});
		app.get('/v1/challenge/list_all_categories', async (req, res, next) => {
			try {
				if (req.headers.authorization == undefined) throw new Error('MissingToken');
				const username = signer.unsign(req.headers.authorization);
				if (await checkPermissions(username) < 2) throw new Error('Permissions');
				res.send({
					success: true,
					categories: await collections.challs.distinct('category')
				});
			}
			catch (err) {
				next(err);
			}
		});
		app.get('/v1/challenge/show/:chall', async (req, res, next) => {
			try {
				if (req.headers.authorization == undefined) throw new Error('MissingToken');
				const username = signer.unsign(req.headers.authorization);
				const permissions = await checkPermissions(username);
				if (permissions === false) throw new Error('BadToken');
				const filter = permissions == 2 ? { name: req.params.chall } : { visibility: true, name: req.params.chall };
				let chall = await collections.challs.findOne(filter, { projection: { visibility: 0, flags: 0, _id: 0 } });

				if ("requires" in chall && permissions < 2) {
					const solved = await collections.challs.findOne({ name: chall.requires }, { projection: { _id: 0, solves: 1 } })
					if (!solved) return res.send({ success: false, error: "required-challenge-not-found" })
					if (!(solved.solves.includes(username))) return res.send({ success: false, error: "required-challenge-not-completed" })
				}

				if (!chall) {
					res.status(400);
					res.send({
						success: false,
						error: 'notfound'
					});
					return;
				}
				if (chall.hints != undefined)
					chall.hints.forEach(hint => {
						if (hint.purchased.includes(username)) {
							hint.bought = true;
							delete hint.cost;
						}
						else {
							hint.bought = false;
							delete hint.hint;
						}
						delete hint.purchased;
					});
				if (chall.writeup != undefined) {
					//If only send writeup after submitting flag option is ticked, check if challenge is completed before sending writeup link
					if (chall.writeupComplete) {
						if (chall.solves.find(element => element === username) === undefined) chall.writeup = "CompleteFirst"
					}
				}
				if (chall.max_attempts != 0)
					chall.used_attempts = await collections.transactions.countDocuments({
						author: username,
						challenge: req.params.chall,
						type: 'submission'
					}, { limit: chall.max_attempts });
				res.send({
					success: true,
					chall: chall
				});
			}
			catch (err) {
				next(err);
			}
		});
		app.get('/v1/challenge/show/:chall/detailed', async (req, res, next) => {
			try {
				if (req.headers.authorization == undefined) throw new Error('MissingToken');
				const username = signer.unsign(req.headers.authorization);
				if (await checkPermissions(username) < 2) throw new Error('Permissions');
				const chall = await collections.challs.findOne({ name: req.params.chall }, { projection: { _id: 0 } });
				if (!chall) {
					res.status(400);
					res.send({
						success: false,
						error: 'notfound'
					});
					return;
				}
				res.send({
					success: true,
					chall: chall
				});
			}
			catch (err) {
				next(err);
			}
		});
		app.post('/v1/challenge/hint', async (req, res, next) => {
			try {
				if (req.headers.authorization == undefined) throw new Error('MissingToken');
				const username = signer.unsign(req.headers.authorization);
				const permissions = await checkPermissions(username)
				if (permissions === false) throw new Error('BadToken');

				let findObject = { visibility: true, name: req.body.chall }
				if (permissions === 2) findObject = { name: req.body.chall }
				let hints = (await collections.challs.findOne(findObject, {
					projection: {
						hints: { $slice: [req.body.id, 1] },
						requires: 1,
						_id: 1
					}
				}));
				if ("requires" in hints) {
					const solved = await collections.challs.findOne({ name: hints.requires }, { projection: { _id: 0, solves: 1 } })
					if (!solved) return res.send({ success: false, error: "required-challenge-not-found" })
					if (!(solved.solves.includes(username))) return res.send({ success: false, error: "required-challenge-not-completed" })
				}
				if (!hints) throw new Error('NotFound');
				if (!hints.hints[0]) throw new Error('OutOfRange');
				let Gtimestamp = new Date()
				if (!hints.hints[0].purchased.includes(username)) {
					await collections.users.updateOne({
						username: username
					}, {
						$inc: { score: -hints.hints[0].cost }
					});
					await collections.challs.updateOne({
						name: req.body.chall
					}, {
						$push: {
							[`hints.${req.body.id}.purchased`]: username
						}
					});
					await collections.transactions.insertOne({
						author: username,
						challenge: req.body.chall,
						type: 'hint',
						timestamp: Gtimestamp,
						perms: permissions,
						points: -hints.hints[0].cost,
						hint_id: parseInt(req.body.id)
					});
				}
				let latestSolveSubmissionID = app.get("latestSolveSubmissionID")
				latestSolveSubmissionID += 1
				app.set("latestSolveSubmissionID", latestSolveSubmissionID)
				await collections.cache.updateOne({}, { '$set': { latestSolveSubmissionID: latestSolveSubmissionID } })
				broadCastNewSolve({
					username: username,
					timestamp: Gtimestamp,
					points: -hints.hints[0].cost,
					perms: permissions,
					lastChallengeID: latestSolveSubmissionID
				})
				res.send({
					success: true,
					hint: hints.hints[0].hint
				});
			}
			catch (err) {
				next(err);
			}
		});
		app.post('/v1/challenge/submit', async (req, res, next) => {
			try {
				if (req.headers.authorization == undefined) throw new Error('MissingToken');
				const username = signer.unsign(req.headers.authorization);
				const permissions = await checkPermissions(username)
				if (permissions === false) throw new Error('BadToken');
				const chall = await collections.challs.findOne({ visibility: true, name: req.body.chall }, { projection: { points: 1, flags: 1, solves: 1, max_attempts: 1, requires: 1, _id: 0 } });
				if (!chall) throw new Error('NotFound');
				if (app.get("submissionDisabled")) return res.send({ error: false, error: "submission-disabled" })
				if (chall.solves.includes(username)) throw new Error('Submitted');

				//Check if the required challenge has been solved (if any)
				if ("requires" in chall) {
					const solved = await collections.challs.findOne({ name: chall.requires }, { projection: { _id: 0, solves: 1 } })
					if (!solved) return res.send({ success: false, error: "required-challenge-not-found" })
					if (!(solved.solves.includes(username))) return res.send({ success: false, error: "required-challenge-not-completed" })
				}
				let Gtimestamp = new Date()
				async function insertTransaction(correct = false, blocked = false) {
					await collections.transactions.insertOne({
						author: username,
						challenge: req.body.chall,
						timestamp: Gtimestamp,
						type: blocked ? 'blocked_submission' : 'submission',
						perms: permissions,
						points: correct ? chall.points : 0,
						correct: correct,
						submission: req.body.flag
					});
					if (correct && !blocked) {
						await collections.users.updateOne({
							username: username.toLowerCase()
						}, {
							$inc: { score: chall.points }
						});
						await collections.challs.updateOne({
							name: req.body.chall
						}, {
							$push: { solves: username.toLowerCase() }
						});
					}
				}
				if (chall.max_attempts != 0) {
					if (await collections.transactions.countDocuments({
						author: username.toLowerCase(),
						challenge: req.body.chall,
						type: 'submission'
					}) >= chall.max_attempts) throw new Error('Exceeded');
				}
				let solved = false;
				if (chall.flags.includes(req.body.flag)) {
					solved = true;
					await insertTransaction(true);
					res.send({
						success: true,
						data: 'correct'
					});
					let latestSolveSubmissionID = app.get("latestSolveSubmissionID")
					latestSolveSubmissionID += 1
					app.set("latestSolveSubmissionID", latestSolveSubmissionID)
					await collections.cache.updateOne({}, { '$set': { latestSolveSubmissionID: latestSolveSubmissionID } })
					broadCastNewSolve({
						username: username,
						timestamp: Gtimestamp,
						points: chall.points,
						perms: permissions,
						lastChallengeID: latestSolveSubmissionID
					})
				}
				// for "double-blind" CTFs - ask me if you want to
				// else if (chall.flags[0].substring(0, 1) == '$') chall.flags.some(flag => {
				// 	if (argon2.verify(flag, req.body.flag)) {
				// 		insertTransaction(true);
				// 		res.send({success: true});
				// 		solved = true;
				// 		return;
				// 	}
				// });
				if (!solved) {
					insertTransaction(false);
					res.send({
						success: true,
						data: 'ding dong your flag is wrong'
					});
				}
			}
			catch (err) {
				switch (err.message) {
					case 'Submitted':
						res.status(400);
						res.send({
							success: false,
							error: 'submitted'
						});
						return;
					case 'Exceeded':
						res.status(403);
						res.send({
							success: false,
							error: 'exceeded'
						});
						return;
				}
				next(err);
			}
		});
		app.post('/v1/challenge/new', async (req, res, next) => {
			try {
				if (req.headers.authorization == undefined) throw new Error('MissingToken');
				const username = signer.unsign(req.headers.authorization);
				if (await checkPermissions(username) < 1) throw new Error('Permissions');
				let doc = {
					name: req.body.name,
					category: req.body.category,
					description: req.body.description,
					points: parseInt(req.body.points),
					flags: req.body.flags,

					author: username,
					created: new Date(),
					solves: [],
					max_attempts: req.body.max_attempts ? parseInt(req.body.max_attempts) : 0,
					visibility: req.body.visibility ? true : false,
				};
				if (req.body.tags) doc.tags = req.body.tags;
				if (req.body.hints) {
					doc.hints = req.body.hints;
					doc.hints.forEach(hint => {
						if (hint.cost == undefined) throw new Error('MissingHintCost');
						hint.cost = parseInt(hint.cost);
						hint.purchased = [];
					});
				}
				if (req.body.writeup) {
					doc.writeup = req.body.writeup
					doc.writeupComplete = req.body.writeupComplete
				}
				if (req.body.requires) {
					doc.requires = req.body.requires
				}
				// if (req.body.files) {
				// 	for (file of req.body.files) {
				// 		if (typeof file.url != 'string' || typeof file.name != 'string') {

				// 			return;
				// 		}
				// 		if (file.url.substring(0, )) {

				// 		}
				// 	}
				// }

				await collections.challs.insertOne(doc);
				res.send({ success: true });
			}
			catch (err) {
				if (err.name == 'MongoError') {
					switch (err.code) {
						case 11000:
							switch (Object.keys(err.keyPattern)[0]) {
								case 'name':
									res.status(403);
									res.send({
										success: false,
										error: 'exists'
									});
									return;
							}
							res.send({
								success: false,
								error: 'validation'
							});
					}
				}
				if (err.message == 'MissingHintCost') {
					res.status(400);
					res.send({
						success: false,
						error: 'validation'
					});
				}
				next(err);
			}
		});
		app.post('/v1/challenge/edit', async (req, res, next) => {
			try {
				if (req.headers.authorization == undefined) throw new Error('MissingToken');
				const username = signer.unsign(req.headers.authorization);
				if (await checkPermissions(username) < 2) throw new Error('Permissions');

				let updateObj = {};
				const editables = ['name', 'category', 'description', 'points', 'flags', 'tags', 'hints', 'max_attempts', 'visibility', 'writeup', 'writeupComplete', 'requires'];
				for (field of editables) if (req.body[field] != undefined) updateObj[field] = req.body[field];
				if (updateObj.hints) {
					updateObj.hints.forEach(hint => {
						if (hint.cost == undefined) throw new Error('MissingHintCost');
						hint.cost = parseInt(hint.cost);
						hint.purchased = hint.purchased != undefined ? hint.purchased : [];
					});
				}
				if ((await collections.challs.updateOne(
					{ name: req.body.chall },
					{ '$set': updateObj }
				)).matchedCount > 0) res.send({ success: true });
				else throw new Error('NotFound');
			}
			catch (err) {
				if (err.message == 'MissingHintCost') {
					res.status(400);
					res.send({
						success: false,
						error: 'validation'
					});
				}
				if (err.name == 'MongoError') {
					switch (err.code) {
						case 11000:
							switch (Object.keys(err.keyPattern)[0]) {
								case 'name':
									res.status(403);
									res.send({
										success: false,
										error: 'exists'
									});
									return;
							}
							res.send({
								success: false,
								error: 'validation'
							});
					}
				}
				next(err);
			}
		});
		app.post('/v1/challenge/edit/visibility', async (req, res, next) => {
			try {
				if (req.headers.authorization == undefined) throw new Error('MissingToken');
				const username = signer.unsign(req.headers.authorization);
				if (await checkPermissions(username) < 2) throw new Error('Permissions');
				if (!Array.isArray(req.body.challenges)) throw new Error('Validation');
				if ((await collections.challs.updateMany({
					name: {
						$in: req.body.challenges
					}
				}, {
					$set: { visibility: req.body.visibility }
				})).matchedCount > 0) res.send({ success: true });
				else throw new Error('NotFound');
			}
			catch (err) {
				next(err);
			}
		});
		app.post('/v1/challenge/edit/category', async (req, res, next) => {
			try {
				if (req.headers.authorization == undefined) throw new Error('MissingToken');
				const username = signer.unsign(req.headers.authorization);
				if (await checkPermissions(username) < 2) throw new Error('Permissions');
				if (!Array.isArray(req.body.category)) throw new Error('Validation');
				let updateObj = {};
				if (req.body.visibility != undefined) updateObj.visibility = req.body.visibility;
				if (req.body.new_name != undefined) updateObj.category = req.body.new_name;
				if ((await collections.challs.updateMany({
					category: {
						$in: req.body.category
					}
				}, {
					$set: updateObj
				})).matchedCount > 0) res.send({ success: true });
				else throw new Error('NotFound');
			}
			catch (err) {
				if (err.message == 'Validation')
					res.send({
						success: false,
						error: 'validation'
					});
				else next(err);
			}
		});
		app.post('/v1/challenge/delete', async (req, res, next) => {
			try {
				if (req.headers.authorization == undefined) throw new Error('MissingToken');
				const username = signer.unsign(req.headers.authorization);
				if (await checkPermissions(username) < 2) throw new Error('Permissions');
				for (let i = 0; i < req.body.chall.length; i++) {
					const delReq = await collections.challs.findOneAndDelete({
						name: req.body.chall[i]
					}, {
						solves: 1,
						points: 1,
						hints: 1,
						_id: 0
					});
					if (!delReq.ok) throw new Error('Unknown');
					if (delReq.value === null) throw new Error('NotFound');
					const timestamp = new Date();
					await collections.transactions.deleteMany({ challenge: req.body.chall });
					await collections.users.updateMany({
						username: { $in: delReq.value.solves }
					}, {
						$inc: { score: -delReq.value.points }
					});
					if (delReq.value.hints) {
						for (hint of delReq.value.hints) {
							await collections.users.updateMany({
								username: { $in: hint.purchased }
							}, {
								$inc: { score: hint.cost }
							});
						}
					}
				}

				res.send({
					success: true
				});
			}
			catch (err) {
				next(err);
			}
		});

		app.get('/v1/scoreboard', async (req, res, next) => {
			try {
				if (req.headers.authorization == undefined) throw new Error('MissingToken');
				const username = signer.unsign(req.headers.authorization);
				if (await checkPermissions(username) === false) throw new Error('BadToken');
				let payload = {}
				if (app.get("adminShowDisable")) payload = { perms: { $ne: 2 } }

				res.send({
					success: true,
					users: await collections.transactions.aggregate([
						{
							$match: payload
						},
						{
							$group: {
								_id: '$author',
								changes: {
									$push: {
										points: '$points',
										timestamp: '$timestamp'
									}
								}
							}
						}]).toArray(),
					lastChallengeID: app.get("latestSolveSubmissionID")
				});
			}
			catch (err) {
				next(err);
			}
		});
		app.get('/v1/scores', async (req, res, next) => {
			try {
				if (req.headers.authorization == undefined) throw new Error('MissingToken');
				const username = signer.unsign(req.headers.authorization);
				if (await checkPermissions(username) === false) throw new Error('BadToken');

				//Check if adminShowDisable is enabled, then don't return admin scores
				let payload = null
				if (app.get("adminShowDisable")) payload = { type: { $ne: 2 } }

				res.send({
					success: true,
					scores: await collections.users.find(payload, { projection: { username: 1, score: 1, _id: 0 } }).toArray()
				});
			}
			catch (err) {
				next(err);
			}
		});
		app.get('/v1/scoreboard/:username', async (req, res, next) => {
			try {

				if (req.headers.authorization == undefined) throw new Error('MissingToken');
				if (await checkPermissions(signer.unsign(req.headers.authorization)) == false) throw new Error('BadToken');
				const scores = await collections.transactions.find({ points: { '$ne': 0 }, author: req.params.username }, { projection: { points: 1, timestamp: 1, challenge: 1, type: 1, _id: 0 } }).toArray();
				if (scores[0] && scores[0].type === 2 && app.get("adminShowDisable")) return res.send({ success: true, scores: [] })
				res.send({
					success: true,
					scores: scores
				});
			}
			catch (err) {
				console.error(err)
				next(err);
			}
		});
		app.get('/v1/scores/:username', async (req, res, next) => {
			try {
				if (req.headers.authorization == undefined) throw new Error('MissingToken');
				if (await checkPermissions(signer.unsign(req.headers.authorization)) === false) throw new Error('BadToken');
				const score = (await collections.users.findOne({ username: req.params.username }, { projection: { score: 1, type: 1, _id: 0 } }));
				if (score === null) throw new Error('NotFound');
				if (score.type === 2 && app.get("adminShowDisable")) return res.send({ success: true, score: "hidden" })
				res.send({
					success: true,
					score: score.score
				});
			}
			catch (err) {
				next(err);
			}
		});
		app.get('/v1/submissions', async (req, res, next) => {
			try {
				if (req.headers.authorization == undefined) throw new Error('MissingToken');
				const username = signer.unsign(req.headers.authorization);
				if (await checkPermissions(username) < 2) throw new Error('Permissions');
				res.send({
					success: true,
					submissions: await collections.transactions.find({ '$or': [{ type: 'submission' }, { type: 'blocked_submission' }] }).toArray()
				});
			}
			catch (err) {
				next(err);
			}
		});
		app.post('/v1/submissions/new', async (req, res, next) => {
			try {
				if (req.headers.authorization == undefined) throw new Error('MissingToken');
				const username = signer.unsign(req.headers.authorization);
				if (await checkPermissions(username) < 2) throw new Error('Permissions');
				if (await collections.users.countDocuments({ username: req.body.username.toLowerCase() }) == 0) throw new Error('UserNotFound');

				const chall = await collections.challs.findOneAndUpdate({
					name: req.body.chall
				}, {
					$addToSet: {
						solves: req.body.username.toLowerCase()
					}
				}, {
					projection: {
						points: 1,
						_id: 0
					}
				});
				if (!chall.ok) throw new Error('Unknown');
				if (chall.value === null) throw new Error('NotFound');
				const lastScore = await collections.transactions.aggregate([{
					$match: {
						author: req.body.username.toLowerCase(),
						challenge: req.body.chall
					}
				}, {
					$group: {
						_id: '$challenge',
						points: {
							$sum: '$points'
						}
					}
				}]).toArray();
				if (lastScore[0].points > req.body.points && !req.body.force) {
					res.send({
						success: true,
						data: 'previous-higher'
					});
					return;
				}
				await collections.transactions.insertOne({
					author: req.body.username.toLowerCase(),
					challenge: req.body.chall,
					timestamp: new Date(),
					type: 'submission',
					points: req.body.points - lastScore[0].points,
					submission: req.body.flag != null ? req.body.flag : 'No flag provided',
					manual: username
				});
				await collections.users.updateOne({
					username: req.body.username.toLowerCase()
				}, {
					$inc: { score: req.body.points - lastScore[0].points }
				});
				res.send({
					success: true,
					data: 'recorded'
				});
			}
			catch (err) {
				next(err);
			}
		});
		app.get('/v1/submissions/delete', async (req, res, next) => {
			try {
				if (req.headers.authorization == undefined) throw new Error('MissingToken');
				const username = signer.unsign(req.headers.authorization);
				if (await checkPermissions(username) < 2) throw new Error('Permissions');
				const delReq = await collections.transactions.findOneAndDelete({
					_id: MongoDB.ObjectID(req.body.submissionID)
				}, {
					solves: 1,
					points: 1,
					hints: 1,
					_id: 0
				});
				if (!delReq.ok) throw new Error('Unknown');
				if (delReq.value === null) throw new Error('NotFound');
				res.send({
					success: true,
				});
			}
			catch (err) {
				next(err);
			}
		});

		app.get('/v1/about', async (req, res, next) => {
			res.send({
				success: true,
				version: 'dev'
			});
		});
		app.post('/v1/profile/upload', async (req, res, next) => {
			if (req.headers.authorization == undefined) throw new Error('MissingToken');
			const username = signer.unsign(req.headers.authorization);
			if (await checkPermissions(username) === false) throw new Error('BadToken');

			if (!req.files || !("profile_pic" in req.files)) res.send({ success: false, error: "no-file" })
			if (Object.keys(req.files).length !== 1) res.send({ success: false, error: "only-1-file" })
			let targetFile = req.files.profile_pic
			if (targetFile.size > app.get("uploadSize")) res.send({ success: false, error: "too-large", size: app.get("uploadSize") })
			let allowedExts = ['.png', '.jpg', '.jpeg', '.webp']
			if (!allowedExts.includes(path.extname(targetFile.name))) res.send({ success: false, error: "invalid-ext" })

			await sharp(targetFile.data)
				.toFormat('webp')
				.webp({ quality: 30 })
				.toFile(path.join(app.get("uploadPath"), sanitizeFile(username)) + ".webp")
				.catch((err) => {
					console.error(err)
					return res.send({ success: false, error: "file-upload" })
				})
			res.send({ success: true })
		})

		const broadCastNewSolve = async (solveDetails) => {
			if (app.get("adminShowDisable") && solveDetails.perms === 2) {
				return false
			}
			wss.clients.forEach((client) => {
				if (client.readyState === ws.OPEN && client.isAuthed === true) {
					client.send(JSON.stringify({ type: "score", data: solveDetails }));
				}
			})
		}

		//websocket methods
		wss.on('connection', (socket) => {
			socket.isAlive = true
			socket.on('pong', () => { socket.isAlive = true }); // check for any clients that dced without informing the server

			socket.on("message", async (msg) => {
				const data = JSON.parse(msg)
				if (data.type === "init") {
					const payload = data.data
					//Authenticate
					if (payload.auth == undefined) {
						socket.send(JSON.stringify({ type: "init", data: "missing-auth" }));
						return socket.terminate()
					}
					const username = signer.unsign(payload.auth);
					if (await checkPermissions(username) === false) {
						socket.send(JSON.stringify({ type: "init", data: "bad-auth" }))
						return socket.terminate()
					}
					socket.isAuthed = true

					const latestSolveSubmissionID = app.get("latestSolveSubmissionID")
					if (payload.lastChallengeID < latestSolveSubmissionID) {
						let challengesToBeSent = collections.transactions.find(null, { projection: { _id: 0, perms: 1, author: 1, timestamp: 1, points: 1 } }).sort({ $natural: -1 }).limit(app.get("latestSolveSubmissionID") - payload.lastChallengeID);
						let finalChallenges = []
						if (app.get("adminShowDisable")) {
							await challengesToBeSent.forEach((doc) => {
								if (doc.perms !== 2) finalChallenges.push(doc)
							})
						}
						else {
							finalChallenges = await challengesToBeSent.toArray()
						}
						socket.send(JSON.stringify({ type: "init", data: finalChallenges, lastChallengeID: latestSolveSubmissionID }))
					}
					else socket.send(JSON.stringify({ type: "init", data: "up-to-date" }))
				}
			})
		})

		// check for any clients that dced without informing the server
		const interval = setInterval(function ping() {
			wss.clients.forEach(function each(ws) {
				if (ws.isAlive === false) return ws.terminate();

				ws.isAlive = false;
				ws.ping();
			});
		}, 30000);

		wss.on('close', function close() {
			clearInterval(interval);
		});

		app.use(errorHandling.unknownEndpoint)
		app.use(errorHandling.errorHandler)

		console.info('Initialization complete');
	}
	else {
		console.info("Error: MongoDB failed to connect, stopping...")
	}
}
main()


