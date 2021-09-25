const Connection = require('./mongoDB.js')
const validators = require('./validators.js')
const crypto = require('crypto');
const argon2 = require('argon2');
var fs = require('fs');
const { ENOENT } = require('constants');

const startValidation = async (app) => {
    const collections = Connection.collections

     // (1) Insert Validation
     try {
        await Connection.db.command({ collMod: "users", validator: validators.users })
        await Connection.db.command({ collMod: "transactions", validator: validators.transactions })
        await Connection.db.command({ collMod: "challs", validator: validators.challs })
        console.log("Validation inserted")
    }
    catch (e) { console.error(e) }

    // (2) Create Indexes
    if ((await collections.users.indexes()).length === 1) {
        // Users indexes
        collections.users.createIndex({ "username": 1 }, { unique: true, name: "username" })
        collections.users.createIndex({ "email": 1 }, { unique: true, name: "email" })
        console.log("Users indexes created")
    }
    if ((await collections.challs.indexes()).length === 1) {
        // Challs indexes
        collections.challs.createIndex({ "category": 1, "visibility": 1 }, { name: "catvis" })
        collections.challs.createIndex({ "name": 1 }, { unique: true, name: "name" })
        console.log("Challs indexes created")
    }
    if ((await collections.transactions.indexes()).length === 1) {
        // Transcations indexes
        collections.transactions.createIndex({ "author": 1, "challenge": 1, "type": 1 }, { name: "userchall" })
        console.log("Transcations indexes created")
    }

    await createDefaultAdminAccount(collections.users, collections.transactions, app);
    await loadConfigFile(collections.cache);
    return true
}

async function createDefaultAdminAccount(userCollection, transactionColl, app) {
    const adminAccount = await userCollection.findOne({type: 2});

    if (adminAccount === null){    
        console.log("No admin account found, so one will be created.");
        const adminUser = crypto.randomBytes(8).toString('hex');
        const adminPassword = crypto.randomBytes(64).toString('hex');
        const adminEmail = adminUser + "@localhost";
        console.log("Admin Account Username: " + adminUser);
        console.log("Admin Account Password: " + adminPassword);
        console.log("Admin Account Email: " + adminEmail);

        await userCollection.insertOne({
            username: adminUser,
            email: adminEmail,
            password: await argon2.hash(adminPassword),
            type: 2
        });
        let latestSolveSubmissionID = app.get("latestSolveSubmissionID")
        if (isNaN(latestSolveSubmissionID)) latestSolveSubmissionID = 1
        else latestSolveSubmissionID += 1
        let insertDoc = {
            author: adminUser.toLowerCase(),
            challenge: 'Registered',
            challengeID: null,
            timestamp: new Date(),
            type: 'initial_register',
            points: 0,
            correct: true,
            submission: '',
            lastChallengeID: latestSolveSubmissionID
        }
        let transactionsCache = app.get("transactionsCache")
        transactionsCache.push(insertDoc)
        app.set("transactionsCache", transactionsCache)
        await transactionColl.insertOne(insertDoc)

    }
};

async function loadConfigFile(cacheCollection) {
    try {
        const configData = JSON.parse(fs.readFileSync('config.json', 'utf8'));
        await cacheCollection.updateOne({}, { $set: configData }, { upsert: true });
        console.log("Added "+ Object.keys(configData).length + " field(s) to cache")
    } catch (e) {
        if (e instanceof ENOENT) {
            return;
        } else {
            throw e;
        }
    }
}

module.exports = {startValidation}