const Connection = require('./../utils/mongoDB.js')

const submissions = async (req, res, next) => {
    const collections = Connection.collections
    try {
        if (res.locals.perms < 2) throw new Error('Permissions');
        res.send({
            success: true,
            submissions: await collections.transactions.find({ '$or': [{ type: 'submission' }, { type: 'blocked_submission' }] }).toArray()
        });
    }
    catch (err) {
        next(err);
    }
}

const newSubmission = async (req, res, next) => {
    const collections = Connection.collections
    try {
        if (res.locals.perms < 2) throw new Error('Permissions');
        if (await collections.users.countDocuments({ username: req.body.username.toLowerCase() }) == 0) throw new Error('UserNotFound');

        const chall = await collections.challs.findOneAndUpdate({
            name: req.body.chall
        }, {
            $addToSet: {
                solves: req.body.username.toLowerCase()
            }
        }, {
            projection: {
                points: 1,
                _id: 0
            }
        });
        if (!chall.ok) throw new Error('Unknown');
        if (chall.value === null) throw new Error('NotFound');
        const lastScore = await collections.transactions.aggregate([{
            $match: {
                author: req.body.username.toLowerCase(),
                challenge: req.body.chall
            }
        }, {
            $group: {
                _id: '$challenge',
                points: {
                    $sum: '$points'
                }
            }
        }]).toArray();
        if (lastScore[0].points > req.body.points && !req.body.force) {
            res.send({
                success: true,
                data: 'previous-higher'
            });
            return;
        }
        await collections.transactions.insertOne({
            author: req.body.username.toLowerCase(),
            challenge: req.body.chall,
            timestamp: new Date(),
            type: 'submission',
            points: req.body.points - lastScore[0].points,
            submission: req.body.flag != null ? req.body.flag : 'No flag provided',
            manual: res.locals.username
        });
        await collections.users.updateOne({
            username: req.body.username.toLowerCase()
        }, {
            $inc: { score: req.body.points - lastScore[0].points }
        });
        res.send({
            success: true,
            data: 'recorded'
        });
    }
    catch (err) {
        next(err);
    }
}

const deleteSubmission = async (req, res, next) => {
    const collections = Connection.collections
    try {
        if (res.locals.perms < 2) throw new Error('Permissions');
        const delReq = await collections.transactions.findOneAndDelete({
            _id: MongoDB.ObjectID(req.body.submissionID)
        }, {
            solves: 1,
            points: 1,
            hints: 1,
            _id: 0
        });
        if (!delReq.ok) throw new Error('Unknown');
        if (delReq.value === null) throw new Error('NotFound');
        res.send({
            success: true,
        });
    }
    catch (err) {
        next(err);
    }
}

module.exports = {submissions, newSubmission, deleteSubmission}