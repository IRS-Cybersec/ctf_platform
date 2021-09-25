const Connection = require('./mongoDB.js')
const RD = require('reallydangerous');
const crypto = require('crypto');
let signer = null;
new RD.Signer(process.env.SECRET, process.env.SALT);
let permissions = {};

const checkPermissions = async (token) => {

    if (signer === null) {
        signer = await getSigner(Connection.collections.cache)
    }
    const username = signer.unsign(token);

    if (username in permissions) return { type: permissions[username], username: username };
    const type = (await Connection.collections.users.findOne({ username: username }, { projection: { type: 1, _id: 0 } }));
    if (type == null) return false;
    else {
        permissions[username] = type.type;
        return { type: type.type, username: username };
    }
}

const checkUsernamePerms = (username) => {
    if (username in permissions) return permissions[username]
    else return false
}

const setPermissions = (username, perms) => {
    permissions[username] = perms
}

const deletePermissions = (username) => {
    delete permissions[username]
}

async function getSigner(cacheCollection) {
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

    return new RD.Signer(cacheResult['SECRET'], cacheResult['SALT']);

}

module.exports = { checkPermissions, setPermissions, deletePermissions, signer, checkUsernamePerms }