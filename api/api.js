const argon2 = require('argon2');
const express = require('express');
const mongoSanitize = require('express-mongo-sanitize');
const RD = require('reallydangerous');
const cors = require('cors');
const MongoDB = require('mongodb');

let permissions = [];
const signer = new RD.Signer('supermassivepowerfulsecretuwu', 'supermassivepowerfulsaltuwu');
const app = express();
app.use(express.json());
app.use(mongoSanitize());
// app.use(cors({
// 	credentials: true,
// 	origin: 'http://localhost'
// }));
app.use(cors());

function errors(err, res) {
	if (err.message) {
		switch (err.message) {
			case 'Permissions':
				res.status(403);
				res.send({
					success: false,
					error: 'permissions'
				});
				return true;
			case 'MissingToken':
				res.status(401);
				res.send({
					success: false,
					error: 'missing-token'
				});
				return true;
			case 'NotFound':
				res.status(400);
				res.send({
					success: false,
					error: 'not-found'
				});
				return true;
			case 'WrongPassword':
				res.status(401);
				res.send({
					success: false,
					error: 'wrong-password'
				});
				return true;
			case 'OutOfRange':
				res.status(400);
				res.send({
					success: false,
					error: 'out-of-range'
				});
				return true;
		}
		if (err.message.includes('BadSignature') || err.message == 'BadToken') {
			res.status(401);
			res.send({
				success: false,
				error: 'wrong-token'
			});
			return true;
		}
	}
	if (err.name == 'MongoError') {
		switch (err.code) {
			case 121:
				res.status(400);
				res.send({
					success: false,
					error: 'validation'
				});
				return true;
		}
	}

	res.status(500);
	res.send({
		success: false,
		error: 'unknown'
	});
	console.error(err);
	return false;
}
console.info('Initialization complete');

MongoDB.MongoClient.connect('mongodb://localhost:27017', {
	useNewUrlParser: true,
	useUnifiedTopology: true
}).then(client => {
	const db = client.db('ctf');
	const collections = {
		users: db.collection('users'),
		challs: db.collection('challs'),
		transactions: db.collection('transactions'),
		pages: db.collection('pages'),
		announcements: db.collection('announcements'),
		cache: db.collection('cache')
	};
	console.info('MongoDB connected');

	async function checkPermissions(username) {
		if (permissions.includes(username)) return permissions.username;
		const type = (await collections.users.findOne({ username: username }, { projection: { type: 1, _id: 0 } }));
		if (type == null) return false;
		else {
			permissions[username] = type.type;
			return type.type;
		}
	}

	createCache = async () => {
		await collections.cache.insertOne({ announcements: 0, challenges: 0 })
		console.log('Cache created')
		return 0;
	}

	app.post('/v1/account/create', async (req, res) => {
		try {
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
			else errors(err, res);
		}
	});
	app.post('/v1/account/taken/username', async (req, res) => {
		try {
			res.send({
				success: true,
				taken: await collections.users.countDocuments({ username: req.body.username.toLowerCase() }) > 0 ? true : false
			});
		}
		catch (err) {
			errors(err, res);
		}
	});
	app.post('/v1/account/taken/email', async (req, res) => {
		try {
			res.send({
				success: true,
				taken: await collections.users.countDocuments({ email: req.body.email.toLowerCase() }) > 0 ? true : false
			});
		}
		catch (err) {
			errors(err, res);
		}
	});
	app.post('/v1/account/delete', async (req, res) => {
		try {
			if (req.headers.authorization == undefined) throw new Error('MissingToken');
			const username = signer.unsign(req.headers.authorization);
			if (await checkPermissions(username) === false) throw new Error('BadToken');
			let userToDelete = username;
			if (req.body.username) {
				if (checkPermissions(username) < 2) {
					res.status(403);
					res.send({
						success: false,
						error: 'permissions'
					});
					return;
				}
				userToDelete = req.body.username;
			}
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
			if (permissions.includes(username)) delete permissions[username];
			res.send({ success: true });
		}
		catch (err) {
			errors(err, res);
		}
	});
	app.post('/v1/account/login', async (req, res) => {
		try {
			const user = await collections.users.findOne({ username: req.body.username.toLowerCase() }, { projection: { password: 1, type: 1, _id: 0 } });
			if (!user) throw new Error('WrongDetails');
			else if (await argon2.verify(user.password, req.body.password)) {
				permissions[req.body.username] = user.type;
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
			errors(err, res);
		}
	});
	app.get('/v1/account/type', async (req, res) => {
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
			errors(err, res);
		}
	});
	app.post('/v1/account/password', async (req, res) => {
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
			errors(err, res);
		}
	});
	app.get('/v1/announcements/list/:version', async (req, res) => {
		try {
			if (req.headers.authorization == undefined) throw new Error('MissingToken');
			const username = signer.unsign(req.headers.authorization);
			const permissions = await checkPermissions(username);
			if (permissions === false) throw new Error('BadToken');

			//Check announcements version to determine if it needs update
			let version = await collections.cache.findOne(null, { projection: { _id: 0, announcements: 1 } })
			version === null ? version = await createCache() : version = version.announcements
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
			errors(err, res);
		}
	});

	app.get('/v1/announcements/get/:id', async (req, res) => {
		try {
			if (req.headers.authorization == undefined) throw new Error('MissingToken');
			const username = signer.unsign(req.headers.authorization);
			const permissions = await checkPermissions(username);
			if (permissions === false) throw new Error('BadToken');

			let announcement = await collections.announcements.findOne({_id: MongoDB.ObjectID(req.params.id)}, { projection: { _id: 0} })
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
			errors(err, res);
		}
	});

	app.post('/v1/announcements/create', async (req, res) => {
		try {
			if (req.headers.authorization == undefined) throw new Error('MissingToken');
			const username = signer.unsign(req.headers.authorization);
			if (await checkPermissions(username) < 2) throw new Error('Permissions');
			await collections.announcements.insertOne({
				title: req.body.title,
				content: req.body.content,
				timestamp: new Date()
			})
			let version = await collections.cache.findOne(null, { projection: { _id: 0, announcements: 1 } })
			version === null ? version = await createCache() : version = version.announcements
			if ((await collections.cache.updateOne({}, { '$set': { announcements: version + 1 } })).matchedCount > 0) res.send({ success: true })
			else res.send({ success: false })

		}
		catch (err) {
			errors(err, res);
		}
	});

	app.post('/v1/announcements/edit', async (req, res) => {
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
			let version = await collections.cache.findOne(null, { projection: { _id: 0, announcements: 1 } })
			if ((await collections.cache.updateOne({}, { '$set': { announcements: version.announcements + 1 } })).matchedCount > 0) res.send({ success: true })
			else res.send({ success: false })

		}
		catch (err) {
			errors(err, res);
		}
	});

	app.post('/v1/announcements/delete', async (req, res) => {
		try {
			if (req.headers.authorization == undefined) throw new Error('MissingToken');
			const username = signer.unsign(req.headers.authorization);
			if (await checkPermissions(username) < 2) throw new Error('Permissions');
			const delReq = await collections.announcements.deleteOne({ _id: MongoDB.ObjectID(req.body.id) });
			if (!delReq.result.ok) throw new Error('Unknown');
			if (delReq.deletedCount === 0) throw new Error('NotFound');
			res.send({
				success: true
			});
		}
		catch (err) {
			errors(err, res);
		}
	});

	app.get('/v1/account/list', async (req, res) => {
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
			errors(err, res);
		}
	});
	app.post('/v1/account/permissions', async (req, res) => {
		try {
			if (req.headers.authorization == undefined) throw new Error('MissingToken');
			const username = signer.unsign(req.headers.authorization);
			if (await checkPermissions(username) < 2) throw new Error('Permissions');
			if (req.body.type < 0 || req.body.type > 2) throw new Error('OutOfRange');
			if ((await collections.users.updateOne(
				{ username: req.body.username.toLowerCase() },
				{ '$set': { type: parseInt(req.body.type) } }
			)).matchedCount > 0) {
				permissions[req.body.username] = req.body.type;
				res.send({ success: true });
			}
			else throw new Error('NotFound');
		}
		catch (err) {
			errors(err, res);
		}
	});

	app.get('/v1/challenge/list/', async (req, res) => {
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
							tags: '$tags'
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
								visibility: '$visibility'
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
			errors(err, res);
		}
	});
	app.get('/v1/challenge/list/:category', async (req, res) => {
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
					tags: '$tags'
				}
			}]).toArray();
			if (challenges.length == 0) throw new Error('NotFound')
			res.send({
				success: true,
				challenges: challenges
			});
		}
		catch (err) {
			errors(err, res);
		}
	});
	app.get('/v1/challenge/list_categories', async (req, res) => {
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
			errors(err, res);
		}
	});
	app.get('/v1/challenge/list_all', async (req, res) => {
		try {
			if (req.headers.authorization == undefined) throw new Error('MissingToken');
			const username = signer.unsign(req.headers.authorization);
			if (await checkPermissions(username) < 2) throw new Error('Permissions');
			res.send({
				success: true,
				challenges: (await collections.challs.find({}, { projection: { name: 1, category: 1, points: 1, visibility: 1, solves: 1, _id: 0 } }).toArray())
			});
		}
		catch (err) {
			errors(err, res);
		}
	});
	app.get('/v1/challenge/list_all_categories', async (req, res) => {
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
			errors(err, res);
		}
	});
	app.get('/v1/challenge/show/:chall', async (req, res) => {
		try {
			if (req.headers.authorization == undefined) throw new Error('MissingToken');
			const username = signer.unsign(req.headers.authorization);
			const permissions = await checkPermissions(username);
			if (permissions === false) throw new Error('BadToken');
			const filter = permissions == 2 ? { name: req.params.chall } : { visibility: true, name: req.params.chall };
			let chall = await collections.challs.findOne(filter, { projection: { visibility: 0, flags: 0, _id: 0 } });
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
			errors(err, res);
		}
	});
	app.get('/v1/challenge/show/:chall/detailed', async (req, res) => {
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
			errors(err, res);
		}
	});
	app.post('/v1/challenge/hint', async (req, res) => {
		try {
			if (req.headers.authorization == undefined) throw new Error('MissingToken');
			const username = signer.unsign(req.headers.authorization);
			if (await checkPermissions(username) === false) throw new Error('BadToken');
			let hints = (await collections.challs.findOne({
				visibility: true,
				name: req.body.chall
			}, {
				projection: {
					hints: { $slice: [req.body.id, 1] },
					_id: 1
				}
			}));
			if (!hints) throw new Error('NotFound');
			if (!hints.hints[0]) throw new Error('OutOfRange');
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
					timestamp: new Date(),
					points: -hints.hints[0].cost,
					hint_id: parseInt(req.body.id)
				});
			}
			res.send({
				success: true,
				hint: hints.hints[0].hint
			});
		}
		catch (err) {
			errors(err, res);
		}
	});
	app.post('/v1/challenge/submit', async (req, res) => {
		try {
			if (req.headers.authorization == undefined) throw new Error('MissingToken');
			const username = signer.unsign(req.headers.authorization);
			if (await checkPermissions(username) === false) throw new Error('BadToken');
			const chall = await collections.challs.findOne({ visibility: true, name: req.body.chall }, { projection: { points: 1, flags: 1, solves: 1, max_attempts: 1, _id: 0 } });
			if (!chall) throw new Error('NotFound');
			if (chall.solves.includes(username)) throw new Error('Submitted');
			async function insertTransaction(correct = false, blocked = false) {
				await collections.transactions.insertOne({
					author: username,
					challenge: req.body.chall,
					timestamp: new Date(),
					type: blocked ? 'blocked_submission' : 'submission',
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
				await insertTransaction(true);
				res.send({
					success: true,
					data: 'correct'
				});
				solved = true;
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
			errors(err, res);
		}
	});
	app.post('/v1/challenge/new', async (req, res) => {
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
				visibility: req.body.visibility ? true : false
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
			errors(err, res);
		}
	});
	app.post('/v0/challenge/visibility/chall', async (req, res) => {
		try {
			if (req.headers.authorization == undefined) throw new Error('MissingToken');
			const username = signer.unsign(req.headers.authorization);
			if (await checkPermissions(username) < 2) throw new Error('Permissions');
			res.send((await collections.challs.updateOne(
				{ name: req.body.chall },
				{ '$set': { visibility: req.body.visibility == true } }
			)).matchedCount == 0 ? { success: false, error: 'not_found' } : { success: true });
		}
		catch (err) {
			errors(err, res);
		}
	});
	app.post('/v0/challenge/visibility/category', async (req, res) => {
		try {
			if (req.headers.authorization == undefined) throw new Error('MissingToken');
			const username = signer.unsign(req.headers.authorization);
			if (await checkPermissions(username) < 2) throw new Error('Permissions');
			res.send((await collections.challs.updateMany(
				{ category: req.body.category },
				{ '$set': { visibility: req.body.visibility == true } }
			)).matchedCount == 0 ? { success: false, error: 'not_found' } : { success: true });
		}
		catch (err) {
			errors(err, res);
		}
	});
	app.post('/v1/challenge/edit', async (req, res) => {
		try {
			if (req.headers.authorization == undefined) throw new Error('MissingToken');
			const username = signer.unsign(req.headers.authorization);
			if (await checkPermissions(username) < 2) throw new Error('Permissions');

			let updateObj = {};
			const editables = ['name', 'category', 'description', 'points', 'flags', 'tags', 'hints', 'max_attempts', 'visibility', 'writeup', 'writeupComplete'];
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
			errors(err, res);
		}
	});
	app.post('/v1/challenge/edit/category', async (req, res) => {
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
			else errors(err, res);
		}
	});
	app.post('/v1/challenge/delete', async (req, res) => {
		try {
			if (req.headers.authorization == undefined) throw new Error('MissingToken');
			const username = signer.unsign(req.headers.authorization);
			if (await checkPermissions(username) < 2) throw new Error('Permissions');
			const delReq = await collections.challs.findOneAndDelete({
				name: req.body.chall
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
			res.send({
				success: true
			});
		}
		catch (err) {
			errors(err, res);
		}
	});

	app.get('/v1/scoreboard', async (req, res) => {
		try {
			if (req.headers.authorization == undefined) throw new Error('MissingToken');
			const username = signer.unsign(req.headers.authorization);
			if (await checkPermissions(username) === false) throw new Error('BadToken');
			res.send({
				success: true,
				users: await collections.transactions.aggregate([{
					$group: {
						_id: '$author',
						changes: {
							$push: {
								points: '$points',
								timestamp: '$timestamp'
							}
						}
					}
				}]).toArray()
			});
		}
		catch (err) {
			errors(err, res);
		}
	});
	app.get('/v1/scores', async (req, res) => {
		try {
			if (req.headers.authorization == undefined) throw new Error('MissingToken');
			const username = signer.unsign(req.headers.authorization);
			if (await checkPermissions(username) === false) throw new Error('BadToken');
			res.send({
				success: true,
				scores: await collections.users.find({ type: { $ne: 2 } }, { projection: { username: 1, score: 1, _id: 0 } }).toArray()
			});
		}
		catch (err) {
			errors(err, res);
		}
	});
	app.get('/v1/scoreboard/:username', async (req, res) => {
		try {
			if (req.headers.authorization == undefined) throw new Error('MissingToken');
			if (await checkPermissions(signer.unsign(req.headers.authorization)) == false) throw new Error('BadToken');
			const scores = await collections.transactions.find({ points: { '$ne': 0 }, author: req.params.username }, { projection: { points: 1, timestamp: 1, challenge: 1, type: 1, _id: 0 } }).toArray();
			res.send({
				success: true,
				scores: scores
			});
		}
		catch (err) {
			errors(err, res);
		}
	});
	app.get('/v1/scores/:username', async (req, res) => {
		try {
			if (req.headers.authorization == undefined) throw new Error('MissingToken');
			if (await checkPermissions(signer.unsign(req.headers.authorization)) === false) throw new Error('BadToken');
			const score = (await collections.users.findOne({ username: req.params.username }, { projection: { score: 1, type: 1, _id: 0 } }));
			if (score === null) throw new Error('NotFound');
			if (score.type === 2) return res.send({success: true, score: "hidden" })
			res.send({
				success: true,
				score: score.score
			});
		}
		catch (err) {
			errors(err, res);
		}
	});
	app.get('/v1/submissions', async (req, res) => {
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
			errors(err, res);
		}
	});
	app.post('/v1/submissions/new', async (req, res) => {
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
			errors(err, res);
		}
	});
	app.get('/v1/submissions/delete', async (req, res) => {
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
			errors(err, res);
		}
	});

	app.get('/v1/about', async (req, res) => {
		res.send({
			success: true,
			version: 'dev'
		});
	});
	app.listen(20001, () => console.info('Web server started'));
}).catch(err => {
	errors(err, res);
	console.error('\n\nError while connecting to MongoDB, exiting');
});
