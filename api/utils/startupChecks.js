const Connection = require('./mongoDB.js')
const validators = require('./validators.js')

const startValidation = async () => {
    const collections = Connection.collections
    const db = Connection.db

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

    return true
}

module.exports = {startValidation}