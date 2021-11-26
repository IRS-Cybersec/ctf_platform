const Connection = require('./mongoDB.js')
const RD = require('reallydangerous');
const crypto = require('crypto');
let signer = null;
let permissions = {};

const checkPermissions = async (token) => {
    // Check perms of a token
    const username = signer.unsign(token);

    if (username in permissions) return { type: permissions[username], username: username };
    const type = (await Connection.collections.users.findOne({ username: username }, { projection: { type: 1, _id: 0 } }));
    if (type == null) return false;
    else {
        permissions[username] = type.type;
        return { type: type.type, username: username };
    }
}

const checkUsernamePerms = async (username) => {
    // Check perms of a username
    if (username in permissions) return permissions[username]
    else {
        const type = (await Connection.collections.users.findOne({ username: username }, { projection: { type: 1, _id: 0 } }));
        if (type == null) return false;
        else {
            permissions[username] = type.type;
            return type.type;
        }
    }
}

const setPermissions = (username, perms) => {
    permissions[username] = perms
}

const deletePermissions = (username) => {
    delete permissions[username]
}

const signToken = (username) => {
    return signer.sign(username)
}

const createSigner = async () => {
    const cacheCollection = Connection.collections.cache
    const cacheResult = await cacheCollection.findOne({});
    let changeRequired = false;
    if (cacheResult['SECRET'] == null) {
        cacheResult['SECRET'] = crypto.randomBytes(64).toString('hex');
        console.log("Generated new secret");
        changeRequired = true;
    }

    if (cacheResult['SALT'] == null) {
        cacheResult['SALT'] = crypto.randomBytes(64).toString('hex');
        console.log("Generated new salt");
        changeRequired = true;
    }

    if (changeRequired) {
        await cacheCollection.updateOne({}, { $set: cacheResult }, { upsert: true });
    }

    signer = new RD.Signer(cacheResult['SECRET'], cacheResult['SALT']);
}

module.exports = { checkPermissions, setPermissions, deletePermissions, signToken, checkUsernamePerms, createSigner }