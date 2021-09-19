const scoreboard = async (req, res, next) => {
    try {
        let payload = {}
        let changes = {}
        let finalData = []
        if (req.app.get("adminShowDisable")) payload = { perms: { $ne: 2 } }

        let transactionsCache = req.app.get("transactionsCache")
        for (let i = 0; i < transactionsCache.length; i++) {
            const current = transactionsCache[i]
            const document = {points: current.points, challenge: current.challenge, timestamp: current.timestamp, type: current.type, challengeID: current.challengeID}
            
            if (current.author in changes) changes[current.author].changes.push(document)
            else changes[current.author] = {_id: current.author, changes: [document]}
        }
        for (username in changes) {
            finalData.push(changes[username])
        }

        res.send({
            success: true,
            users: finalData,
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
        let found = false
        for (let i = 0; i < transactionsCache.length; i++) {
            const current = transactionsCache[i]
            
            if (current.author === req.params.username) {
                found = true
                if (current.points !== 0) scores.push({points: current.points, challenge: current.challenge, timestamp: current.timestamp, type: current.type, challengeID: current.challengeID})
            } 
        }
        if (!found) throw new Error('NotFound');
        if (req.app.get("adminShowDisable") && scores.length > 0 && scores[0].perms === 2) return res.send({ success: true, scores: [], hidden: true })
        
        res.send({
            success: true,
            scores: scores,
            hidden: false
        });
    }
    catch (err) {
        next(err);
    }
}

const userPoints = async (req, res, next) => {
    try {
        let transactionsCache = req.app.get("transactionsCache")
        let adminShowDisable = req.app.get("adminShowDisable")
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
    catch (err) {
        next(err);
    }
}
module.exports = { scoreboard, userScoreboard, userPoints}