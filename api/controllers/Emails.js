const Connection = require('./../utils/mongoDB.js')

const disableStates = async (req, res) => {
    if (req.locals.perms < 2) throw new Error('Permissions');
    res.send({
        success: true,
        states: {
            host: NodeCacheObj.get("SMTPHost"),
            port: NodeCacheObj.get("SMTPPort"),
            secure: NodeCacheObj.get("SMTPSecure"),
            user: NodeCacheObj.get("SMTPUser"),
            pass: NodeCacheObj.get("SMTPPass")
        }
    });
}

module.exports = { disableStates }