const express = require('express');
const mongoSanitize = require('express-mongo-sanitize');
const fileUpload = require('express-fileupload')

const cors = require('cors');
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

const app = express();
let server = app.listen(20001, () => console.info('Web server started'));

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
		maxSockets: 5,
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
		await startCache()
		await startupChecks.startValidation()
		await challenges.refreshSolves()

		app.post('/v1/account/login', accounts.login);
		app.post('/v1/account/create', accounts.create);

		app.use(authenticated);

		// Accounts endpoints
		app.get('/v1/account/disableStates', accounts.disableStates);
		app.post('/v1/account/taken/username', accounts.takenUsername);
		app.post('/v1/account/taken/email', accounts.takenEmail);
		app.post('/v1/account/delete', accounts.deleteAccount);
		app.get('/v1/account/type', accounts.type);
		app.post('/v1/account/password', accounts.password);
		app.post('/v1/account/adminChangePassword', accounts.adminChangePassword);
		app.get('/v1/account/list', accounts.list);
		app.post('/v1/account/permissions', accounts.permissions);

		// Challenge endpoints
		app.get('/v1/challenge/disableStates', challenges.disableStates);
		app.get('/v1/challenge/list/', challenges.list);
		app.get('/v1/challenge/list/:category', challenges.listCategory);
		app.get('/v1/challenge/list_categories', challenges.listCategories);
		app.get('/v1/challenge/list_all', challenges.listAll);
		app.get('/v1/challenge/list_all_categories', challenges.listAllCategories);
		app.get('/v1/challenge/show/:chall', challenges.show);
		app.get('/v1/challenge/show/:chall/detailed', challenges.showDetailed);
		app.post('/v1/challenge/hint', challenges.hint);
		app.post('/v1/challenge/submit', challenges.submit);
		app.post('/v1/challenge/new', challenges.newChall);
		app.post('/v1/challenge/edit', challenges.edit);
		app.post('/v1/challenge/edit/visibility', challenges.editVisibility);
		app.post('/v1/challenge/edit/category', challenges.editCategory);
		app.post('/v1/challenge/delete', challenges.deleteChall);

		// Announcement endpoints
		app.get('/v1/announcements/list/:version', announcemnets.listVersion);
		app.get('/v1/announcements/get/:id', announcemnets.get);
		app.post('/v1/announcements/create', announcemnets.create);
		app.post('/v1/announcements/edit', announcemnets.edit);
		app.post('/v1/announcements/delete', announcemnets.deleteAnnouncement);

		// Scoreboard endpoints
		app.get('/v1/scoreboard', scoreboard.scoreboard);
		app.get('/v1/scores', scoreboard.scores);
		app.get('/v1/scoreboard/:username', scoreboard.userScoreboard);
		app.get('/v1/scores/:username', scoreboard.userScore);

		// Misc endpoints
		app.get('/v1/backup/', misc.downloadBackup)
		app.post('/v1/uploadBackup/', misc.uploadBackup)
		app.post('/v1/adminSettings/', misc.adminSettings)
		app.get('/v1/submissions', submissions.submissions);
		app.post('/v1/submissions/new', submissions.newSubmission);
		app.get('/v1/submissions/delete', submissions.deleteSubmission);
		app.get('/v1/about', misc.about);
		app.post('/v1/profile/upload', misc.profileUpload)

		sockets.startup(server, app)

		app.use(errorHandling.unknownEndpoint)
		app.use(errorHandling.errorHandler)

		console.info('Initialization complete');
	}
	else {
		console.info("Error: MongoDB failed to connect, stopping...")
	}
}
main()


