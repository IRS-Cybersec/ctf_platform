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
        const teamRequest = req.raw.originalUrl.split("/v1/team/info/")
        let teamName = ""

        if (teamRequest.length > 0) teamName = decodeURIComponent(teamRequest[1])
        else return res.send({success: false, error: "empty-name"})

        if (teamName in teamList) {
            const team = teamList[teamName]
            let changes = []
            if (transactionsCache[teamName]) changes = transactionsCache[teamName].changes // in case it is a hidden admin team
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
        let currentTeam = null
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
            let currentTeam = null
            let found = false
            for (const team in teamList) {
                const current = teamList[team]
                if (current.code === req.body.code) {
                    currentTeam = teamList[team]
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
            if (currentTeam.members.length >= NodeCacheObj.get("teamMaxSize")) {
                return res.send({
                    success: false,
                    error: "team-full"
                })
            }
            let transactionCache = NodeCacheObj.get("transactionsCache")
            currentTeam.members.push(req.locals.username)
            await collections.team.updateOne({ name: currentTeam.name }, { $set: { members: currentTeam.members } })
            usernameTeamCache[req.locals.username] = currentTeam.name
            transactionCache[currentTeam.name].members = JSON.parse(JSON.stringify(currentTeam.members)) // have to make a deep copy if not when we edit this members list, the other list is also edited
            // Broadcast a new transaction to signal a new team join
            let teamUpdateID = NodeCacheObj.get("teamUpdateID")
            teamUpdateID += 1
            NodeCacheObj.set("teamUpdateID", teamUpdateID)
            await collections.cache.updateOne({}, { $set: { teamUpdateID: teamUpdateID } })

            const userTransactions = JSON.parse(JSON.stringify(transactionCache[req.locals.username].changes)) 
            // have to make a deep copy so that the transactions inside the team transactions are not linked to the user's transactions
            // if not, when adding a new user's transactions, you are actually pushing to the OTHER USER'S TRANSACTIONS LIST instead of only the team list
            const teamTransacList = transactionCache[currentTeam.name].changes
            for (let i = 0; i < userTransactions.length; i++) {
                userTransactions[i].author = currentTeam.name
                userTransactions[i].originalAuthor = req.locals.username

                transactionCache[req.locals.username].changes[i].author = currentTeam.name
                transactionCache[req.locals.username].changes[i].originalAuthor = req.locals.username

                // Add this user's transactions to the team's transactions, and also check for duplicates
                let replacedDuplicateWithOlderSolve = false
                let duplicate = false
                for (let x = 0; x < teamTransacList.length; x++) {
                    if (teamTransacList[x].challengeID && userTransactions[i].challengeID && teamTransacList[x].challengeID.toString() === userTransactions[i].challengeID.toString() && teamTransacList[x].type === userTransactions[i].type && teamTransacList[x].points === userTransactions[i].points) {
                        if ("hint_id" in userTransactions[i] && "hint_id" in teamTransacList[x]) {
                            if (userTransactions[i].hint_id === teamTransacList[x].hint_id) {
                                duplicate = true
                                // Current insertDoc is a duplicate transaction for this team
                                // Check whether insertDoc has a timestamp before the current 1 in the team list, then set it to it
                                if (userTransactions[i].timestamp < teamTransacList[x].timestamp) {
                                    replacedDuplicateWithOlderSolve = true
                                    teamTransacList[x].timestamp = userTransactions[i].timestamp
                                }
                                break
                            }
                        }
                        else {
                            duplicate = true
                            // Current insertDoc is a duplicate transaction for this team
                            // Check whether insertDoc has a timestamp before the current 1 in the team list, then set it to it
                            if (userTransactions[i].timestamp < teamTransacList[x].timestamp) {
                                replacedDuplicateWithOlderSolve = true
                                teamTransacList[x].timestamp = userTransactions[i].timestamp
                            }
                            break
                        }

                    }
                }
                if (!duplicate && !replacedDuplicateWithOlderSolve) teamTransacList.push(userTransactions[i])
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
            const usernames = await collections.users.find({}, {projection: {username: 1, _id: 0}}).toArray()
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
            if (!/^[a-zA-Z0-9_ ]{1,25}$/.test(req.body.name)) return res.send({
                success: false,
                error: "bad-team-name"
            })
            // Team names must not be the same name as a username if not the transactionCache will fail to create unique entries
            for (let i = 0; i < usernames.length; i++) {
                if (usernames[i].username === req.body.name) {
                    return res.send({
                        success: false,
                        error: "same-name-as-user"
                    })
                }
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

            // If an admin is hidden, their transactions are not in the cache. Hence we need to check if the name is inside
            let userTransactions = []
            if (req.locals.username in transactionCache) userTransactions = transactionCache[req.locals.username].changes
            for (let i = 0; i < userTransactions.length; i++) {
                userTransactions[i].author = req.body.name
                userTransactions[i].originalAuthor = req.locals.username
            }
            // Insert the user's transactions into the new team's transactions
            transactionCache[req.body.name] = { _id: req.body.name, changes: JSON.parse(JSON.stringify(userTransactions)), members: [req.locals.username], isTeam: true }
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
            let currentTeam = null
            let found = false
            // Find the team the user is in
            for (const team in teamList) {
                const current = teamList[team]
                if (current.members.includes(req.locals.username)) {
                    currentTeam = teamList[team]
                    currentTeam.name = team
                    found = true
                    break
                }
            }
            if (!found) return res.send({ success: false, error: "not-in-any-team" })

            delete usernameTeamCache[req.locals.username]
            let transactionCache = NodeCacheObj.get("transactionsCache")
            let lastMember = false
            // last member is leaving the team
            if (currentTeam.members.length === 1) {
                delete teamList[currentTeam.name]
                delete transactionCache[currentTeam.name]
                await collections.team.deleteOne({ name: currentTeam.name })
                lastMember = true
                res.send({ success: true, msg: "last-member" })
            }
            else {
                currentTeam.members.splice(currentTeam.members.indexOf(req.locals.username), 1)
                transactionCache[currentTeam.name].members.splice(transactionCache[currentTeam.name].members.indexOf(req.locals.username), 1)
                await collections.team.updateOne({ name: currentTeam.name }, { $set: { members: currentTeam.members } })
                res.send({ success: true })
            }
            // Broadcast a new transaction to signal a new team join
            let teamUpdateID = NodeCacheObj.get("teamUpdateID")
            teamUpdateID += 1
            NodeCacheObj.set("teamUpdateID", teamUpdateID)
            await collections.cache.updateOne({}, { $set: { teamUpdateID: teamUpdateID } })

            const userTransactions = transactionCache[req.locals.username].changes
            for (let i = 0; i < userTransactions.length; i++) {
                userTransactions[i].author = req.locals.username
                delete userTransactions[i].originalAuthor
            }
            // When a player leaves the team, we need to re-calculate the team transactions since any duplicate transactions would have been removed.
            // If the player with a duplicate transaction leaves, there won't be any of that transaction left
            if (!lastMember) {
                let teamTransacList = []
                for (let i = 0; i < currentTeam.members.length; i++) {
                    const currentUserTransc = JSON.parse(JSON.stringify(transactionCache[currentTeam.members[i]].changes))

                    for (let x = 0; x < currentUserTransc.length; x++) {
                        const current = currentUserTransc[x]
                        let replacedDuplicateWithOlderSolve = false
                        let duplicate = false
                        for (let y = 0; y < teamTransacList.length; y++) {
                            if (teamTransacList[y].challengeID && current.challengeID && teamTransacList[y].challengeID.toString() === current.challengeID.toString() && teamTransacList[y].type === current.type && teamTransacList[y].points === current.points) {
                                if ("hint_id" in current && "hint_id" in teamTransacList[y]) {
                                    if (current.hint_id === teamTransacList[y].hint_id) {
                                        duplicate = true
                                        // Current insertDoc is a duplicate transaction for this team
                                        // Check whether insertDoc has a timestamp before the current 1 in the team list, then set it to it
                                        if (current.timestamp < teamTransacList[y].timestamp) {
                                            replacedDuplicateWithOlderSolve = true
                                            teamTransacList[y].timestamp = current.timestamp
                                        }
                                        break
                                    }
                                }
                                else {
                                    duplicate = true
                                    // Current insertDoc is a duplicate transaction for this team
                                    // Check whether insertDoc has a timestamp before the current 1 in the team list, then set it to it
                                    if (current.timestamp < teamTransacList[y].timestamp) {
                                        replacedDuplicateWithOlderSolve = true
                                        teamTransacList[y].timestamp = current.timestamp
                                    }
                                    break
                                }

                            }
                        }
                        if (!duplicate && !replacedDuplicateWithOlderSolve) teamTransacList.push(current)
                    }

                }
                //console.table(teamTransacList)
                transactionCache[currentTeam.name].changes = teamTransacList
                //console.table(transactionCache[currentTeam.name])
            }

            await collections.transactions.updateMany({ originalAuthor: req.locals.username }, { $set: { author: req.locals.username }, $unset: { originalAuthor: 0 } })
            broadCastNewTeamChange()
        }
        else res.send({ success: false, error: "team-change-disabled" })
    }
    else res.send({ succcess: false, error: "teams-disabled" })
}

module.exports = { list, join, create, get, leave, userTeam, linkInfo }