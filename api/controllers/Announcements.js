const Connection = require('./../utils/mongoDB.js')
const MongoDB = require('mongodb')

const listVersion = async (req, res) => {
    const collections = Connection.collections
    //Check announcements version to determine if it needs update
    let version = NodeCacheObj.get("announcements")
    if (parseInt(req.params.version) !== version) {
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

const get = async (req, res) => {
    const collections = Connection.collections
    let announcement = await collections.announcements.findOne({ _id: MongoDB.ObjectId(req.params.id) }, { projection: { _id: 0 } })
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

const create = async (req, res) => {
    const collections = Connection.collections
    if (req.locals.perms < 2) throw new Error('Permissions');
    await collections.announcements.insertOne({
        title: req.body.title,
        content: req.body.content,
        timestamp: new Date()
    })
    let version = NodeCacheObj.get("announcements")
    NodeCacheObj.set("announcements", version + 1)
    if ((await collections.cache.updateOne({}, { '$set': { announcements: version + 1 } })).matchedCount > 0) {
        res.send({ success: true })
    }
    else res.send({ success: false })
}

const edit = async (req, res) => {
    const collections = Connection.collections
    if (req.locals.perms < 2) throw new Error('Permissions');
    if ((await collections.announcements.updateOne({ _id: MongoDB.ObjectId(req.body.id) }, {
        "$set": {
            title: req.body.title,
            content: req.body.content,
        }
    })).matchedCount === 0) throw new Error('NotFound');
    let version = NodeCacheObj.get("announcements")
    NodeCacheObj.set("announcements", version + 1)
    if ((await collections.cache.updateOne({}, { '$set': { announcements: version + 1 } })).matchedCount > 0) res.send({ success: true })
    else res.send({ success: false })
}

const deleteAnnouncement = async (req, res) => {
    const collections = Connection.collections
    if (req.locals.perms < 2) throw new Error('Permissions');
    if (!Array.isArray(req.body.ids)) throw new Error('Validation');
    let ids = req.body.ids.map((id) => { return MongoDB.ObjectId(id) })
    const delReq = await collections.announcements.deleteMany({ _id: { $in: ids } });
    if (delReq.deletedCount === 0) throw new Error('NotFound');

    let version = NodeCacheObj.get("announcements")
    NodeCacheObj.set("announcements", version + 1)
    if ((await collections.cache.updateOne({}, { '$set': { announcements: version + 1 } })).matchedCount > 0) res.send({ success: true })

}

module.exports = { listVersion, get, create, edit, deleteAnnouncement }