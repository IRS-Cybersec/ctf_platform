const { checkPermissions, deletePermissions, setPermissions, signer } = require('./../utils/permissionUtils.js')
const Connection = require('./../utils/mongoDB.js')
const argon2 = require('argon2');


const disableStates = async(req, res, next) => {
    try {
        if (res.locals.perms < 2) throw new Error('Permissions');
        res.send({
            success: true,
            states: { registerDisable: req.app.get("registerDisable"), adminShowDisable: req.app.get("adminShowDisable"), uploadSize: req.app.get("uploadSize"), uploadPath: req.app.get("uploadPath") }
        });
    }
    catch (err) {
        next(err)
    }
}

const type = async (req, res, next) => {
    try {
        res.send({
            success: true,
            type: res.locals.perms
        });
    }
    catch (err) {
        next(err);
    }
}

const login = async (req, res, next) => {
    const collections = Connection.collections
    try {
        const user = await collections.users.findOne({ username: req.body.username.toLowerCase() }, { projection: { password: 1, type: 1, _id: 0 } });
        if (!user) throw new Error('WrongDetails');
        else if (await argon2.verify(user.password, req.body.password)) {
            setPermissions(req.body.username, user.type)
            res.send({
                success: true,
                permissions: user.type,
                token: signer.sign(req.body.username.toLowerCase())
            });
        }
        else throw new Error('WrongDetails');
    }
    catch (err) {
        switch (err.message) {
            case 'WrongDetails':
                res.send({
                    success: false,
                    error: 'wrong-details'
                });
                return true;
        }
        next(err);
    }
}

const create = async (req, res, next) => {
    const collections = Connection.collections
    let admin = false
    try {

        if (req.headers.authorization !== undefined) {
            const perms = await checkPermissions(req.headers.authorization)
            if (perms !== false && perms.type >= 2) admin = true
        }
        if (!admin && req.app.get("registerDisable")) {
            return res.send({ success: false, error: 'registration-disabled' })
        }

        if (!/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(req.body.email)) throw new Error('BadEmail');
        await collections.users.insertOne({
            username: req.body.username.toLowerCase(),
            email: req.body.email.toLowerCase(),
            password: await argon2.hash(req.body.password),
            type: 0,
            score: 0
        });
        res.send({ success: true });
    }
    catch (err) {
        if (err.message == 'BadEmail') {
            res.send({
                success: false,
                error: 'email-formatting'
            });
            return;
        }
        if (err.name == 'MongoError') {
            switch (err.code) {
                case 11000:
                    switch (Object.keys(err.keyPattern)[0]) {
                        case 'username':
                            res.status(403);
                            res.send({
                                success: false,
                                error: 'username-taken'
                            });
                            return;
                        case 'email':
                            res.status(403);
                            res.send({
                                success: false,
                                error: 'email-taken'
                            });
                            return;
                    }
                    res.send({
                        success: false,
                        error: 'validation'
                    });
            }
        }
        else next(err);
    }
}

const takenUsername = async (req, res, next) => {
    const collections = Connection.collections
    try {
        res.send({
            success: true,
            taken: await collections.users.countDocuments({ username: req.body.username.toLowerCase() }) > 0 ? true : false
        });
    }
    catch (err) {
        next(err);
    }
}

const takenEmail = async (req, res, next) => {
    const collections = Connection.collections
    try {
        res.send({
            success: true,
            taken: await collections.users.countDocuments({ email: req.body.email.toLowerCase() }) > 0 ? true : false
        });
    }
    catch (err) {
        next(err);
    }
}

const deleteAccount = async (req, res, next) => {
    const collections = Connection.collections
    try {
        let userToDelete = res.locals.username;
        if (req.body.users) {
            if (!Array.isArray(req.body.users)) throw new Error('Validation');
            const usersToDelete = req.body.users;
            if (usersToDelete.includes(username)) return res.send({ success: false, error: 'delete_self' })
            if (res.locals.perms < 2) {
                res.status(403);
                res.send({
                    success: false,
                    error: 'permissions'
                });
                return;
            }

            if ((await collections.users.deleteMany({ username: { $in: usersToDelete } })).deletedCount == 0) {
                res.status(400);
                res.send({
                    success: false,
                    error: 'not_found'
                });
                return;
            }
            await collections.challs.updateMany({}, {
                $pull: {
                    solves: { $in: usersToDelete }
                }
            });
            await collections.challs.updateMany({
                hints: {
                    $exists: true
                }
            }, {
                $pull: {
                    'hints.$[].purchased': { $in: usersToDelete }
                }
            });
            await collections.challs.deleteMany({ author: { $in: usersToDelete } });
            await collections.transactions.deleteMany({ author: { $in: usersToDelete } });
            usersToDelete.forEach(username => { if (permissions.includes(username)) deletePermissions(username) })

            res.send({ success: true });
        }
        else {
            const user = await collections.users.findOne({ username: userToDelete }, { projection: { password: 1, _id: 0 } });
            if (!(await argon2.verify(user.password, req.body.password))) return res.send({ success: false, error: "wrong-pass" })
            if ((await collections.users.deleteOne({ username: userToDelete.toLowerCase() })).deletedCount == 0) {
                res.status(400);
                res.send({
                    success: false,
                    error: 'not_found'
                });
                return;
            }
            await collections.challs.updateMany({}, {
                $pull: {
                    solves: userToDelete
                }
            });
            await collections.challs.updateMany({
                hints: {
                    $exists: true
                }
            }, {
                $pull: {
                    'hints.$[].purchased': userToDelete
                }
            });
            await collections.challs.deleteMany({ author: userToDelete });
            await collections.transactions.deleteMany({ author: userToDelete });
            if (permissions.includes(username)) deletePermissions(username);
            res.send({ success: true });
        }

    }
    catch (err) {
        next(err);
    }
}

const password = async (req, res, next) => {
    const collections = Connection.collections
    try {
        const user = await collections.users.findOne({ username: res.locals.username }, { projection: { password: 1, _id: 0 } });
        if (!user) throw new Error('NotFound')
        if (req.body.new_password == '') throw new Error('EmptyPassword');
        if (await argon2.verify(user.password, req.body.password)) {
            await collections.users.updateOne(
                { username: res.locals.username },
                { '$set': { password: await argon2.hash(req.body.new_password) } }
            );
            res.send({ success: true });
        }
        else throw new Error('WrongPassword');
    }
    catch (err) {
        switch (err.message) {
            case 'WrongPassword':
                res.status(403);
                res.send({
                    success: false,
                    error: 'wrong-password'
                });
                return;
            case 'EmptyPassword':
                res.status(400);
                res.send({
                    success: false,
                    error: 'empty-password'
                });
                return;
        }
        next(err);
    }
}

const adminChangePassword = async (req, res, next) => {
    const collections = Connection.collections
    try {
        if (res.locals.perms < 2) throw new Error('Permissions');
        if (req.body.password == '') throw new Error('EmptyPassword');
        await collections.users.updateOne(
            { username: req.body.username },
            { '$set': { password: await argon2.hash(req.body.password) } }
        );
        res.send({ success: true });
    }
    catch (err) {
        switch (err.message) {
            case 'EmptyPassword':
                res.status(400);
                res.send({
                    success: false,
                    error: 'empty-password'
                });
                return;
        }
        next(err);
    }
}

const list = async (req, res, next) => {
    const collections = Connection.collections
    try {
        if (res.locals.perms < 2) throw new Error('Permissions');
        res.send({
            success: true,
            list: (await collections.users.find(null, { projection: { password: 0, _id: 0 } }).toArray())
        });
    }
    catch (err) {
        next(err);
    }
}

const permissions = async (req, res, next) => {
    const collections = Connection.collections
    try {
        if (res.locals.perms < 2) throw new Error('Permissions');
        if (req.body.type < 0 || req.body.type > 2) throw new Error('OutOfRange');
        if ((await collections.users.updateOne(
            { username: req.body.username.toLowerCase() },
            { '$set': { type: parseInt(req.body.type) } }
        )).matchedCount > 0) {
            res.send({ success: true });
        }
        else throw new Error('NotFound');
    }
    catch (err) {
        next(err);
    }
}

module.exports = {disableStates, type, create, takenUsername, takenEmail, deleteAccount, login, password, adminChangePassword, list, permissions}