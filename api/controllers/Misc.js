const Connection = require('./../utils/mongoDB.js')
const sharp = require('sharp');
const sanitizeFile = require('sanitize-filename');
const path = require('path');
const MongoDB = require('mongodb');
const fs = require('fs');
const nodemailer = require('nodemailer');

const adminSettings = async (req, res) => {
    const collections = Connection.collections
    if (req.locals.perms < 2) throw new Error('Permissions');
    const allowedSettings = ["forgotPass", "SMTPHost", "SMTPUser", "SMTPPass", "SMTPPort", "SMTPSecure", "registerDisable", "adminShowDisable", "submissionDisabled", "uploadSize", "uploadPath", "maxSockets", "teamMode", "teamMaxSize"]
    if (!allowedSettings.includes(req.body.setting)) return res.send({ success: false, error: "invalid-setting" })
    NodeCacheObj.set(req.body.setting, req.body.disable)

    const set = {}
    set[req.body.setting] = req.body.disable
    if ((await collections.cache.updateOne({}, { "$set": set })).matchedCount > 0) {
        if (req.body.setting === "teamMode") {
            if (req.body.disable) { // Enable team mode
                const usernameTeamCache = NodeCacheObj.get("usernameTeamCache")
                let transactionsCache = NodeCacheObj.get("transactionsCache")
                for (let i = 0; i < transactionsCache.length; i++) {
                    if (transactionsCache[i].author in usernameTeamCache) {
                        transactionsCache[i].originalAuthor = transactionsCache[i].author
                        transactionsCache[i].author = usernameTeamCache[transactionsCache[i].author] // set author to the team the user is in
                        await collections.transactions.updateOne({ _id: transactionsCache[i]._id }, { $set: { author: transactionsCache[i].author, originalAuthor: transactionsCache[i].originalAuthor } })
                    }
                }

            }
            else { // team mode disabled
                let transactionsCache = NodeCacheObj.get("transactionsCache")
                for (let i = 0; i < transactionsCache.length; i++) {
                    if ("originalAuthor" in transactionsCache[i]) {
                        transactionsCache[i].author = transactionsCache[i].originalAuthor
                        await collections.transactions.updateOne({ _id: transactionsCache[i]._id }, { $set: { author: transactionsCache[i].author }, $unset: { originalAuthor: 0 } })
                        delete transactionsCache[i].originalAuthor
                    }
                }

            }
        } // re-create nodemailer transport
        else if (req.body.setting === "SMTPUser" || req.body.setting === "SMTPHost" || req.body.setting === "SMTPPass") {
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
        users: await collections.users.find({}).toArray()
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
        users: req.body.users.map((document) => { document._id = MongoDB.ObjectId(document._id); return document })
    }

    await collections.announcements.deleteMany({})
    await collections.cache.deleteMany({})
    await collections.challs.deleteMany({})
    await collections.transactions.deleteMany({})
    await collections.users.deleteMany({})

    await collections.announcements.insertMany(backupData.announcements)
    await collections.cache.insertMany(backupData.cache)
    await collections.challs.insertMany(backupData.challs)
    await collections.transactions.insertMany(backupData.transactions)
    await collections.users.insertMany(backupData.users)

    NodeCacheObj.set("transactionsCache", backupData.transactions)

    return res.send({ success: true })
}

const about = async (req, res) => {
    res.send({
        success: true,
        version: 'dev'
    });
}

module.exports = { deleteProfileUpload, adminSettings, profileUpload, about, downloadBackup, uploadBackup }
