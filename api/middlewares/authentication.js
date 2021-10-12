
const { checkPermissions, deletePermissions, setPermissions } = require('./../utils/permissionUtils.js')

const authenticated = async (req, res) => {
    if (req.headers.authorization == undefined) throw new Error('MissingToken');
    let permissions = false
    try {
        permissions = await checkPermissions(req.headers.authorization)
    }
    catch (err) {
        throw new Error('BadToken');
    }
    if (permissions === false) throw new Error('BadToken');
    req.locals = {}
    req.locals.perms = permissions.type
    req.locals.username = permissions.username
}

module.exports = authenticated