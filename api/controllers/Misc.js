const Connection = require('./../utils/mongoDB.js')
const sharp = require('sharp');
const sanitizeFile = require('sanitize-filename');
const path = require('path');
const MongoDB = require('mongodb');
const fs = require('fs');
const nodemailer = require('nodemailer');
const createTransactionsCache = require('./../utils/createTransactionsCache.js')
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
    emailSender: "John Smith",
    emailCooldown: 180,
    emailResetTime: 600,
    emailVerify: false,
    teamChangeDisable: false,
    loginDisable: false,
    categoryList: ["Secondary School", "JC/Poly/ITE"],
    categorySwitchDisable: false,
    disableNonCatFB: false
}


const adminSettings = async (req, res) => {
    const collections = Connection.collections
    if (req.locals.perms < 2) throw new Error('Permissions');
    const allowedSettings = ["disableNonCatFB", "categorySwitchDisable", "categoryList", "loginDisable", "teamChangeDisable", "emailVerify", "emailCooldown", "emailResetTime", "websiteLink", "emailSender", "emailSenderAddr", "forgotPass", "SMTPHost", "SMTPUser", "SMTPPass", "SMTPPort", "SMTPSecure", "registerDisable", "adminShowDisable", "submissionDisabled", "uploadSize", "uploadPath", "maxSockets", "teamMode", "teamMaxSize"]
    if (!allowedSettings.includes(req.body.setting)) return res.send({ success: false, error: "invalid-setting" })
    NodeCacheObj.set(req.body.setting, req.body.disable)

    const set = {}
    set[req.body.setting] = req.body.disable
    if ((await collections.cache.updateOne({}, { "$set": set })).matchedCount > 0) {
        if (req.body.setting === "teamMode") {
            if (req.body.disable) { // Enable team mode
                const usernameTeamCache = NodeCacheObj.get("usernameTeamCache")
                let transactionsCache = NodeCacheObj.get("transactionsCache")
                for (username in transactionsCache) {
                    const current = transactionsCache[username].changes
                    for (let i = 0; i < current.length; i++) {
                        if (current[i].author in usernameTeamCache) {
                            current[i].originalAuthor = current[i].author
                            current[i].author = usernameTeamCache[current[i].author] // set author to the team the user is in
                            await collections.transactions.updateOne({ _id: current[i]._id }, { $set: { author: current[i].author, originalAuthor: current[i].originalAuthor } })
                        }
                    }
                }


            }
            else { // team mode disabled
                let transactionsCache = NodeCacheObj.get("transactionsCache")
                for (username in transactionsCache) {
                    const current = transactionsCache[username].changes
                    for (let i = 0; i < current.length; i++) {
                        if ("originalAuthor" in current[i]) {
                            current[i].author = current[i].originalAuthor
                            await collections.transactions.updateOne({ _id: current[i]._id }, { $set: { author: current[i].author }, $unset: { originalAuthor: 0 } })
                            delete current[i].originalAuthor
                        }
                    }
                }

            }
            NodeCacheObj.set("transactionsCache", await createTransactionsCache())
        } // re-create nodemailer transport
        else if (req.body.setting === "SMTPPort" || req.body.setting === "SMTPSecure" || req.body.setting === "SMTPUser" || req.body.setting === "SMTPHost" || req.body.setting === "SMTPPass") {
            NodeCacheObj.set("NodemailerT", nodemailer.createTransport({
                host: NodeCacheObj.get("SMTPHost"),
                port: NodeCacheObj.get("SMTPPort"),
                secure: NodeCacheObj.get("SMTPSecure"),
                auth: {
                    user: NodeCacheObj.get("SMTPUser"),
                    pass: NodeCacheObj.get("SMTPPass")
                }
            }))
        }
        else if (req.body.setting === "emailResetTime") {
            await collections.passResetCode.dropIndex("expiryTime")
            await collections.passResetCode.createIndex({ "timestamp": 1 }, { expireAfterSeconds: req.body.disable, name: "expiryTime" })
        }
        else if (req.body.setting === "adminShowDisable") NodeCacheObj.set("transactionsCache", await createTransactionsCache())
        res.send({
            success: true
        });
    }
    else {
        throw new Error('Unknown');
    }
}

const profileUpload = async (req, res) => {
    if (!req.raw.files || !("profile_pic" in req.raw.files)) return res.send({ success: false, error: "no-file" })
    if (Object.keys(req.raw.files).length !== 1) return res.send({ success: false, error: "only-1-file" })
    let targetFile = req.raw.files.profile_pic
    if (targetFile.size > NodeCacheObj.get("uploadSize")) return res.send({ success: false, error: "too-large", size: NodeCacheObj.get("uploadSize") })
    let allowedExts = ['.png', '.jpg', '.jpeg', '.webp']
    if (!allowedExts.includes(path.extname(targetFile.name))) return res.send({ success: false, error: "invalid-ext" })

    await sharp(targetFile.data)
        .toFormat('webp')
        .webp({ quality: 30 })
        .toFile(path.join(NodeCacheObj.get("uploadPath"), sanitizeFile(req.locals.username)) + ".webp")
        .catch((err) => {
            console.error(err)
            return res.send({ success: false, error: "file-upload" })
        })
    return res.send({ success: true })
}

const deleteProfileUpload = async (req, res) => {
    fs.rm(path.join(NodeCacheObj.get("uploadPath"), sanitizeFile(req.locals.username)) + ".webp", (err) => {
        if (err) {
            if (err.code === "ENOENT") return res.send({ success: false, error: "already-default" })
            else {
                console.error(err)
                return res.send({ success: false, error: "unknown" })
            }
        }
        else return res.send({ success: true })
    })

}

const downloadBackup = async (req, res) => {
    const collections = Connection.collections
    if (req.locals.perms < 2) throw new Error('Permissions');
    let backupData = {
        announcements: await collections.announcements.find({}).toArray(),
        cache: await collections.cache.find({}).toArray(),
        challs: await collections.challs.find({}).toArray(),
        transactions: await collections.transactions.find({}).toArray(),
        users: await collections.users.find({}).toArray(),
        team: await collections.team.find({}).toArray(),
        passResetCode: await collections.passResetCode.find({}).toArray()
    }
    return res.send({ success: true, data: backupData })
}

const uploadBackup = async (req, res) => {
    const collections = Connection.collections
    if (req.locals.perms < 2) throw new Error('Permissions');
    let backupData = {
        announcements: req.body.announcements.map((document) => { document._id = MongoDB.ObjectId(document._id); document.timestamp = new Date(document.timestamp); return document }),
        cache: req.body.cache.map((document) => { document._id = MongoDB.ObjectId(document._id); return document }),
        challs: req.body.challs.map((document) => { document._id = MongoDB.ObjectId(document._id); document.created = new Date(document.created); return document }),
        transactions: req.body.transactions.map((document) => { document._id = MongoDB.ObjectId(document._id); document.timestamp = new Date(document.timestamp); return document }),
        users: req.body.users.map((document) => { document._id = MongoDB.ObjectId(document._id); return document }),
        team: req.body.team.map((document) => { document._id = MongoDB.ObjectId(document._id); return document }),
        passResetCode: req.body.passResetCode.map((document) => { document._id = MongoDB.ObjectId(document._id); document.timestamp = new Date(document.timestamp); return document }),
    }
    
    await collections.announcements.deleteMany({})
    await collections.cache.deleteMany({})
    await collections.challs.deleteMany({})
    await collections.transactions.deleteMany({})
    await collections.users.deleteMany({})
    await collections.team.deleteMany({})
    await collections.passResetCode.deleteMany({})

    if (backupData.announcements.length > 0) await collections.announcements.insertMany(backupData.announcements)
    if (backupData.cache.length > 0) await collections.cache.insertMany(backupData.cache)
    if (backupData.challs.length > 0) await collections.challs.insertMany(backupData.challs)
    if (backupData.transactions.length > 0) await collections.transactions.insertMany(backupData.transactions)
    if (backupData.users.length > 0) await collections.users.insertMany(backupData.users)
    if (backupData.team.length > 0) await collections.team.insertMany(backupData.team)
    if (backupData.passResetCode.length > 0) await collections.passResetCode.insertMany(backupData.passResetCode)

    

    // Update all caches (copied from api.js)
    
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

    const createCache = async () => {
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

	NodeCacheObj.set("usernameTeamCache", usernameTeamCache)
	NodeCacheObj.set("teamListCache", teamListCache)

    NodeCacheObj.set("transactionsCache", await createTransactionsCache())

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

    // Create challenge cache
	const cursor = collections.challs.find({}, { projection: { solves: 1 } })
	let challengeCache = {}
	await cursor.forEach((doc) => {
		challengeCache[doc._id] = { solves: doc.solves }
	})
	NodeCacheObj.set("challengeCache", challengeCache)



    return res.send({ success: true })
}

const about = async (req, res) => {
    res.send({
        success: true,
        version: 'dev'
    });
}

module.exports = { deleteProfileUpload, adminSettings, profileUpload, about, downloadBackup, uploadBackup }
