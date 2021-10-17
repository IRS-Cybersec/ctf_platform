const { checkUsernamePerms } = require('./../utils/permissionUtils.js')

const scoreboard = async (req, res) => {
    let changes = {}
    let finalData = []

    let transactionsCache = NodeCacheObj.get("transactionsCache")
    if (NodeCacheObj.get("teamMode")) {
        const usernameTeamCache = NodeCacheObj.get("usernameTeamCache")
        const teamList = NodeCacheObj.get("teamListCache")
        if (NodeCacheObj.get("adminShowDisable")) {
            for (let i = 0; i < transactionsCache.length; i++) {
                const current = transactionsCache[i]

                if (checkUsernamePerms(current.author) !== 2) {
                    const author = current.author in usernameTeamCache ? usernameTeamCache[current.author] : current.author
                    if (author in changes) changes[author].changes.push(current)
                    else {
                        let members = [current.author]
                        let isTeam = false
                        if (author != current.author) {
                            members = teamList[author].members
                            isTeam = true
                        }
                        changes[author] = { _id: author, changes: [current], members: members, isTeam: isTeam }
                    }
                }

            }
        }
        else {
            for (let i = 0; i < transactionsCache.length; i++) {
                const current = transactionsCache[i]
                const author = current.author in usernameTeamCache ? usernameTeamCache[current.author] : current.author
                if (author in changes) changes[author].changes.push(current)
                else {
                    let members = [current.author]
                    let isTeam = false
                    if (author != current.author) {
                        members = teamList[author].members
                        isTeam = true
                    }
                    changes[author] = { _id: author, changes: [current], members: members, isTeam: isTeam }
                }
            }
        }
    }
    else {
        if (NodeCacheObj.get("adminShowDisable")) {
            for (let i = 0; i < transactionsCache.length; i++) {
                const current = transactionsCache[i]

                if (checkUsernamePerms(current.author) !== 2) {
                    if (current.author in changes) changes[current.author].changes.push(current)
                    else changes[current.author] = { _id: current.author, changes: [current] }
                }

            }
        }
        else {
            for (let i = 0; i < transactionsCache.length; i++) {
                const current = transactionsCache[i]

                if (current.author in changes) changes[current.author].changes.push(current)
                else changes[current.author] = { _id: current.author, changes: [current] }
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

    for (let i = 0; i < transactionsCache.length; i++) {
        const current = transactionsCache[i]

        if (current.author === req.params.username) {
            found = true
            if (current.points !== 0) scores.push(current)
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
    if (NodeCacheObj.get("teamMode") && req.params.username in usernameTeamCache) {
        const userTeam = usernameTeamCache[req.params.username]

        for (let i = 0; i < transactionsCache.length; i++) {
            const current = transactionsCache[i]
            if (current.points !== 0 && usernameTeamCache[current.author] === userTeam) score += current.points
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
