const { checkUsernamePerms } = require('./../utils/permissionUtils.js')

const scoreboard = async (req, res) => {
        let changes = {}
        let finalData = []

        let transactionsCache = NodeCacheObj.get("transactionsCache")
        if (NodeCacheObj.get("adminShowDisable")) {
            for (let i = 0; i < transactionsCache.length; i++) {
                const current = transactionsCache[i]
                const document = {_id: current._id, points: current.points, challenge: current.challenge, timestamp: current.timestamp, challengeID: current.challengeID }

                if (checkUsernamePerms(current.author) !== 2) {
                    if (current.author in changes) changes[current.author].changes.push(document)
                    else changes[current.author] = { _id: current.author, changes: [document] }
                }

            }
        }
        else {
            for (let i = 0; i < transactionsCache.length; i++) {
                const current = transactionsCache[i]
                const document = {_id: current._id, points: current.points, challenge: current.challenge, timestamp: current.timestamp, challengeID: current.challengeID }


                if (current.author in changes) changes[current.author].changes.push(document)
                else changes[current.author] = { _id: current.author, changes: [document] }
            }
        }

        for (username in changes) {
            finalData.push(changes[username])
        }

        res.send({
            success: true,
            users: finalData,
            lastChallengeID: NodeCacheObj.get("latestSolveSubmissionID")
        });
}

const userScoreboard = async (req, res) => {
        let transactionsCache = NodeCacheObj.get("transactionsCache")
        let scores = []
        let found = false
        for (let i = 0; i < transactionsCache.length; i++) {
            const current = transactionsCache[i]

            if (current.author === req.params.username) {
                found = true
                if (current.points !== 0) scores.push({ points: current.points, challenge: current.challenge, timestamp: current.timestamp, type: current.type, challengeID: current.challengeID })
            }
        }
        if (!found) throw new Error('NotFound');
        if (NodeCacheObj.get("adminShowDisable") && scores.length > 0 && scores[0].perms === 2) return res.send({ success: true, scores: [], hidden: true })

        res.send({
            success: true,
            scores: scores,
            hidden: false
        });
}

const userPoints = async (req, res) => {
        let transactionsCache = NodeCacheObj.get("transactionsCache")
        let adminShowDisable = NodeCacheObj.get("adminShowDisable")
        let score = 0
        for (let i = 0; i < transactionsCache.length; i++) {
            const current = transactionsCache[i]
            if (current.points !== 0 && current.author === req.params.username) {
                score += current.points
                if (adminShowDisable && current.perms === 2) return res.send({ success: true, score: "Hidden", hidden: true })
            }
        }
        res.send({
            success: true,
            score: score,
            hidden: false
        });
}
module.exports = { scoreboard, userScoreboard, userPoints }