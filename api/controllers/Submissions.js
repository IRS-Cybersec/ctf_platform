const Connection = require('./../utils/mongoDB.js')
const { broadCastNewSolve } = require('./../controllers/Sockets.js')
const MongoDB = require('mongodb')
const createTransactionsCache = require('./../utils/createTransactionsCache.js')

const submissions = async (req, res) => {
    if (req.locals.perms < 2) throw new Error('Permissions');
    const collections = Connection.collections;
    res.send({
        success: true,
        submissions: await collections.transactions.find({}).toArray(),
        userCatMapping: NodeCacheObj.get("userCategories"),
        categoryList: NodeCacheObj.get("categoryList")
    });
}

const newSubmission = async (req, res) => {
    const collections = Connection.collections
    if (req.locals.perms < 2) throw new Error('Permissions');
    const GTime = new Date()
    let latestSolveSubmissionID = NodeCacheObj.get("latestSolveSubmissionID")
    latestSolveSubmissionID += 1
    NodeCacheObj.set("latestSolveSubmissionID", latestSolveSubmissionID)
    let insertDoc = {
        author: req.body.author,
        challenge: req.body.challenge,
        challengeID: MongoDB.ObjectId(req.body.challengeID),
        type: req.body.type,
        timestamp: GTime,
        lastChallengeID: latestSolveSubmissionID,
        points: req.body.points
    }
    if (req.body.type === "hint") {
        insertDoc.hint_id = req.body.hint_id - 1
    }
    else {
        insertDoc.correct = req.body.correct
        insertDoc.submission = req.body.submission
    }

    let transactionsCache = NodeCacheObj.get("transactionsCache")
    const usernameTeamCache = NodeCacheObj.get("usernameTeamCache")
    if (NodeCacheObj.get("teamMode") && req.body.author in usernameTeamCache) {
        // User is in a team
        insertDoc.author = usernameTeamCache[req.body.author]
        insertDoc.originalAuthor = req.body.author

        // Check if the transaction the admin is inserting is a duplicate
        const teamTransacList = transactionsCache[insertDoc.author].changes
        let replacedDuplicateWithOlderSolve = false
        let duplicate = false
        for (let i = 0; i < teamTransacList.length; i++) {
            if (teamTransacList[i].challengeID && insertDoc.challengeID && teamTransacList[i].challengeID.toString() === insertDoc.challengeID.toString() && teamTransacList[i].type === insertDoc.type && teamTransacList[i].points === insertDoc.points) {
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
        if (!duplicate && !replacedDuplicateWithOlderSolve) teamTransacList.push(insertDoc)

        transactionsCache[insertDoc.originalAuthor].changes.push(insertDoc)
    }
    else {
        if (!(insertDoc.author in transactionsCache)) throw new Error("NotFound")
        transactionsCache[insertDoc.author].changes.push(insertDoc)
    }

    await collections.transactions.insertOne(insertDoc)

    broadCastNewSolve([{
        _id: insertDoc._id,
        author: "originalAuthor" in insertDoc ? usernameTeamCache[req.body.author] : req.body.author,
        timestamp: GTime,
        points: req.body.points,
        lastChallengeID: latestSolveSubmissionID
    }])
    res.send({ success: true })
}

const editSubmission = async (req, res) => {
    const collections = Connection.collections
    if (req.locals.perms < 2) throw new Error('Permissions');
    let latestSolveSubmissionID = NodeCacheObj.get("latestSolveSubmissionID")
    latestSolveSubmissionID += 1
    NodeCacheObj.set("latestSolveSubmissionID", latestSolveSubmissionID)
    let updateDoc = {
        author: req.body.author,
        challenge: req.body.challenge,
        challengeID: MongoDB.ObjectId(req.body.challengeID),
        type: req.body.type,
        lastChallengeID: latestSolveSubmissionID,
        points: req.body.points
    }
    if (req.body.type === "hint") {
        updateDoc.hint_id = req.body.hint_id - 1
    }
    else {
        updateDoc.correct = req.body.correct
        updateDoc.submission = req.body.submission
    }

    let transactionsCache = NodeCacheObj.get("transactionsCache")
    let time = null
    const usernameTeamCache = NodeCacheObj.get("usernameTeamCache")
    if (NodeCacheObj.get("teamMode") && req.body.author in usernameTeamCache) {
        // User is in a team
        updateDoc.author = usernameTeamCache[req.body.author]
        updateDoc.originalAuthor = req.body.author

        // update team transaction
        const current = transactionsCache[updateDoc.author].changes
        for (let i = 0; i < current.length; i++) {
            if (current[i]._id.toString() === req.body.id) {
                time = current[i].timestamp
                for (key in updateDoc) {
                    current[i][key] = updateDoc[key]
                }
                break
            }
        }
        // update user transaction
        const current2 = transactionsCache[updateDoc.author].changes
        for (let i = 0; i < current2.length; i++) {
            if (current2[i]._id.toString() === req.body.id) {
                time = current2[i].timestamp
                for (key in updateDoc) {
                    current2[i][key] = updateDoc[key]
                }
                break
            }
        }
    }
    else {
        const current = transactionsCache[updateDoc.author].changes

        for (let i = 0; i < current.length; i++) {
            if (current[i]._id.toString() === req.body.id) {
                time = current[i].timestamp
                for (key in updateDoc) {
                    current[i][key] = updateDoc[key]
                }
                break
            }
        }
    }
    await collections.transactions.updateOne({ _id: MongoDB.ObjectId(req.body.id) }, { $set: updateDoc })

    broadCastNewSolve([{
        _id: req.body.id,
        author: "originalAuthor" in updateDoc ? usernameTeamCache[req.body.author] : req.body.author,
        timestamp: time,
        points: req.body.points,
        lastChallengeID: latestSolveSubmissionID
    }])
    res.send({ success: true })
}

const deleteSubmission = async (req, res) => {
    const collections = Connection.collections
    if (req.locals.perms < 2) throw new Error('Permissions');
    let notFoundList = []
    let challengeCache = NodeCacheObj.get("challengeCache")
    for (let i = 0; i < req.body.ids.length; i++) {
        const current = req.body.ids[i]
        let delReq = await collections.transactions.findOneAndDelete({ _id: MongoDB.ObjectId(current) })
        if (delReq.value === null) notFoundList.push(current)
        else {
            delReq = delReq.value
            //const challengeID = MongoDB.ObjectId(delReq.challengeID.toString())
            const challDoc = await collections.challs.findOne({ _id: delReq.challengeID })
            if (delReq.type === "hint") {
                const hints = challDoc.hints
                const hintsArray = hints[delReq.hint_id].purchased
                const index = hintsArray.indexOf(delReq.author)
                if (index !== -1) { // in case the hint purchase record is not found for any reason
                    hintsArray.splice(index, 1)
                    await collections.challs.updateOne({ _id: delReq.challengeID }, { $set: { hints: hints } })
                }
            }
            else if (delReq.type === "submission") {
                const solves = challDoc.solves
                const index = solves.indexOf(delReq.author)
                if (index !== -1) { // in case the challenge purchase record is not found for any reason
                    solves.splice(index, 1)
                    await collections.challs.updateOne({ _id: delReq.challengeID }, { $set: { solves: solves } })
                }
                const index2 = challengeCache[delReq.challengeID].solves.indexOf(delReq.author)
                if (index2 !== -1) { // in case the challenge purchase record is not found for any reason
                    solves.splice(index, 1)
                    challengeCache[delReq.challengeID].solves.splice(index2, 1)
                }

            }
        }

    }
    let transactionsCache = NodeCacheObj.get("transactionsCache")
    for (username in transactionsCache) {
        const current = transactionsCache[username].changes
        for (let i = 0; i < current.length; i++) {
            if (req.body.ids.includes(current[i]._id.toString())) {
                current.splice(i, 1)
            }
        }
    }
    
    NodeCacheObj.set("transactionsCache", await createTransactionsCache())


    if (notFoundList.length === 0) {
        res.send({
            success: true,
        });
    }
    else {
        res.send({
            success: false,
            error: "not-found",
            ids: notFoundList
        })
    }

}

module.exports = { submissions, newSubmission, deleteSubmission, editSubmission }