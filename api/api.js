const fastify = require('fastify')()
const mongoSanitize = require('express-mongo-sanitize');
const fastifyFileUpload = require('fastify-file-upload');

const Connection = require('./utils/mongoDB.js')
const errorHandling = require('./middlewares/errorHandling.js');
const startupChecks = require('./utils/startupChecks.js')
const accounts = require('./controllers/Accounts.js')
const challenges = require('./controllers/Challenges.js')
const misc = require('./controllers/Misc.js')
const announcemnets = require('./controllers/Announcements.js')
const scoreboard = require('./controllers/Scoreboard.js')
const submissions = require('./controllers/Submissions.js')
const sockets = require('./controllers/Sockets.js')
const authenticated = require('./middlewares/authentication.js')
const teams = require('./controllers/Teams.js')
const emails = require('./controllers/Emails.js')
const { createSigner } = require('./utils/permissionUtils.js')
const NodeCache = require('node-cache');
const nodemailer = require('nodemailer');

global.NodeCacheObj = new NodeCache({ checkperiod: 0, useClones: false })

const startCache = async () => {

	let cache = {
		announcements: 0,
		challenges: 0,
		registerDisable: false,
		adminShowDisable: false,
		submissionDisabled: false,
		uploadSize: 512000,
		latestSolveSubmissionID: 0,
		maxSockets: 5,
		uploadPath: "/usr/share/nginx/static/profile",
		categoryUploadPath: "/usr/share/nginx/static/category",
		categoryMeta: {},
		teamMode: false,
		teamMaxSize: 3,
		teamUpdateID: 0,
		forgotPass: false,
		SMTPHost: "ctf.example.com",
		SMTPUser: "user",
		SMTPPass: "examplepass",
		SMTPSecure: false,
		SMTPPort: 587,
		websiteLink: "https://ctf.example.com",
		emailSenderAddr: "noreply@ctf.example.com",
		emailSender: "John Smith"
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
	if (checkCache === null) {
		await createCache() //First time set-up: (1) Create Cache 
		for (const key in cache) {
			NodeCacheObj.set(key, cache[key])
		}
	}
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
			NodeCacheObj.set(key, checkCache[key])
		}
	}

	// Create challenge cache
	const cursor = collections.challs.find({}, { projection: { solves: 1 } })
	let challengeCache = {}
	await cursor.forEach((doc) => {
		challengeCache[doc._id] = { solves: doc.solves }
	})
	NodeCacheObj.set("challengeCache", challengeCache)

	// Create transactions cache
	const transactionsCursor = collections.transactions.find({})
    let transactionsCache = []
    await transactionsCursor.forEach((doc) => {
		const insertDoc = {
			_id: doc._id,
            author: doc.author,
            points: doc.points,
            challenge: doc.challenge,
            timestamp: doc.timestamp,
            challengeID: doc.challengeID,
			lastChallengeID: doc.lastChallengeID,
			type: doc.type
		}
		if ("originalAuthor" in doc) insertDoc.originalAuthor = doc.originalAuthor
        transactionsCache.push(insertDoc)
    })
	NodeCacheObj.set("transactionsCache", transactionsCache)

	// Create teams cache
	let usernameTeamCache = {}
	let teamListCache = {}
	const userCursor = collections.team.find({}, { projection: { name: 1, members: 1, code: 1 } })
	await userCursor.forEach((doc) => {
		teamListCache[doc.name] = { members: doc.members, code: doc.code }
		// create username-team mapping
		// this does not guarentee that every username will have a mapping
		for (let i = 0; i < doc.members.length; i++) {
			usernameTeamCache[doc.members[i]] = doc.name
		}
	})
	NodeCacheObj.set("usernameTeamCache", usernameTeamCache)
	NodeCacheObj.set("teamListCache", teamListCache)

	// Create nodemailer object
	NodeCacheObj.set("NodemailerT", nodemailer.createTransport({
		host: NodeCacheObj.get("SMTPHost"),
		port: NodeCacheObj.get("SMTPPort"),
		secure: NodeCacheObj.get("SMTPSecure"),
		auth: {
			user: NodeCacheObj.get("SMTPUser"),
			pass: NodeCacheObj.get("SMTPPass")
		}
	}))


	return true
}

const main = async () => {
	fastify.setErrorHandler(errorHandling.errorHandler)
	// mongoSanitize hook
	fastify.addHook('preHandler', (request, reply, done) => {
		mongoSanitize.sanitize(request.body, {});
		done()
	})

	await fastify.register(fastifyFileUpload)
	if (process.env.NODE_ENV === "development") {
		const cors = require("fastify-cors")
		await fastify.register(cors)
	}

	if (await Connection.open()) {
		await startCache()
		await startupChecks.startValidation()
		await createSigner()

		// Unauthenticated routes
		fastify.register((instance, opts, done) => {
			fastify.post('/v1/account/login', accounts.login);
			fastify.post('/v1/account/create', accounts.create);
			fastify.post('/v1/account/forgot/pass', emails.forgotPassword)
			fastify.post('/v1/account/forgot/check', emails.checkPassResetLink)
			done()
		})

		// Authenticated routes
		fastify.register((instance, opts, done) => {
			// register auth routes to only this context
			instance.decorateRequest('locals', null)
			instance.addHook('preHandler', authenticated) // authentication hook
			// Accounts endpoints
			instance.get('/v1/account/disableStates', accounts.disableStates);
			instance.post('/v1/account/taken/username', accounts.takenUsername);
			instance.post('/v1/account/taken/email', accounts.takenEmail);
			instance.post('/v1/account/delete', accounts.deleteAccount);
			instance.get('/v1/account/type', accounts.type);
			instance.post('/v1/account/password', accounts.password);
			instance.post('/v1/account/adminChangePassword', accounts.adminChangePassword);
			instance.get('/v1/account/list', accounts.list);
			instance.post('/v1/account/permissions', accounts.permissions);

			// Challenge endpoints
			instance.get('/v1/challenge/disableStates', challenges.disableStates);
			instance.get('/v1/challenge/list', challenges.list);
			instance.get('/v1/challenge/list/:category', challenges.listCategory);
			instance.get('/v1/challenge/list_categories', challenges.listCategories);
			instance.get('/v1/challenge/list_all', challenges.listAll);
			instance.get('/v1/challenge/listCategoryInfo', challenges.listCategoryInfo);
			instance.get('/v1/challenge/show/:chall', challenges.show);
			instance.get('/v1/challenge/show/:chall/detailed', challenges.showDetailed);
			instance.post('/v1/challenge/hint', challenges.hint);
			instance.post('/v1/challenge/submit', challenges.submit);
			instance.post('/v1/challenge/new', challenges.newChall);
			instance.post('/v1/challenge/edit', challenges.edit);
			instance.post('/v1/challenge/edit/visibility', challenges.editVisibility);
			instance.post('/v1/challenge/edit/category', challenges.editCategory);
			instance.post('/v1/challenge/edit/categoryVisibility', challenges.editCategoryVisibility);
			instance.post('/v1/challenge/delete', challenges.deleteChall);

			// Announcement endpoints
			instance.get('/v1/announcements/list/:version', announcemnets.listVersion);
			instance.get('/v1/announcements/get/:id', announcemnets.get);
			instance.post('/v1/announcements/create', announcemnets.create);
			instance.post('/v1/announcements/edit', announcemnets.edit);
			instance.post('/v1/announcements/delete', announcemnets.deleteAnnouncement);

			// Scoreboard endpoints
			instance.get('/v1/scoreboard', scoreboard.scoreboard);
			instance.get('/v1/scoreboard/:username', scoreboard.userScoreboard);
			instance.get('/v1/userPoints/:username', scoreboard.userPoints);

			// Team endpoints
			instance.get('/v1/team/userTeam', teams.userTeam);
			instance.post('/v1/team/join', teams.join);
			instance.post('/v1/team/create', teams.create);
			instance.post('/v1/team/leave', teams.leave);
			instance.get('/v1/team/info/:team', teams.get);
			instance.post('/v1/team/linkInfo', teams.linkInfo);

			// Email endpoints
			instance.get('/v1/email/disableStates', emails.disableStates);
			instance.get('/v1/email/test', emails.testConnection);

			// Misc endpoints
			instance.get('/v1/backup', misc.downloadBackup)
			instance.post('/v1/uploadBackup', misc.uploadBackup)
			instance.post('/v1/adminSettings', misc.adminSettings)
			instance.get('/v1/submissions', submissions.submissions);
			instance.post('/v1/submissions/new', submissions.newSubmission);
			instance.post('/v1/submissions/edit', submissions.editSubmission);
			instance.post('/v1/submissions/delete', submissions.deleteSubmission);
			instance.get('/v1/about', misc.about);
			instance.post('/v1/profile/upload', misc.profileUpload);
			instance.get('/v1/profile/deleteUpload', misc.deleteProfileUpload);
			done()
		})
		sockets.startup(fastify.server)

		try {
			await fastify.listen(20001, '0.0.0.0')
			console.log("Web server started")
		} catch (err) {
			console.log("Error starting web server... exiting")
			console.error(err)
			process.exit(1)
		}

		console.info('Initialization complete');
	}
	else {
		console.info("Error: MongoDB failed to connect, stopping...")
		process.exit(0)
	}
}
main()


