const Connection = require('./../utils/mongoDB.js')
const crypto = require('crypto');
const { broadCastNewTeamChange } = require('./Sockets.js')

const list = async (req, res) => {
    if (NodeCacheObj.get("teamMode")) {
        let filteredData = []
        const teamList = NodeCacheObj.get("teamListCache")
        for (const team in teamList) {
            const current = teamList[team]
            filteredData.push({
                name: current.name,
                members: current.members
            })
        }
        res.send({
            success: true,
            teams: filteredData
        })
    }
    else res.send({
        success: false,
        error: "teams-disabled"
    })
}

const get = async (req, res) => {
    if (NodeCacheObj.get("teamMode")) {
        const teamList = NodeCacheObj.get("teamListCache")
        const transactionsCache = NodeCacheObj.get("transactionsCache")
        if (req.params.team in teamList) {
            const team = teamList[req.params.team]
            let changes = []
            for (let i = 0; i < transactionsCache.length; i++) {
                const current = transactionsCache[i]
                if ("originalAuthor" in current && current.author === req.params.team && current.points !== 0) {
                    changes.push({
                        _id: current.id,
                        author: current.originalAuthor,
                        points: current.points,
                        challenge: current.challenge,
                        timestamp: current.timestamp,
                        challengeID: current.challengeID,
                        type: current.type
                    })
                }
            }
            // if own team, send invite code as well
            if (team.members.includes(req.locals.username)) {
                return res.send({
                    success: true,
                    changes: changes,
                    code: team.code,
                    members: team.members
                })
            }
            else {
                return res.send({
                    success: true,
                    changes: changes,
                    members: team.members
                })
            }

        }
        else throw new Error("NotFound")
    }
    else res.send({
        success: false,
        error: "teams-disabled"
    })
}

// get the team the user is in for the sidebar
const userTeam = (req, res) => {
    const usernameTeamCache = NodeCacheObj.get("usernameTeamCache")
    if (NodeCacheObj.get("teamMode")) {
        if (req.locals.username in usernameTeamCache) {
            res.send({
                success: true,
                team: usernameTeamCache[req.locals.username]
            })
        }
        else {
            res.send({
                success: true,
                team: false
            })
        }

    }
    else res.send({
        success: false,
        error: "teams-disabled"
    })
}

const linkInfo = async (req, res) => {
    if (NodeCacheObj.get("teamMode")) {
        const teamList = NodeCacheObj.get("teamListCache")
        const usernameTeamCache = NodeCacheObj.get("usernameTeamCache")
        let currentTeam = {}
        let found = false

        for (const team in teamList) {
            const current = teamList[team]
            if (current.code === req.body.code) {
                currentTeam = current
                currentTeam.name = team
                found = true
                break
            }
        }
        if (!found) return res.send({ success: false, error: "invalid-code" })
        // Is user already in another team?
        if (req.locals.username in usernameTeamCache) {
            return res.send({
                success: false,
                error: "in-team"
            })
        }
        // Is current team full?
        if (currentTeam.members.length > NodeCacheObj.get("teamMaxSize")) {
            return res.send({
                success: false,
                error: "team-full"
            })
        }
        res.send({
            success: true,
            name: currentTeam.name
        })
    }
    else res.send({ succcess: false, error: "teams-disabled" })
}

const join = async (req, res) => {
    if (NodeCacheObj.get("teamMode")) {
        if (!NodeCacheObj.get("teamChangeDisable")) {
            const collections = Connection.collections
            let teamList = NodeCacheObj.get("teamListCache")
            let usernameTeamCache = NodeCacheObj.get("usernameTeamCache")
            // Does a team exist for this team code, and is it correct?
            let currentTeam = {}
            let found = false
            for (const team in teamList) {
                const current = teamList[team]
                if (current.code === req.body.code) {
                    currentTeam = current
                    currentTeam.name = team
                    found = true
                    break
                }
            }
            if (!found) return res.send({ success: false, error: "invalid-code" })
            // Is user already in another team?
            if (req.locals.username in usernameTeamCache) {
                return res.send({
                    success: false,
                    error: "in-team"
                })
            }
            // Is current team full?
            if (currentTeam.members.length > NodeCacheObj.get("teamMaxSize")) {
                return res.send({
                    success: false,
                    error: "team-full"
                })
            }
            currentTeam.members.push(req.locals.username)
            await collections.team.updateOne({ name: currentTeam.name }, { $set: { members: currentTeam.members } })
            usernameTeamCache[req.locals.username] = currentTeam.name

            // Broadcast a new transaction to signal a new team join
            let teamUpdateID = NodeCacheObj.get("teamUpdateID")
            teamUpdateID += 1
            NodeCacheObj.set("teamUpdateID", teamUpdateID)
            await collections.cache.updateOne({}, { $set: { teamUpdateID: teamUpdateID } })
            let transactionCache = NodeCacheObj.get("transactionsCache")
            for (let i = 0; i < transactionCache.length; i++) {
                if (transactionCache[i].author === req.locals.username) {
                    transactionCache[i].author = currentTeam.name
                    transactionCache[i].originalAuthor = req.locals.username
                }
            }
            await collections.transactions.updateMany({ author: req.locals.username }, { $set: { author: currentTeam.name, originalAuthor: req.locals.username } })
            broadCastNewTeamChange()
            res.send({ success: true })
        }
        else res.send({ success: false, error: "team-change-disabled" })
    }
    else res.send({ succcess: false, error: "teams-disabled" })

}

const create = async (req, res) => {
    if (NodeCacheObj.get("teamMode")) {
        if (!NodeCacheObj.get("teamChangeDisable")) {
            const collections = Connection.collections
            let teamList = NodeCacheObj.get("teamListCache")
            let usernameTeamCache = NodeCacheObj.get("usernameTeamCache")
            // Is user already in a team?
            if (req.locals.username in usernameTeamCache) {
                return res.send({
                    success: false,
                    error: "in-team"
                })
            }
            if (req.body.name in teamList) {
                return res.send({
                    success: false,
                    error: "name-taken"
                })
            }
            const newTeam = {
                name: req.body.name,
                members: [req.locals.username],
                code: crypto.randomBytes(16).toString('hex')
            }
            teamList[req.body.name] = newTeam
            usernameTeamCache[req.locals.username] = req.body.name
            await collections.team.insertOne(newTeam)
            // Broadcast a new transaction to signal a new team change
            let teamUpdateID = NodeCacheObj.get("teamUpdateID")
            teamUpdateID += 1
            NodeCacheObj.set("teamUpdateID", teamUpdateID)
            await collections.cache.updateOne({}, { $set: { teamUpdateID: teamUpdateID } })
            // Edit transactions and change author to the team name
            let transactionCache = NodeCacheObj.get("transactionsCache")
            for (let i = 0; i < transactionCache.length; i++) {
                if (transactionCache[i].author === req.locals.username) {
                    transactionCache[i].author = req.body.name
                    transactionCache[i].originalAuthor = req.locals.username
                }
            }
            await collections.transactions.updateMany({ author: req.locals.username }, { $set: { author: req.body.name, originalAuthor: req.locals.username } })
            broadCastNewTeamChange()
            res.send({ success: true })
        }
        else res.send({ success: false, error: "team-change-disabled" })
    }
    else res.send({ succcess: false, error: "teams-disabled" })
}

const leave = async (req, res) => {
    if (NodeCacheObj.get("teamMode")) {
        if (!NodeCacheObj.get("teamChangeDisable")) {
            const collections = Connection.collections
            let teamList = NodeCacheObj.get("teamListCache")
            let usernameTeamCache = NodeCacheObj.get("usernameTeamCache")
            let currentTeam = {}
            let found = false
            // Find the team the user is in
            for (const team in teamList) {
                const current = teamList[team]
                if (current.members.includes(req.locals.username)) {
                    currentTeam = current
                    currentTeam.name = team
                    found = true
                    break
                }
            }
            if (!found) return res.send({ success: false, error: "not-in-any-team" })
            delete usernameTeamCache[req.locals.username]
            // last member is leaving the team
            if (currentTeam.members.length === 1) {
                delete teamList[currentTeam.name]
                await collections.team.deleteOne({ name: currentTeam.name })
                res.send({ success: true, msg: "last-member" })
            }
            else {
                currentTeam.members.splice(currentTeam.members.indexOf(req.locals.username), 1)
                await collections.team.updateOne({ name: currentTeam.name }, { $set: { members: currentTeam.members } })
                res.send({ success: true })
            }
            // Broadcast a new transaction to signal a new team join
            let teamUpdateID = NodeCacheObj.get("teamUpdateID")
            teamUpdateID += 1
            NodeCacheObj.set("teamUpdateID", teamUpdateID)
            await collections.cache.updateOne({}, { $set: { teamUpdateID: teamUpdateID } })
            let transactionCache = NodeCacheObj.get("transactionsCache")
            for (let i = 0; i < transactionCache.length; i++) {
                if (transactionCache[i].originalAuthor === req.locals.username) {
                    transactionCache[i].author = req.locals.username
                    delete transactionCache[i].originalAuthor
                }
            }
            await collections.transactions.updateMany({ originalAuthor: req.locals.username }, { $set: { author: req.locals.username }, $unset: { originalAuthor: 0 } })
            broadCastNewTeamChange()
        }
        else res.send({ success: false, error: "team-change-disabled" })
    }
    else res.send({ succcess: false, error: "teams-disabled" })
}

module.exports = { list, join, create, get, leave, userTeam, linkInfo }