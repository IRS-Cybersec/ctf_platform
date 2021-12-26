const Connection = require('./mongoDB.js')
const { checkUsernamePerms } = require('./../utils/permissionUtils.js')

const createCache = async () => {
    const collections = Connection.collections
    let transactionsCache = {}
    const cursor = collections.transactions.find({})
    const teamList = NodeCacheObj.get("teamListCache")
    await cursor.forEach(async (doc) => {
        let isAdmin = false

        if (NodeCacheObj.get("adminShowDisable")) {
            if ("originalAuthor" in doc) {
                if (await checkUsernamePerms(doc.originalAuthor) === 2) isAdmin = true
            }
            else if (await checkUsernamePerms(doc.author) === 2) isAdmin = true
        }

        if (!NodeCacheObj.get("adminShowDisable") || (NodeCacheObj.get("adminShowDisable") && !isAdmin)) {

            const insertDoc = {
                _id: doc._id,
                author: doc.author,
                points: doc.points,
                challenge: doc.challenge,
                timestamp: doc.timestamp,
                challengeID: doc.challengeID,
                lastChallengeID: doc.lastChallengeID,
                type: doc.type
            }

            if ("hint_id" in doc) insertDoc.hint_id = doc.hint_id
            // Sort individual user's transactions
            if ("originalAuthor" in doc) { // Person is in a team
                insertDoc.originalAuthor = doc.originalAuthor
                if (insertDoc.originalAuthor in transactionsCache) transactionsCache[insertDoc.originalAuthor].changes.push(insertDoc)
                else {
                    transactionsCache[insertDoc.originalAuthor] = { _id: insertDoc.originalAuthor, changes: [insertDoc], members: [insertDoc.originalAuthor], isTeam: false }
                }


                // Handle team transaction
                if (insertDoc.author in transactionsCache) {
                    // Iterate through list of team transactions to see if any of the team transactions are duplicates of this current transaction
                    // Duplicate means 2 transactions of the same challenge (and same type)
                    const teamTransacList = transactionsCache[insertDoc.author].changes
                    let replacedDuplicateWithOlderSolve = false
                    let duplicate = false
                    for (let i = 0; i < teamTransacList.length; i++) {
                        if (teamTransacList[i].challengeID && insertDoc.challengeID && teamTransacList[i].challengeID.toString() === insertDoc.challengeID.toString() && teamTransacList[i].type === insertDoc.type && teamTransacList[i].points === insertDoc.points) {
                            // both are hints
                            if ("hint_id" in insertDoc && "hint_id" in teamTransacList[i]) {
                                if (insertDoc.hint_id === teamTransacList[i].hint_id) {
                                    duplicate = true
                                    // Current insertDoc is a duplicate transaction for this team
                                    // Check whether insertDoc has a timestamp before the current 1 in the team list, then set it to it
                                    if (insertDoc.timestamp < teamTransacList[i].timestamp) {
                                        replacedDuplicateWithOlderSolve = true
                                        teamTransacList[i].timestamp = insertDoc.timestamp
                                    }
                                    break
                                }
                            }
                            else {
                                duplicate = true
                                // Current insertDoc is a duplicate transaction for this team
                                // Check whether insertDoc has a timestamp before the current 1 in the team list, then set it to it
                                if (insertDoc.timestamp < teamTransacList[i].timestamp) {
                                    replacedDuplicateWithOlderSolve = true
                                    teamTransacList[i].timestamp = insertDoc.timestamp
                                }
                                break
                            }

                        }
                    }
                    if (!duplicate && !replacedDuplicateWithOlderSolve) teamTransacList.push(insertDoc)
                }
                else {
                    if (insertDoc.author in teamList) transactionsCache[insertDoc.author] = { _id: insertDoc.author, changes: [insertDoc], members: JSON.parse(JSON.stringify(teamList[insertDoc.author].members)), isTeam: true }
                    else {
                        console.info("Found a user whose team no longer exists but transactions were not updated. Updating now")
                        await collections.transactions.updateOne({ author: insertDoc.author }, { $unset: { originalAuthor: 0 }, $set: { author: insertDoc.originalAuthor } })
                    }
                }
            }
            else { // Person is not in a team
                if (insertDoc.author in transactionsCache) transactionsCache[insertDoc.author].changes.push(insertDoc)
                else transactionsCache[insertDoc.author] = { _id: insertDoc.author, changes: [insertDoc], members: [insertDoc.author], isTeam: false }
            }
        }
    })

    return transactionsCache
}

module.exports = createCache
