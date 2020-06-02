const argon2 = require('argon2');
const express = require('express');
const RD = require('reallydangerous');
const cors = require('cors');
const MongoDB = require('mongodb');

let permissions = [];
const signer = new RD.Signer('supermassivepowerfulsecretuwu', 'supermassivepowerfulsaltuwu');
const app = express();
app.use(express.json());
// app.use(cors({
// 	credentials: true,
// 	origin: 'http://localhost'
// }));
app.use(cors());
console.info('Initialization complete');

function errors(err, res) {
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
	if (err.message.includes('BadSignature')) {
		res.status(401);
		res.send({
			success: false,
			error: 'wrong-token'
		});
		return true;
	}
	res.status(500);
	res.send({
		success: false,
		error: 'unknown'
	});
	console.log(err);
}

MongoDB.MongoClient.connect('mongodb://localhost:27017', {
	useNewUrlParser: true,
	useUnifiedTopology: true
}).then(client => {
	const db = client.db('ctf');
	const collections = {
		users: db.collection('users'),
		challs: db.collection('challs'),
		transactions: db.collection('transactions')
	};
	console.info('MongoDB connected');

	async function checkPermissions(username) {
		if (permissions.includes(username)) return permissions.username;
		const type = (await collections.users.findOne({username: username}, {projection: {type: 1, _id: 0}})).type;
		permissions[username] = type;
		return type;
	}
	
	app.post('/v1/account/create', async (req, res) => {
		try {
			await collections.users.insertOne({
				username: req.body.username,
				email: req.body.email,
				password: await argon2.hash(req.body.password),
				type: 0,
				score: 0
			});
			res.send({success: true});
		}
		catch (err) {
			errors(err, res);
		}
	});
	app.post('/v1/account/taken/username', async (req, res) => {
		try {
			res.send({
				success: true,
				taken: await collections.users.findOne({username: req.body.username}, {projection: {_id: 1}}) ? true : false
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
				taken: await collections.users.findOne({email: req.body.email}, {projection: {_id: 1}}) ? true : false
			});
		}
		catch (err) {
			errors(err, res);
		}
	});
	app.post('/v1/account/login', async (req, res) => {
		try {
			const user = await collections.users.findOne({username: req.body.username}, {projection: {password: 1, type: 1, _id: 0}});
			if (!user) {
				res.clearCookie('session');
				throw new Error('WrongUsername');
			}
			else if (await argon2.verify(user.password, req.body.password)) {
				permissions[req.body.username] = user.type;
				res.send({
					success: true,
					permissions: user.type,
					token: signer.sign(req.body.username)
				});
			}
			else {
				res.clearCookie('session');
				throw new Error('WrongPassword');
			}
		}
		catch (err) {
			switch (err.message) {
				case 'WrongPassword':
					res.send({
						success: false,
						error: 'wrong-password'
					})
					return true;
				case 'WrongUsername':
					res.send({
						success: false,
						error: 'wrong-username'
					})
					return true;
			}
			errors(err, res);
		}
	});
	app.post('/v1/account/delete', async (req, res) => {
		try {
			if (req.headers.authorization == undefined) throw new Error('MissingToken');
			const username = signer.unsign(req.headers.authorization);
			let userToDelete = username;
			if (req.body.username) {
				if (req.session.type < 2) {
					res.status(403);
					res.send({
						success: false,
						error: 'permissions'
					});
					return;
				}
				userToDelete = req.body.username;
			}
			if ((await collections.users.deleteOne({username: userToDelete})).deletedCount == 0) {
				res.status(400);
				res.send({
					success: false,
					error: 'not_found'
				});
				return;
			}
			await collections.challs.updateMany({}, {
				'$pull': {
					'solves': userToDelete,
					'hints.$[].purchased': userToDelete
				}
			});
			await collections.challs.deleteMany({author: userToDelete});
			await collections.transactions.deleteMany({author: userToDelete});
			if (userToDelete == username) req.session.destroy();
			res.send({success: true});
		}
		catch (err) {
			errors(err, res);
		}
	});
	app.get('/v1/account/type', async (req, res) => {
		try {
			if (req.headers.authorization == undefined) throw new Error('MissingToken');
			const username = signer.unsign(req.headers.authorization);
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
			const user = await collections.users.findOne({username: username}, {projection: {password: 1, _id: 0}});
			if (!user) throw new Error('NotFound')
			if (req.body.new_password == '') throw new Error('EmptyPassword');
			if (await argon2.verify(user.password, req.body.password)) {
				await collections.users.updateOne(
					{username: username},
					{'$set': {password: await argon2.hash(req.body.new_password)}}
				);
				res.send({success: true});
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
	app.get('/v1/account/list', async (req, res) => {
		try {
			if (req.headers.authorization == undefined) throw new Error('MissingToken');
			const username = signer.unsign(req.headers.authorization);
			if (await checkPermissions(username) < 2) throw new Error('Permissions');
			res.send({
				success: true,
				list: (await collections.users.find(null, {projection: {password: 0, _id: 0}}).toArray())
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
				{username: req.body.username},
				{'$set': {type: parseInt(req.body.type)}}
			)).matchedCount > 0) {
				res.send({success: true});
				permissions[req.body.username] = req.body.type;
			}
			else throw 'NotFound';
		}
		catch (err) {
			errors(err, res);
		}
	});

	// Note to self: there should be a better way of doing this
	app.get('/v1/challenge/list', async (req, res) => {
		try {
			if (req.headers.authorization == undefined) throw new Error('MissingToken');
			const username = signer.unsign(req.headers.authorization);
			let challenges = await collections.challs.find({visibility: true}, {projection: {name: 1, category: 1, points: 1, solves: 1}}).toArray();
			challenges.forEach(chall => {
				chall.solved = chall.solves.includes(username)
				delete chall.solves;
			});
			res.send({
				success: true,
				challenges: challenges
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
				challenges: (await collections.challs.find({}, {projection: {name: 1, category: 1, points: 1, visibility: 1, solves: 1, _id: 0}}).toArray())
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
			const chall = await collections.challs.findOne({visibility: true, name: req.params.chall}, {projection: {visibility: 0, flags: 0, _id: 0}});
			if (!chall) {
				res.status(400);
				res.send({
					success: false,
					error: 'notfound'
				});
				return;
			}
			chall.hints.forEach(hint => {
				if (hint.purchased.includes(username)) delete hint.cost;
				else delete hint.hint;
				delete hint.purchased;
			});
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
			let hints = (await collections.challs.findOne({visibility: true, name: req.body.chall}, {projection: {hints: 1, _id: 0}}));
			if (!hints) throw new Error('NotFound');
			hints = hints.hints;
			if (req.body.id > hints.length - 1) throw new Error('OutOfRange');
			if (hints[req.body.id].purchased.includes(username)) throw new Error('Bought');

			await collections.users.updateOne(
				{username: username},
				{'$inc': {score: -hints[req.body.id].cost}},
			);
			const updateRef = {};
			updateRef[`hints.${req.body.id}.purchased`] = username;
			await collections.challs.updateOne(
				{name: req.body.chall},
				{'$push': updateRef}
			);
			await collections.transactions.insertOne({
				author: username,
				challenge: req.body.chall,
				type: 'hint',
				timestamp: new MongoDB.Timestamp(0, Math.floor(new Date().getTime() / 1000)),
				points: -hints[req.body.id].cost,
				hint_id: parseInt(req.body.id)
			});
			res.send({
				success: true,
				hint: hints[req.body.id].hint
			});
		}
		catch (err) {
			if (err.message == 'Bought') {
				res.status(400);
				res.send({
					success: false,
					error: 'bought'
				});
			}
			errors(err, res);
		}
	});
	app.post('/v1/challenge/submit', async (req, res) => {
		try {
			if (req.headers.authorization == undefined) throw new Error('MissingToken');
			const username = signer.unsign(req.headers.authorization);
			const chall = await collections.challs.findOne({visibility: true, name: req.body.chall}, {projection: {points: 1, flags: 1, solves: 1, max_attempts: 1, _id: 0}});
			if (!chall) throw new Error('NotFound');
			if (chall.solves.includes(username)) throw new Error('Submitted');
			async function insertTransaction(correct = false, blocked = false) {
				await collections.transactions.insertOne({
					author: username,
					challenge: req.body.chall,
					timestamp: new MongoDB.Timestamp(0, Math.floor(new Date().getTime() / 1000)),
					type: blocked ? 'blocked_submission' : 'submission',
					points: correct ? chall.points : 0,
					correct: correct,
					submission: req.body.flag
				});
				if (correct && !blocked) {
					await collections.users.updateOne(
						{username: username},
						{'$inc': {score: chall.points}},
					);
					await collections.challs.updateOne(
						{name: req.body.chall},
						{'$push': {solves: username}}
					);
				}
			}
			// test
			if (chall.max_attempts != 0) {
				if ((await collections.transactions.find({
					author: username,
					challenge: req.body.chall,
					type: 'submission'
				}, {projection: {_id: 1}}).toArray()).length >= chall.max_attempts) throw new Error('Exceeded');
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
				created: new MongoDB.Timestamp(0, Math.floor(new Date().getTime() / 1000)),
				solves: [],
				max_attempts: req.body.max_attempts ? parseInt(req.body.max_attempts) : 0,
				visibility: req.body.visibility ? true : false
			};
			if (req.body.tags) doc.tags = req.body.tags;
			if (req.body.hints) {
				doc.hints = req.body.hints;
				doc.hints.forEach(hint => {
					// if (!hint.cost) throw new Error('Document failed validation');
					// hint.cost = parseInt(hint.cost);
					hint.purchased = [];
				});
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
			res.send({success: true});
		}
		catch (err) {
			if (err.errmsg) {
				if (err.errmsg.includes('duplicate key error collection')) res.send({
					success: false,
					error: 'exists'
				});
				else if (err.errmsg == 'Document failed validation') res.send({
					success: false,
					error: 'validation'
				});
				else res.send({
					success: false,
					error: 'unknown'
				});
			}
			else res.send({
				success: false,
				error: 'unknown'
			});
		}
	});
	app.post('/v0/challenge/visibility/chall', async (req, res) => {
		try {
			if (req.headers.authorization == undefined) throw new Error('MissingToken');
			const username = signer.unsign(req.headers.authorization);
			if (await checkPermissions(username) < 2) throw new Error('Permissions');
			res.send((await collections.challs.updateOne(
				{name: req.body.chall},
				{'$set': {visibility: req.body.visibility == true}}
			)).matchedCount == 0 ? {success: false, error: 'not_found'} : {success: true});
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
				{category: req.body.category},
				{'$set': {visibility: req.body.visibility == true}}
			)).matchedCount == 0 ? {success: false, error: 'not_found'} : {success: true});
		}
		catch (err) {
			errors(err, res);
		}
	});

	app.get('/v1/scoreboard', async (req, res) => {
		try {
			signer.unsign(req.headers.authorization);
			res.send({
				success: true,
				scores: await collections.transactions.find({points: {'$ne': 0}}, {projection: {author: 1, points: 1, timestamp: 1, _id: 0}}).toArray()
			});
		}
		catch (err) {
			errors(err, res);
		}
	});
	app.get('/v1/scoreboard/:username', async (req, res) => {
		try {
			signer.unsign(req.headers.authorization);
			res.send({
				success: true,
				scores: await collections.transactions.find({points: {'$ne': 0}, author: req.params.username}, {projection: {points: 1, timestamp: 1, challenge: 1, type: 1, _id: 0}}).toArray()
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
				submissions: await collections.transactions.find({'$or': [{type: 'submission'}, {type: 'blocked_submission'}]}).toArray()
			});
		}
		catch (err) {
			errors(err, res);
		}
	});
app.listen(20001, () => console.info('Web server started'));
}).catch(err => {
	errors(err, res);
	console.error('\n\nError while connecting to MongoDB, exiting');
});