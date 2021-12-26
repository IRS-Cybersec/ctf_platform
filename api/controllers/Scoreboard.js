const { checkUsernamePerms } = require('./../utils/permissionUtils.js')

const scoreboard = async (req, res) => {
    let finalData = []
    const transactionsCache = NodeCacheObj.get("transactionsCache")
    const usernameTeamCache = NodeCacheObj.get("usernameTeamCache")

    if (NodeCacheObj.get("teamMode")) {
        for (username in transactionsCache) {
            // Pushes transaction records of people who are NOT IN A TEAM [OR] THE TEAM TRANSACTIONS
            // But it fails for teams whose usernames matches a user
            if (!(username in usernameTeamCache)) finalData.push(transactionsCache[username])
        }
    }
    else {
        for (username in transactionsCache) {
            finalData.push(transactionsCache[username])
        }
    }


    res.send({
        success: true,
        users: finalData,
        lastChallengeID: NodeCacheObj.get("latestSolveSubmissionID"),
        teamUpdateID: NodeCacheObj.get("teamUpdateID"),
        latestUserCategoryUpdateID: NodeCacheObj.get("latestUserCategoryUpdateID"),
        userCategories: NodeCacheObj.get("userCategories"),
        categoryList: NodeCacheObj.get("categoryList")
    });
}

const userScoreboard = async (req, res) => {
    let transactionsCache = NodeCacheObj.get("transactionsCache")
    let scores = []

    if (NodeCacheObj.get("adminShowDisable") && (await checkUsernamePerms(req.params.username)) === 2) return res.send({ success: true, scores: [], hidden: true })

    if (req.params.username in transactionsCache) {
        scores = transactionsCache[req.params.username].changes
        res.send({
            success: true,
            scores: scores,
            hidden: false
        });
    }
    else throw new Error('NotFound');


}

const userPoints = async (req, res) => {
    let transactionsCache = NodeCacheObj.get("transactionsCache")
    let score = 0
    if (NodeCacheObj.get("adminShowDisable") && (await checkUsernamePerms(req.params.username)) === 2) return res.send({ success: true, score: "Hidden", hidden: true })

    const usernameTeamCache = NodeCacheObj.get("usernameTeamCache")
    // Return team score instead of individual user score if user is in a team
    if (NodeCacheObj.get("teamMode") && req.params.username in usernameTeamCache) {
        const userTeam = usernameTeamCache[req.params.username]
        for (let i = 0; i < transactionsCache[userTeam].changes.length; i++) {
            const current = transactionsCache[userTeam].changes[i]
            if (current.points !== 0) score += current.points
        }
    }
    else if (req.params.username in transactionsCache) {
        for (let i = 0; i < transactionsCache[req.params.username].changes.length; i++) {
            const current = transactionsCache[req.params.username].changes[i]
            if (current.points !== 0) score += current.points
        }
    }

    res.send({
        success: true,
        score: score,
        hidden: false
    });
}
module.exports = { scoreboard, userScoreboard, userPoints }
