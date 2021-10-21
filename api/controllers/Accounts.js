const { checkPermissions, deletePermissions, setPermissions, signToken } = require('./../utils/permissionUtils.js')
const { broadCastNewSolve } = require('./../controllers/Sockets.js')
const Connection = require('./../utils/mongoDB.js')
const argon2 = require('argon2');


const disableStates = async (req, res) => {
    if (req.locals.perms < 2) throw new Error('Permissions');
    res.send({
        success: true,
        states: {
            registerDisable: NodeCacheObj.get("registerDisable"),
            adminShowDisable: NodeCacheObj.get("adminShowDisable"),
            uploadSize: NodeCacheObj.get("uploadSize"),
            uploadPath: NodeCacheObj.get("uploadPath"),
            teamSize: NodeCacheObj.get("teamMaxSize"),
            teamMode: NodeCacheObj.get("teamMode")
        }
    });
}

const type = async (req, res) => {
    res.send({
        success: true,
        type: req.locals.perms
    });
}

const forgotPassword = async (req, res) => {
    if (NodeCacheObj.get("forgotPass")) {

    }
    else res.send({
        success: false,
        error: "disabled"
    })
}

const forgotUsername = async (req, res) => {
    if (NodeCacheObj.get("forgotUser")) {
        const transport = NodeCacheObj.get("NodemailerT")
    }
    else res.send({
        success: false,
        error: "disabled"
    })
}

const login = async (req, res) => {
    const collections = Connection.collections
    try {
        const user = await collections.users.findOne({ username: req.body.username.toLowerCase() }, { projection: { password: 1, type: 1, _id: 0 } });
        if (!user) throw new Error('WrongDetails');
        else if (await argon2.verify(user.password, req.body.password)) {
            setPermissions(req.body.username, user.type)
            res.send({
                success: true,
                permissions: user.type,
                token: signToken(req.body.username.toLowerCase())
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
            default:
                throw new Error(err)
        }
    }
}

const create = async (req, res) => {
    const collections = Connection.collections
    let admin = false
    try {
        if (req.headers.authorization !== undefined) {
            const perms = await checkPermissions(req.headers.authorization)
            if (perms !== false && perms.type >= 2) admin = true
        }
        if (!admin && NodeCacheObj.get("registerDisable")) {
            return res.send({ success: false, error: 'registration-disabled' })
        }

        if (!/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(req.body.email)) throw new Error('BadEmail');
        await collections.users.insertOne({
            username: req.body.username.toLowerCase(),
            email: req.body.email.toLowerCase(),
            password: await argon2.hash(req.body.password),
            type: 0
        });
        const latestSolveSubmissionID = NodeCacheObj.get("latestSolveSubmissionID") + 1
        NodeCacheObj.set("latestSolveSubmissionID", latestSolveSubmissionID)
        const GTimestamp = new Date()
        let insertDoc = {
            author: req.body.username.toLowerCase(),
            challenge: 'Registered',
            challengeID: null,
            timestamp: GTimestamp,
            type: 'initial_register',
            points: 0,
            correct: true,
            submission: '',
            lastChallengeID: latestSolveSubmissionID
        }
        let transactionsCache = NodeCacheObj.get("transactionsCache")
        transactionsCache.push({
            _id: insertDoc._id,
            challenge: insertDoc.challenge,
            challengeID: insertDoc.challengeID,
            timestamp: insertDoc.timestamp,
            points: insertDoc.points,
            lastChallengeID: insertDoc.lastChallengeID,
            author: insertDoc.author
        })
        await collections.transactions.insertOne(insertDoc)
        // Send out to scoreboards that there is a new user
        broadCastNewSolve([{
            _id: insertDoc._id,
            username: req.body.username.toLowerCase(),
            timestamp: GTimestamp,
            points: 0,
            perms: 0,
            lastChallengeID: latestSolveSubmissionID
        }])
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
        if (err.name == 'MongoServerError') {
            switch (err.code) {
                case 11000:
                    switch (Object.keys(err.keyPattern)[0]) {
                        case 'username':
                            res.code(403);
                            res.send({
                                success: false,
                                error: 'username-taken'
                            });
                            return;
                        case 'email':
                            res.code(403);
                            res.send({
                                success: false,
                                error: 'email-taken'
                            });
                            return;
                        default:
                            res.send({
                                success: false,
                                error: 'validation'
                            });
                            throw new Error(err)
                    }
                default:
                    throw new Error(err)
            }
        }
        else throw new Error("Unknown")
    }
}

const takenUsername = async (req, res) => {
    const collections = Connection.collections
    res.send({
        success: true,
        taken: await collections.users.countDocuments({ username: req.body.username.toLowerCase() }) > 0 ? true : false
    });
}

const takenEmail = async (req, res) => {
    const collections = Connection.collections
    res.send({
        success: true,
        taken: await collections.users.countDocuments({ email: req.body.email.toLowerCase() }) > 0 ? true : false
    });
}

const deleteAccount = async (req, res) => {
    const collections = Connection.collections
    let userToDelete = req.locals.username;
    if (req.body.users) {
        if (!Array.isArray(req.body.users)) throw new Error('Validation');
        const usersToDelete = req.body.users;
        if (usersToDelete.includes(req.locals.username)) return res.send({ success: false, error: 'delete_self' })
        if (req.locals.perms < 2) {
            res.code(403);
            res.send({
                success: false,
                error: 'permissions'
            });
            return;
        }

        if ((await collections.users.deleteMany({ username: { $in: usersToDelete } })).deletedCount == 0) {
            res.code(400);
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
        usersToDelete.forEach(username => { deletePermissions(username) })

        res.send({ success: true });
    }
    else {
        const user = await collections.users.findOne({ username: userToDelete }, { projection: { password: 1, _id: 0 } });
        if (!(await argon2.verify(user.password, req.body.password))) return res.send({ success: false, error: "wrong-pass" })
        if ((await collections.users.deleteOne({ username: userToDelete.toLowerCase() })).deletedCount == 0) {
            res.code(400);
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
        deletePermissions(username);
        res.send({ success: true });
    }
}

const password = async (req, res) => {
    const collections = Connection.collections
    try {
        const user = await collections.users.findOne({ username: req.locals.username }, { projection: { password: 1, _id: 0 } });
        if (!user) throw new Error('NotFound')
        if (req.body.new_password == '') throw new Error('EmptyPassword');
        if (await argon2.verify(user.password, req.body.password)) {
            await collections.users.updateOne(
                { username: req.locals.username },
                { '$set': { password: await argon2.hash(req.body.new_password) } }
            );
            res.send({ success: true });
        }
        else throw new Error('WrongPassword');
    }
    catch (err) {
        switch (err.message) {
            case 'WrongPassword':
                res.code(403);
                res.send({
                    success: false,
                    error: 'wrong-password'
                });
                return;
            case 'EmptyPassword':
                res.code(400);
                res.send({
                    success: false,
                    error: 'empty-password'
                });
                return;
            default:
                throw new Error(err)
        }
    }
}

const adminChangePassword = async (req, res) => {
    const collections = Connection.collections
    try {
        if (req.locals.perms < 2) throw new Error('Permissions');
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
                res.code(400);
                res.send({
                    success: false,
                    error: 'empty-password'
                });
                return;
            default:
                throw new Error(err)
        }
    }
}

const list = async (req, res) => {
    const collections = Connection.collections
    if (req.locals.perms < 2) throw new Error('Permissions');
    res.send({
        success: true,
        list: (await collections.users.find(null, { projection: { password: 0, _id: 0 } }).toArray())
    });
}

const permissions = async (req, res) => {
    const collections = Connection.collections
    if (req.locals.perms < 2) throw new Error('Permissions');
    if (req.body.type < 0 || req.body.type > 2) throw new Error('OutOfRange');
    if ((await collections.users.updateOne(
        { username: req.body.username.toLowerCase() },
        { '$set': { type: parseInt(req.body.type) } }
    )).matchedCount > 0) {
        setPermissions(req.body.username.toLowerCase(), req.body.type)
        res.send({ success: true });
    }
    else throw new Error('NotFound');
}

module.exports = { forgotUsername, forgotPassword, disableStates, type, create, takenUsername, takenEmail, deleteAccount, login, password, adminChangePassword, list, permissions }