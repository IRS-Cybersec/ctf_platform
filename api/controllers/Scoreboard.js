const { checkUsernamePerms } = require('./../utils/permissionUtils.js')

const scoreboard = async (req, res) => {
    let changes = {}
    let finalData = []
    const teamList = NodeCacheObj.get("teamListCache")

    let transactionsCache = NodeCacheObj.get("transactionsCache")
    if (NodeCacheObj.get("adminShowDisable")) {
        for (let i = 0; i < transactionsCache.length; i++) {
            const current = transactionsCache[i]

            if (checkUsernamePerms(current.author) !== 2) {
                if (current.author in changes) changes[current.author].changes.push(current)
                else {
                    let members = [current.author]
                    let isTeam = false
                    if ("originalAuthor" in current) { // user is in a team
                        members = teamList[current.author].members
                        isTeam = true
                    }
                    changes[current.author] = { _id: current.author, changes: [current], members: members, isTeam: isTeam }
                }
            }

        }
    }
    else {
        for (let i = 0; i < transactionsCache.length; i++) {
            const current = transactionsCache[i]

            if (current.author in changes) changes[current.author].changes.push(current)
            else {
                let members = [current.author]
                let isTeam = false
                if ("originalAuthor" in current) { // user is in a team
                    members = teamList[current.author].members
                    isTeam = true
                }
                changes[current.author] = { _id: current.author, changes: [current], members: members, isTeam: isTeam }
            }
        }
    }



    for (username in changes) {
        finalData.push(changes[username])
    }
    res.send({
        success: true,
        users: finalData,
        lastChallengeID: NodeCacheObj.get("latestSolveSubmissionID"),
        teamUpdateID: NodeCacheObj.get("teamUpdateID")
    });
}

const userScoreboard = async (req, res) => {
    let transactionsCache = NodeCacheObj.get("transactionsCache")
    let scores = []
    let found = false

    if (NodeCacheObj.get("adminShowDisable") && checkUsernamePerms(req.params.username) === 2) return res.send({ success: true, scores: [], hidden: true })

    if (NodeCacheObj.get("teamMode")) {
        for (let i = 0; i < transactionsCache.length; i++) {
            const current = transactionsCache[i]

            if ("originalAuthor" in current) {
                if (current.originalAuthor === req.params.username) {
                    found = true
                    if (current.points !== 0) scores.push(current)
                }
            }
            else if (current.author === req.params.username) {
                found = true
                if (current.points !== 0) scores.push(current)
            }
        }
    }
    else {
        for (let i = 0; i < transactionsCache.length; i++) {
            const current = transactionsCache[i]

            if (current.author === req.params.username) {
                found = true
                if (current.points !== 0) scores.push(current)
            }
        }
    }


    if (!found) throw new Error('NotFound');


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
    if (adminShowDisable && checkUsernamePerms(req.params.username) === 2) return res.send({ success: true, score: "Hidden", hidden: true })

    const usernameTeamCache = NodeCacheObj.get("usernameTeamCache")
    // Return team score instead of individual user score if user is in a team
    if (NodeCacheObj.get("teamMode") && req.params.username in usernameTeamCache) {
        const userTeam = usernameTeamCache[req.params.username]

        for (let i = 0; i < transactionsCache.length; i++) {
            const current = transactionsCache[i]
            if (current.points !== 0 && "originalAuthor" in current && current.author === userTeam) {
                score += current.points
            }
        }
    }
    else {
        for (let i = 0; i < transactionsCache.length; i++) {
            const current = transactionsCache[i]
            if (current.points !== 0 && current.author === req.params.username) {
                score += current.points
            }
        }
    }

    res.send({
        success: true,
        score: score,
        hidden: false
    });
}
module.exports = { scoreboard, userScoreboard, userPoints }
