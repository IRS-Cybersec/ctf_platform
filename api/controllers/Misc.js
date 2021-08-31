const Connection = require('./../utils/mongoDB.js')
const sharp = "sharp" //require('sharp');
const sanitizeFile = require('sanitize-filename');
const path = require('path');


const adminSettings = async (req, res, next) => {
    const collections = Connection.collections
    try {
        if (res.locals.perms < 2) throw new Error('Permissions');
        const allowedSettings = ["registerDisable", "adminShowDisable", "submissionDisabled", "uploadSize", "uploadPath"]
        if (!allowedSettings.includes(req.body.setting)) return res.send({ success: false, error: "invalid-setting" })
        req.app.set(req.body.setting, req.body.disable)

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
}

const profileUpload = async (req, res, next) => {
    if (!req.files || !("profile_pic" in req.files)) res.send({ success: false, error: "no-file" })
    if (Object.keys(req.files).length !== 1) res.send({ success: false, error: "only-1-file" })
    let targetFile = req.files.profile_pic
    if (targetFile.size > app.get("uploadSize")) res.send({ success: false, error: "too-large", size: app.get("uploadSize") })
    let allowedExts = ['.png', '.jpg', '.jpeg', '.webp']
    if (!allowedExts.includes(path.extname(targetFile.name))) res.send({ success: false, error: "invalid-ext" })

    await sharp(targetFile.data)
        .toFormat('webp')
        .webp({ quality: 30 })
        .toFile(path.join(app.get("uploadPath"), sanitizeFile(res.locals.username)) + ".webp")
        .catch((err) => {
            console.error(err)
            return res.send({ success: false, error: "file-upload" })
        })
    res.send({ success: true })
}

const about = async (req, res, next) => {
    res.send({
        success: true,
        version: 'dev'
    });
}

module.exports = {adminSettings, profileUpload, about}
