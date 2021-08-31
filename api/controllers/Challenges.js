const Connection = require('./../utils/mongoDB.js')
const MongoDB = require('mongodb')

const disableStates = async (req, res, next) => {
    try {
        if (res.locals.perms < 2) throw new Error('Permissions');
        res.send({
            success: true,
            states: { submissionDisabled: req.app.get("submissionDisabled") }
        });
    }
    catch (err) {
        next(err);
    }
}

const list = async (req, res, next) => {
    const collections = Connection.collections
    try {
        let aggregation = [{
            $match: { visibility: true }
        }, {
            $group: {
                _id: '$category',
                challenges: {
                    $push: {
                        _id: "$_id",
                        name: '$name',
                        points: '$points',
                        solved: { $in: [res.locals.username.toLowerCase(), '$solves'] },
                        firstBlood: { $arrayElemAt: ['$solves', 0] },
                        tags: '$tags',
                        requires: '$requires'
                    }
                }
            }
        }];
        if (res.locals.perms >= 2) {
            aggregation = [{
                $group: {
                    _id: '$category',
                    challenges: {
                        $push: {
                            _id: "$_id",
                            name: '$name',
                            points: '$points',
                            solved: { $in: [res.locals.username.toLowerCase(), '$solves'] },
                            firstBlood: { $arrayElemAt: ['$solves', 0] },
                            tags: '$tags',
                            visibility: '$visibility',
                            requires: '$requires'
                        }
                    }
                }
            }];
        }
        res.send({
            success: true,
            challenges: await collections.challs.aggregate(aggregation).toArray()
        });
    }
    catch (err) {
        next(err);
    }
}

const listCategory = async (req, res, next) => {
    const collections = Connection.collections
    try {
        const challenges = await collections.challs.aggregate([{
            $match: {
                visibility: true,
                category: req.params.category
            }
        }, {
            $project: {
                name: '$name',
                points: '$points',
                solved: { $in: [res.locals.username.toLowerCase(), '$solves'] },
                firstBlood: { $arrayElemAt: ['$solves', 0] },
                tags: '$tags',
                requires: '$requires'
            }
        }]).toArray();
        if (challenges.length == 0) throw new Error('NotFound')
        res.send({
            success: true,
            challenges: challenges
        });
    }
    catch (err) {
        next(err);
    }
}


const listCategories = async (req, res, next) => {
    const collections = Connection.collections
    try {
        res.send({
            success: true,
            categories: await collections.challs.distinct('category', { visibility: true })
        });
    }
    catch (err) {
        next(err);
    }
}

const listAll = async (req, res, next) => {
    const collections = Connection.collections
    try {
        if (res.locals.perms < 2) throw new Error('Permissions');
        res.send({
            success: true,
            challenges: (await collections.challs.find({}, { projection: { name: 1, category: 1, points: 1, visibility: 1, solves: 1, requires: 1 } }).toArray())
        });
    }
    catch (err) {
        next(err);
    }
}

const listAllCategories = async (req, res, next) => {
    const collections = Connection.collections
    try {
        if (res.locals.perms < 2) throw new Error('Permissions');
        res.send({
            success: true,
            categories: await collections.challs.distinct('category')
        });
    }
    catch (err) {
        next(err);
    }
}

const show = async (req, res, next) => {
    const collections = Connection.collections
    try {
        const filter = res.locals.perms == 2 ? { name: req.params.chall } : { visibility: true, name: req.params.chall };
        let chall = await collections.challs.findOne(filter, { projection: { visibility: 0, flags: 0, _id: 0 } });

        if ("requires" in chall && res.locals.perms < 2) {
            const solved = await collections.challs.findOne({ name: chall.requires }, { projection: { _id: 0, solves: 1 } })
            if (!solved) return res.send({ success: false, error: "required-challenge-not-found" })
            if (!(solved.solves.includes(res.locals.username))) return res.send({ success: false, error: "required-challenge-not-completed" })
        }

        if (!chall) {
            res.status(400);
            res.send({
                success: false,
                error: 'notfound'
            });
            return;
        }
        if (chall.hints != undefined)
            chall.hints.forEach(hint => {
                if (hint.purchased.includes(res.locals.username)) {
                    hint.bought = true;
                    delete hint.cost;
                }
                else {
                    hint.bought = false;
                    delete hint.hint;
                }
                delete hint.purchased;
            });
        if (chall.writeup != undefined) {
            //If only send writeup after submitting flag option is ticked, check if challenge is completed before sending writeup link
            if (chall.writeupComplete) {
                if (chall.solves.find(element => element === res.locals.username) === undefined) chall.writeup = "CompleteFirst"
            }
        }
        if (chall.max_attempts != 0)
            chall.used_attempts = await collections.transactions.countDocuments({
                author: res.locals.username,
                challenge: req.params.chall,
                type: 'submission'
            }, { limit: chall.max_attempts });
        res.send({
            success: true,
            chall: chall
        });
    }
    catch (err) {
        next(err);
    }
}

const showDetailed = async (req, res, next) => {
    const collections = Connection.collections
    try {
        if (res.locals.perms < 2) throw new Error('Permissions');
        const chall = await collections.challs.findOne({ _id: MongoDB.ObjectID(req.params.chall) }, null);
        if (!chall) {
            res.status(400);
            res.send({
                success: false,
                error: 'notfound'
            });
            return;
        }
        res.send({
            success: true,
            chall: chall
        });
    }
    catch (err) {
        next(err);
    }
}

const hint = async (req, res, next) => {
    const collections = Connection.collections
    try {
        let findObject = { visibility: true, name: req.body.chall }
        if (res.locals.perms === 2) findObject = { name: req.body.chall }
        let hints = (await collections.challs.findOne(findObject, {
            projection: {
                hints: { $slice: [req.body.id, 1] },
                requires: 1,
                _id: 1
            }
        }));
        if ("requires" in hints) {
            const solved = await collections.challs.findOne({ name: hints.requires }, { projection: { _id: 0, solves: 1 } })
            if (!solved) return res.send({ success: false, error: "required-challenge-not-found" })
            if (!(solved.solves.includes(res.locals.username))) return res.send({ success: false, error: "required-challenge-not-completed" })
        }
        if (!hints) throw new Error('NotFound');
        if (!hints.hints[0]) throw new Error('OutOfRange');
        let Gtimestamp = new Date()
        if (!hints.hints[0].purchased.includes(res.locals.username)) {
            await collections.users.updateOne({
                username: res.locals.username
            }, {
                $inc: { score: -hints.hints[0].cost }
            });
            await collections.challs.updateOne({
                name: req.body.chall
            }, {
                $push: {
                    [`hints.${req.body.id}.purchased`]: res.locals.username
                }
            });
            await collections.transactions.insertOne({
                author: res.locals.username,
                challenge: req.body.chall,
                type: 'hint',
                timestamp: Gtimestamp,
                perms: res.locals.perms,
                points: -hints.hints[0].cost,
                hint_id: parseInt(req.body.id)
            });
            let latestSolveSubmissionID = req.app.get("latestSolveSubmissionID")
            latestSolveSubmissionID += 1
            req.app.set("latestSolveSubmissionID", latestSolveSubmissionID)
            await collections.cache.updateOne({}, { '$set': { latestSolveSubmissionID: latestSolveSubmissionID } })
            broadCastNewSolve({
                username: res.locals.username,
                timestamp: Gtimestamp,
                points: -hints.hints[0].cost,
                perms: res.locals.perms,
                lastChallengeID: latestSolveSubmissionID
            })
        }
       
        res.send({
            success: true,
            hint: hints.hints[0].hint
        });
    }
    catch (err) {
        next(err);
    }
}

const submit = async (req, res, next) => {
    const collections = Connection.collections
    try {
        const chall = await collections.challs.findOne({ visibility: true, name: req.body.chall }, { projection: { points: 1, flags: 1, solves: 1, max_attempts: 1, requires: 1, _id: 0 } });
        if (!chall) throw new Error('NotFound');
        if (req.app.get("submissionDisabled")) return res.send({ error: false, error: "submission-disabled" })
        if (chall.solves.includes(res.locals.username)) throw new Error('Submitted');

        //Check if the required challenge has been solved (if any)
        if ("requires" in chall) {
            const solved = await collections.challs.findOne({ name: chall.requires }, { projection: { _id: 0, solves: 1 } })
            if (!solved) return res.send({ success: false, error: "required-challenge-not-found" })
            if (!(solved.solves.includes(res.locals.username))) return res.send({ success: false, error: "required-challenge-not-completed" })
        }
        let Gtimestamp = new Date()
        async function insertTransaction(correct = false, blocked = false) {
            await collections.transactions.insertOne({
                author: res.locals.username,
                challenge: req.body.chall,
                timestamp: Gtimestamp,
                type: blocked ? 'blocked_submission' : 'submission',
                perms: res.locals.perms,
                points: correct ? chall.points : 0,
                correct: correct,
                submission: req.body.flag
            });
            if (correct && !blocked) {
                await collections.users.updateOne({
                    username: res.locals.username.toLowerCase()
                }, {
                    $inc: { score: chall.points }
                });
                await collections.challs.updateOne({
                    name: req.body.chall
                }, {
                    $push: { solves: res.locals.username.toLowerCase() }
                });
            }
        }
        if (chall.max_attempts != 0) {
            if (await collections.transactions.countDocuments({
                author: res.locals.username.toLowerCase(),
                challenge: req.body.chall,
                type: 'submission'
            }) >= chall.max_attempts) throw new Error('Exceeded');
        }
        let solved = false;
        if (chall.flags.includes(req.body.flag)) {
            solved = true;
            await insertTransaction(true);
            res.send({
                success: true,
                data: 'correct'
            });
            let latestSolveSubmissionID = req.app.get("latestSolveSubmissionID")
            latestSolveSubmissionID += 1
            req.app.set("latestSolveSubmissionID", latestSolveSubmissionID)
            await collections.cache.updateOne({}, { '$set': { latestSolveSubmissionID: latestSolveSubmissionID } })
            broadCastNewSolve({
                username: res.locals.username,
                timestamp: Gtimestamp,
                points: chall.points,
                perms: res.locals.perms,
                lastChallengeID: latestSolveSubmissionID
            })
        }
        // for "double-blind" CTFs - ask me if you want to
        // else if (chall.flags[0].substring(0, 1) == '$') chall.flags.some(flag => {
        // 	if (argon2.verify(flag, req.body.flag)) {
        // 		insertTransaction(true);
        // 		res.send({success: true});
        // 		solved = true;
        // 		return;
        // 	}
        // });
        if (!solved) {
            insertTransaction(false);
            res.send({
                success: true,
                data: 'ding dong your flag is wrong'
            });
        }
    }
    catch (err) {
        switch (err.message) {
            case 'Submitted':
                res.status(400);
                res.send({
                    success: false,
                    error: 'submitted'
                });
                return;
            case 'Exceeded':
                res.status(403);
                res.send({
                    success: false,
                    error: 'exceeded'
                });
                return;
        }
        next(err);
    }
}

const newChall = async (req, res, next) => {
    const collections = Connection.collections
    try {
        if (res.locals.perms < 1) throw new Error('Permissions');
        let doc = {
            name: req.body.name,
            category: req.body.category,
            description: req.body.description,
            points: parseInt(req.body.points),
            flags: req.body.flags,

            author: res.locals.username,
            created: new Date(),
            solves: [],
            max_attempts: req.body.max_attempts ? parseInt(req.body.max_attempts) : 0,
            visibility: req.body.visibility ? true : false,
        };
        if (req.body.tags) doc.tags = req.body.tags;
        if (req.body.hints) {
            doc.hints = req.body.hints;
            doc.hints.forEach(hint => {
                if (hint.cost == undefined) throw new Error('MissingHintCost');
                hint.cost = parseInt(hint.cost);
                hint.purchased = [];
            });
        }
        if (req.body.writeup) {
            doc.writeup = req.body.writeup
            doc.writeupComplete = req.body.writeupComplete
        }
        if (req.body.requires) {
            doc.requires = MongoDB.ObjectID(req.body.requires)
        }
        // if (req.body.files) {
        // 	for (file of req.body.files) {
        // 		if (typeof file.url != 'string' || typeof file.name != 'string') {

        // 			return;
        // 		}
        // 		if (file.url.substring(0, )) {

        // 		}
        // 	}
        // }

        await collections.challs.insertOne(doc);
        res.send({ success: true });
    }
    catch (err) {
        if (err.name == 'MongoError') {
            switch (err.code) {
                case 11000:
                    switch (Object.keys(err.keyPattern)[0]) {
                        case 'name':
                            res.status(403);
                            res.send({
                                success: false,
                                error: 'exists'
                            });
                            return;
                    }
                    res.send({
                        success: false,
                        error: 'validation'
                    });
            }
        }
        if (err.message == 'MissingHintCost') {
            res.status(400);
            res.send({
                success: false,
                error: 'validation'
            });
        }
        next(err);
    }
}

const edit = async (req, res, next) => {
    const collections = Connection.collections
    try {
        if (res.locals.perms < 2) throw new Error('Permissions');

        let updateObj = {};
        let unsetObj = {};
        const editables = ['name', 'category', 'description', 'points', 'flags', 'tags', 'hints', 'max_attempts', 'visibility', 'writeup', 'writeupComplete', 'requires'];
        for (field of editables) {
            if (req.body[field] != undefined) {
                if (req.body[field] === '') unsetObj[field] = "" // If the field is set to "", it means the user wants to delete this optional argument
                else updateObj[field] = req.body[field];
            } 
        }
        if (updateObj.hints) {
            updateObj.hints.forEach(hint => {
                if (hint.cost == undefined) throw new Error('MissingHintCost');
                hint.cost = parseInt(hint.cost);
                hint.purchased = hint.purchased != undefined ? hint.purchased : [];
            });
        }
        if ((await collections.challs.updateOne(
            { _id: MongoDB.ObjectID(req.body.id) },
            { '$set': updateObj }
        )).matchedCount === 0) throw new Error('NotFound');
        if (Object.keys(unsetObj).length > 0) {
            if ((await collections.challs.updateOne(
                { _id: MongoDB.ObjectID(req.body.id) },
                { '$unset': unsetObj }
            )).matchedCount === 0) throw new Error('NotFound');
        }
        res.send({ success: true });
    }
    catch (err) {
        if (err.message == 'MissingHintCost') {
            res.status(400);
            res.send({
                success: false,
                error: 'validation'
            });
        }
        if (err.name == 'MongoError') {
            switch (err.code) {
                case 11000:
                    switch (Object.keys(err.keyPattern)[0]) {
                        case 'name':
                            res.status(403);
                            res.send({
                                success: false,
                                error: 'exists'
                            });
                            return;
                    }
                    res.send({
                        success: false,
                        error: 'validation'
                    });
            }
        }
        next(err);
    }
}

const editVisibility = async (req, res, next) => {
    const collections = Connection.collections
    try {
        if (res.locals.perms < 2) throw new Error('Permissions');
        if (!Array.isArray(req.body.challenges)) throw new Error('Validation');
        let challenges = []
        for (let i = 0; i < req.body.challenges.length; i++) challenges.push(MongoDB.ObjectID(req.body.challenges[i])) 
        if ((await collections.challs.updateMany({
            _id: {
                $in: challenges
            }
        }, {
            $set: { visibility: req.body.visibility }
        })).matchedCount > 0) res.send({ success: true });
        else throw new Error('NotFound');
    }
    catch (err) {
        next(err);
    }
}

const editCategory = async (req, res, next) => {
    const collections = Connection.collections
    try {
        if (res.locals.perms < 2) throw new Error('Permissions');
        if (!Array.isArray(req.body.category)) throw new Error('Validation');
        let updateObj = {};
        if (req.body.visibility != undefined) updateObj.visibility = req.body.visibility;
        if (req.body.new_name != undefined) updateObj.category = req.body.new_name;
        if ((await collections.challs.updateMany({
            category: {
                $in: req.body.category
            }
        }, {
            $set: updateObj
        })).matchedCount > 0) res.send({ success: true });
        else throw new Error('NotFound');
    }
    catch (err) {
        if (err.message == 'Validation')
            res.send({
                success: false,
                error: 'validation'
            });
        else next(err);
    }
}

const deleteChall = async (req, res, next) => {
    const collections = Connection.collections
    try {
        if (res.locals.perms < 2) throw new Error('Permissions');
        let challenges = []
        for (let i = 0; i < req.body.chall.length; i++) {
            const currentID = ObjectID(req.body.chall[i])
            challenges.push(currentiD)
            const delReq = await collections.challs.findOneAndDelete({
                _id: currentID
            }, {
                solves: 1,
                points: 1,
                hints: 1,
                _id: 0
            });
            if (!delReq.ok) throw new Error('Unknown');
            if (delReq.value === null) throw new Error('NotFound');

            await collections.transactions.deleteMany({ challengeID: challenges });
            await collections.users.updateMany({
                username: { $in: delReq.value.solves }
            }, {
                $inc: { score: -delReq.value.points }
            });
            if (delReq.value.hints) {
                for (hint of delReq.value.hints) {
                    await collections.users.updateMany({
                        username: { $in: hint.purchased }
                    }, {
                        $inc: { score: hint.cost }
                    });
                }
            }
        }

        res.send({
            success: true
        });
    }
    catch (err) {
        next(err);
    }
}

module.exports = {disableStates, list, listCategory, listCategories, listAll, listAllCategories, show, showDetailed, hint, submit, newChall, edit, editVisibility, editCategory, deleteChall}