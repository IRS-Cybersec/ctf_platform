const express = require('express');
const mongoSanitize = require('express-mongo-sanitize');
const fileUpload = require('express-fileupload')

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
const { createSigner } = require('./utils/permissionUtils.js')

const app = express();
let server = app.listen(20001, () => console.info('Web server started'));

app.use(express.json({ limit: "30mb" }));
app.use(fileUpload());
app.use(mongoSanitize());

if (process.env.NODE_ENV === "development") {
	const cors = require("cors")
	app.use(cors())
}

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
		categoryMeta: {}
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
			app.set(key, cache[key])
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
			app.set(key, checkCache[key])
		}
	}
	app.set("transactionsCache", await collections.transactions.find({}).toArray())
	return true
}

const main = async () => {
	if (await Connection.open()) {
		await startCache()
		await startupChecks.startValidation(app)
		await challenges.createChallengeCache()
		await createSigner()

		app.post('/v1/account/login', accounts.login);
		app.post('/v1/account/create', accounts.create);

		// Accounts endpoints
		app.get('/v1/account/disableStates', authenticated, accounts.disableStates);
		app.post('/v1/account/taken/username', authenticated, accounts.takenUsername);
		app.post('/v1/account/taken/email', authenticated, accounts.takenEmail);
		app.post('/v1/account/delete', authenticated, accounts.deleteAccount);
		app.get('/v1/account/type', authenticated, accounts.type);
		app.post('/v1/account/password', authenticated, accounts.password);
		app.post('/v1/account/adminChangePassword', authenticated, accounts.adminChangePassword);
		app.get('/v1/account/list', authenticated, accounts.list);
		app.post('/v1/account/permissions', authenticated, accounts.permissions);

		// Challenge endpoints
		app.get('/v1/challenge/disableStates', authenticated, challenges.disableStates);
		app.get('/v1/challenge/list/', authenticated, challenges.list);
		app.get('/v1/challenge/list/:category', authenticated, challenges.listCategory);
		app.get('/v1/challenge/list_categories', authenticated, challenges.listCategories);
		app.get('/v1/challenge/list_all', authenticated, challenges.listAll);
		app.get('/v1/challenge/listCategoryInfo', authenticated, challenges.listCategoryInfo);
		app.get('/v1/challenge/show/:chall', authenticated, challenges.show);
		app.get('/v1/challenge/show/:chall/detailed', authenticated, challenges.showDetailed);
		app.post('/v1/challenge/hint', authenticated, challenges.hint);
		app.post('/v1/challenge/submit', authenticated, challenges.submit);
		app.post('/v1/challenge/new', authenticated, challenges.newChall);
		app.post('/v1/challenge/edit', authenticated, challenges.edit);
		app.post('/v1/challenge/edit/visibility', authenticated, challenges.editVisibility);
		app.post('/v1/challenge/edit/category', authenticated, challenges.editCategory);
		app.post('/v1/challenge/edit/categoryVisibility', authenticated, challenges.editCategoryVisibility);
		app.post('/v1/challenge/delete', authenticated, challenges.deleteChall);

		// Announcement endpoints
		app.get('/v1/announcements/list/:version', authenticated, announcemnets.listVersion);
		app.get('/v1/announcements/get/:id', authenticated, announcemnets.get);
		app.post('/v1/announcements/create', authenticated, announcemnets.create);
		app.post('/v1/announcements/edit', authenticated, announcemnets.edit);
		app.post('/v1/announcements/delete', authenticated, announcemnets.deleteAnnouncement);

		// Scoreboard endpoints
		app.get('/v1/scoreboard', authenticated, scoreboard.scoreboard);
		app.get('/v1/scoreboard/:username', authenticated, scoreboard.userScoreboard);
		app.get('/v1/userPoints/:username', authenticated, scoreboard.userPoints);

		// Misc endpoints
		app.get('/v1/backup/', authenticated, misc.downloadBackup)
		app.post('/v1/uploadBackup/', authenticated, misc.uploadBackup)
		app.post('/v1/adminSettings/', authenticated, misc.adminSettings)
		app.get('/v1/submissions', authenticated, submissions.submissions);
		app.post('/v1/submissions/new', authenticated, submissions.newSubmission);
		app.post('/v1/submissions/edit', authenticated, submissions.editSubmission);
		app.post('/v1/submissions/delete', authenticated, submissions.deleteSubmission);
		app.get('/v1/about', authenticated, misc.about);
		app.post('/v1/profile/upload', authenticated, misc.profileUpload)

		sockets.startup(server, app)

		app.use(errorHandling.unknownEndpoint)
		app.use(errorHandling.errorHandler)

		console.info('Initialization complete');
	}
	else {
		console.info("Error: MongoDB failed to connect, stopping...")
		process.exit(0)
	}
}
main()


