const Connection = require('./../utils/mongoDB.js')
const crypto = require('crypto');
const { broadCastNewSolve } = require('./Sockets.js')

const list = async (req, res) => {
    if (NodeCacheObj.get("teamMode")) {
        let filteredData = []
        const teamList = NodeCacheObj.get("teamListCache")
        for (let i = 0; i < teamList.length; i++) {
            filteredData.push({
                name: teamList[i].name,
                members: teamList[i].members
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
        const usernameTeamCache = NodeCacheObj.get("usernameTeamCache")
        const transactionsCache = NodeCacheObj.get("transactionsCache")
        if (req.body.name in teamList) {
            const team = teamList[req.body.name]
            let changes = []
            for (let i = 0; i < transactionsCache.length; i++) {
                const current = transactionsCache[i]
                if (current.author in usernameTeamCache && usernameTeamCache[current.author] === req.body.name) changes.push({ points: current.points, challenge: current.challenge, timestamp: current.timestamp, type: current.type, challengeID: current.challengeID })
            }
            // if own team, send invite code as well
            if (team.members.includes(req.locals.username)) {
                res.send({
                    success: true,
                    changes: changes,
                    code: team.code,
                    members: teamList[req.body.name]
                })
            }
            else {
                res.send({
                    success: true,
                    changes: changes,
                    members: teamList[req.body.name]
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
                team: ""
            })
        }
       
    }
    else res.send({
        success: false,
        error: "teams-disabled"
    })
}

const join = async (req, res) => {
    if (NodeCacheObj.get("teamMode")) {
        const collections = Connection.collections
        let teamList = NodeCacheObj.get("teamListCache")
        let usernameTeamCache = NodeCacheObj.get("usernameTeamCache")
        // Does a team exist for this team code, and is it correct?
        let currentTeam = {}
        let found = false
        for (let i = 0; i < teamList.length; i++) {
            if (teamList[i].code === req.body.code) {
                currentTeam = teamList[i]
                found = true
                break
            }
        }
        if (!found) return res.send({ success: false, error: "invalid-code" })
        // Is user already in another team?
        if (!(req.locals.username in usernameTeamCache)) {
            return res.send({
                success: false,
                error: "in-other-team"
            })
        }
        // Is user already in said team?
        if (currentTeam.members.includes(req.locals.username)) {
            return res.send({
                success: false,
                error: "already-in"
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
        broadCastNewSolve(NodeCacheObj.get("transactionsCache"))

        res.send({ success: true })
    }
    else res.send({ succcess: false, error: "teams-disabled" })

}

const create = async (req, res) => {
    if (NodeCacheObj.get("teamMode")) {
        const collections = Connection.collections
        let teamList = NodeCacheObj.get("teamListCache")
        let usernameTeamCache = NodeCacheObj.get("usernameTeamCache")
        // Is user already in a team?
        if (!(req.locals.username in usernameTeamCache)) {
            return res.send({
                success: false,
                error: "in-other-team"
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
            code: crypto.randomBytes(32).toString('hex')
        }
        teamList[req.body.name] = newTeam
        usernameTeamCache[req.locals.username] = req.body.name
        await collections.team.insertOne(newTeam)
        // Broadcast a new transaction to signal a new team change
        let teamUpdateID = NodeCacheObj.get("teamUpdateID")
        teamUpdateID += 1
        NodeCacheObj.set("teamUpdateID", teamUpdateID)
        broadCastNewSolve(NodeCacheObj.get("transactionsCache"))

        res.send({ success: true })
    }
    else res.send({ succcess: false, error: "teams-disabled" })
}

const leave = async (req, res) => {
    if (NodeCacheObj.get("teamMode")) {
        const collections = Connection.collections
        let teamList = NodeCacheObj.get("teamListCache")
        let usernameTeamCache = NodeCacheObj.get("usernameTeamCache")
        let currentTeam = {}
        let found = false
        // Find the team the user is in
        for (let i = 0; i < teamList.length; i++) {
            if (teamList[i].members.includes(req.locals.username)) {
                currentTeam = teamList[i]
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
        broadCastNewSolve(NodeCacheObj.get("transactionsCache"))
       
    }
    else res.send({ succcess: false, error: "teams-disabled" })
}

module.exports = { list, join, create, get, leave, userTeam }