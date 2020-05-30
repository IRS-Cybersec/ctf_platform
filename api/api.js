const argon2 = require('argon2');
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const fs = require('fs');
const MongoClient = require('mongodb').MongoClient;

const app = express();
app.use(express.json());
app.use(session({
	resave: false,
	saveUninitialized: false,
	secret: 'supermassivepowerfulsecretuwu',
	// cookie: {secure: true}
}));
app.use(cors({
	credentials: true,
	origin: 'http://localhost'
}));

MongoClient.connect('mongodb://localhost:27017', {
	useNewUrlParser: true,
	useUnifiedTopology: true
}).then(client => {
	const db = client.db('ctf');
	const collections = {
		users: db.collection('users'),
		challs: db.collection('challs'),
		transactions: db.collection('transactions')
	};

	app.post('/account/create', async (req, res) => {
		try {
			await collections.users.insertOne({
				username: req.body.username,
				email: req.body.email,
				password: await argon2.hash(req.body.password),
				type: 0
			});
			res.send({success: true});
		}
		catch (err) {
			if (err.errmsg) {
				if (err.errmsg.includes('duplicate key error collection')) {
					if (Object.keys(err.keyPattern).includes('email'))
						res.send({
							success: false,
							error: 'email'
						});
					else if (Object.keys(err.keyPattern).includes('username'))
						res.send({
							success: false,
							error: 'username'
						});
					else res.send({
						success: false,
						error: 'unknown'
					});
				}
				else res.send({
					success: false,
					error: 'unknown'
				})
			}
			else res.send({
				success: false,
				error: 'unknown'
			});
		}
	});
	app.post('/account/taken/username', async (req, res) => {
		try {
			res.send({
				success: ture,
				taken: await collections.users.findOne({username: req.body.username}, {projection: {_id: 1}}) ? true : false
			});
		}
		catch (err) {
			console.error(err);
		}
	});
	app.post('/account/taken/email', async (req, res) => {
		try {
			res.send({
				success: ture,
				taken: await collections.users.findOne({email: req.body.email}, {projection: {_id: 1}}) ? true : false
			});
		}
		catch (err) {
			console.error(err);
		}
	});
	app.post('/account/login', async (req, res) => {
		try {
			req.session.regenerate(async err => {
				if (err) throw(err);
				const user = await collections.users.findOne({username: req.body.username}, {projection: {password: 1, type: 1, _id: 0}});
				if (!user) res.send({
					success: false,
					error: 'username'
				});
				else if (await argon2.verify(user.password, req.body.password)) {
					req.session.username = req.body.username;
					req.session.type = user.type;
					res.send({success: true});
				}
				else res.send({
					success: false,
					error: 'password'
				});
			});
		}
		catch (err) {
			console.error(err);
		}
	});
	app.post('/account/logout', async (req, res) => {
		try {
			req.session.destroy();
			res.send({success: true});
		}
		catch (err) {
			console.error(err);
		}
	});
	app.get('/account/type', async (req, res) => {
		try {
			if (!req.session.type) res.send({
				success: false,
				error: 'not_logged_in'
			});
			else switch (req.session.type) {
				case 0:
					res.send({
						success: true,
						type: 'user'
					});
					break;
				case 1:
					res.send({
						success: true,
						type: 'elevated'
					});
					break;
				case 2:
					res.send({
						success: true,
						type: 'admin'
					});
					break;
				default:
					break;
			}
		}
		catch (err) {
			console.error(err);
		}
	});
	app.get('/account/profile', async (req, res) => {
		try {
			
		}
		catch (err) {
			console.error(err);
		}
	});
	app.post('/account/promote', async (req, res) => {
		try {
			
		}
		catch (err) {
			console.error(err);
		}
	});
	app.post('/account/delete', async (req, res) => {
		try {
			
		}
		catch (err) {
			console.error(err);
		}
	});

	// Note to self: there should be a better way of doing this
	app.get('/challenge/list', async (req, res) => {
		if (!req.session.username) {
			res.status(403);
			res.send({
				success: false,
				error: 'auth'
			});
			return;
		}
		try {
			let resChalls = [];
			const challs = (await collections.challs.find({visibility: true}, {projection: {name: 1, category: 1, points: 1, solves: 1, _id: 0}}).toArray()).forEach(chall =>
				resChalls.push({
					name: chall.name,
					category: chall.category,
					points: chall.points,
					solved: chall.solves.includes(req.session.username)
				}));
			res.send(resChalls);
		}
		catch (err) {
			console.error(err);
		}
	});
	app.get('/challenge/show/:chall', async (req, res) => {
		if (!req.session.username) {
			res.status(403);
			res.send({
				success: false,
				error: 'auth'
			});
			return;
		}
		try {
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
				if (hint.purchased.includes(req.session.username)) delete hint.cost;
				else delete hint.hint;
				delete hint.purchased;
			});
			res.send(chall);
		}
		catch (err) {
			console.error(err);
		}
	});
	app.post('/challenge/hint', async (req, res) => {
		if (!req.session.username) {
			res.status(403);
			res.send({
				success: false,
				error: 'auth'
			});
			return;
		}
		try {
			let hints = (await collections.challs.findOne({visibility: true, name: req.body.chall}, {projection: {hints: 1, _id: 0}}));
			if (!hints) {
				res.status(400);
				res.send({
					success: false,
					error: 'notfound'
				});
				return;
			}
			hints = hints.hints;
			if (req.body.id > hints.length - 1) {
				res.status(400);
				res.send({
					success: false,
					error: 'outofrange'
				});
			}
			else if (hints[req.body.id].purchased.includes(req.session.username)) {
				res.status(400);
				res.send({
					success: false,
					error: 'bought'
				});
			}
			else {
				await collections.users.updateOne(
					{username: req.session.username},
					{'$inc': {score: -hints[req.body.id].cost}},
				);
				const updateRef = {};
				updateRef[`hints.${req.body.id}.purchased`] = req.session.username;
				await collections.challs.updateOne(
					{name: req.body.chall},
					{'$push': updateRef}
				)
				await collections.transactions.insertOne({
					author: req.session.username,
					challenge: req.body.chall,
					type: 'hint',
					timestamp: new Date(),
					points: -hints[req.body.id].cost,
					hint_id: req.body.id
				});
				res.send({
					success: true,
					hint: hints[req.body.id].hint
				});
			}
		}
		catch (err) {
			console.error(err);
		}
	});
	app.post('/challenge/submit', async (req, res) => {
		if (!req.session.username) {
			res.status(403);
			res.send({
				success: false,
				error: 'auth'
			});
			return;
		}
		try {
			const chall = await collections.challs.findOne({visibility: true, name: req.params.chall}, {projection: {flags: 1, _id: 0}});
			if (!chall) {
				res.status(400);
				res.send({
					success: false,
					error: 'notfound'
				});
				return;
			}
			async function addPoints() {
				await collections.transactions.insertOne({
					author: req.session.username,
					challenge: req.body.chall,
					type: 'hint',
					timestamp: new Date(),
					points: -hints[req.body.id].cost,
					hint_id: req.body.id
				});
			}
			let solved = false;
			if (flags.includes(req.params.flag)) {
				await addPoints();
				res.send({success: true});
				solved = true;
			}
			else if (chall.flags[0].substring(0, 1) == '$') chall.flags.some(flag => {
				if (argon2.verify(flag, req.params.flag)) {
					addPoints();
					res.send({success: true});
					solved = true;
					return;
				}
			});
			if (!solved) res.send({
				success: false,
				error: 'wrong_flag'
			});
			res.send(chall);
		}
		catch (err) {
			console.error(err);
		}
	});
	app.post('/challenge/new', async (req, res) => {
		if (!req.session.username) {
			res.status(403);
			res.send({
				success: false,
				error: 'auth'
			});
			return;
		}
		try {

		}
		catch (err) {
			console.error(err);
		}
	});

	app.get('/scoreboard', async (req, res) => {
		try {
			
		}
		catch (err) {
			console.error(err);
		}
	});
app.listen(20001, () => console.info('Server started!'));
}).catch(err => {
	console.error(err);
	console.error('\n\nError while connecting to MongoDB, exiting');
});