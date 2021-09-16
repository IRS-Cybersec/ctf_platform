const Connection = require('./../utils/mongoDB.js')
var userCache = {}

const userUpdateCache = async () => {
    const collections = Connection.collections
    const cursor = collections.users.find({})
    cursor.forEach((doc) => {
        if ("updateID" in doc) userCache[doc.username] = doc.updateID
        else userCache[doc.username] = 0
        
    })
}

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
                                _id: '$_id',
                                points: '$points',
                                timestamp: '$timestamp'
                            }
                        }
                    }
                }]).toArray(),
            lastChallengeID: req.app.get("latestSolveSubmissionID")
        });
    }
    catch (err) {
        next(err);
    }
}

const userScoreboard = async (req, res, next) => {
    try {
        let transactionsCache = req.app.get("transactionsCache")
        let scores = []
        for (let i = 0; i < transactionsCache.length; i++) {
            const current = transactionsCache[i]
            
            if (current.points !== 0 && current.author === req.params.username) scores.push({points: current.points, challenge: current.challenge, timestamp: current.timestamp, type: current.type, challengeID: current.challengeID})
        }
        if (req.app.get("adminShowDisable") && scores.length > 0 && scores[0].perms === 2) return res.send({ success: true, scores: [], hidden: true })
        res.send({
            success: true,
            scores: scores,
            hidden: false
        });
    }
    catch (err) {
        console.error(err)
        next(err);
    }
}

const userPoints = async (req, res, next) => {
    try {
        let transactionsCache = req.app.get("transactionsCache")
        let score = 0
        for (let i = 0; i < transactionsCache.length; i++) {
            const current = transactionsCache[i]
            if (current.points !== 0 && current.author === req.params.username) score += current.points
        }
        if (req.app.get("adminShowDisable") && scores.length > 0 && scores[0].perms === 2) return res.send({ success: true, score: "Hidden", hidden: true })
        res.send({
            success: true,
            score: score,
            hidden: false
        });
    }
    catch (err) {
        console.error(err)
        next(err);
    }
}
module.exports = { scoreboard, userScoreboard, userPoints}