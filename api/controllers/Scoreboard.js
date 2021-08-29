const Connection = require('./../utils/mongoDB.js')

const scoreboard = async (req, res, next) => {
    const collections = Connection.collections
    try {
        let payload = {}
        if (req.app.get("adminShowDisable")) payload = { perms: { $ne: 2 } }

        res.send({
            success: true,
            users: await collections.transactions.aggregate([
                {
                    $match: payload
                },
                {
                    $group: {
                        _id: '$author',
                        changes: {
                            $push: {
                                points: '$points',
                                timestamp: '$timestamp'
                            }
                        }
                    }
                }]).toArray(),
            lastChallengeID: app.get("latestSolveSubmissionID")
        });
    }
    catch (err) {
        next(err);
    }
}

const scores = async (req, res, next) => {
    const collections = Connection.collections
    try {
        //Check if adminShowDisable is enabled, then don't return admin scores
        let payload = null
        if (req.app.get("adminShowDisable")) payload = { type: { $ne: 2 } }

        res.send({
            success: true,
            scores: await collections.users.find(payload, { projection: { username: 1, score: 1, _id: 0 } }).toArray()
        });
    }
    catch (err) {
        next(err);
    }
}

const userScoreboard = async (req, res, next) => {
    const collections = Connection.collections
    try {
        const scores = await collections.transactions.find({ points: { '$ne': 0 }, author: req.params.username }, { projection: { points: 1, timestamp: 1, challenge: 1, type: 1, _id: 0 } }).toArray();
        if (scores[0] && scores[0].type === 2 && app.get("adminShowDisable")) return res.send({ success: true, scores: [] })
        res.send({
            success: true,
            scores: scores
        });
    }
    catch (err) {
        console.error(err)
        next(err);
    }
}

const userScore = async (req, res, next) => {
    const collections = Connection.collections
    try {
        const score = (await collections.users.findOne({ username: req.params.username }, { projection: { score: 1, type: 1, _id: 0 } }));
        if (score === null) throw new Error('NotFound');
        if (score.type === 2 && req.app.get("adminShowDisable")) return res.send({ success: true, score: "hidden" })
        res.send({
            success: true,
            score: score.score
        });
    }
    catch (err) {
        next(err);
    }
}

module.exports = { scoreboard, scores, userScoreboard, userScore }