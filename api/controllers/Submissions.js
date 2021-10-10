const Connection = require('./../utils/mongoDB.js')
const { broadCastNewSolve } = require('./../controllers/Sockets.js')
const MongoDB = require('mongodb')

const submissions = async (req, res) => {
    if (req.locals.perms < 2) throw new Error('Permissions');
    res.send({
        success: true,
        submissions: NodeCacheObj.get("transactionsCache")
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
    transactionsCache.push(insertDoc)
    await collections.transactions.insertOne(insertDoc)

    broadCastNewSolve([{
        _id: insertDoc._id,
        username: req.body.author,
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
    await collections.transactions.updateOne({ _id: MongoDB.ObjectId(req.body.id) }, { $set: updateDoc })
    let transactionsCache = NodeCacheObj.get("transactionsCache")
    let time = null
    for (let i = 0; i < transactionsCache.length; i++) {
        if (transactionsCache[i]._id.toString() === req.body.id) {
            time = transactionsCache[i].timestamp
            for (key in updateDoc) {
                transactionsCache[i][key] = updateDoc[key]
            }
            break
        }
    }


    broadCastNewSolve([{
        _id: req.body.id,
        username: req.body.author,
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

            }
        }

    }
    let transactionsCache = NodeCacheObj.get("transactionsCache")
    for (let i = 0; i < transactionsCache.length; i++) {
        if (req.body.ids.includes(transactionsCache[i]._id.toString())) {
            transactionsCache.splice(i, 1)
        }
    }

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