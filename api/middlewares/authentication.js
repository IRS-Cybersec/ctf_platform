
const { checkPermissions, deletePermissions, setPermissions } = require('./../utils/permissionUtils.js')

const authenticated = async (req, res, next) => {
    if (req.headers.authorization == undefined) throw new Error('MissingToken');
    let permissions = false
    try {
        permissions = await checkPermissions(req.headers.authorization)
    }
    catch(err) {
        console.error(err)
        return res.send({
            success: false,
            error: "BadToken"
        })
    }
    if (permissions === false) throw new Error('BadToken');
    res.locals.perms = permissions.type
    res.locals.username = permissions.username
    next()
}

module.exports = authenticated