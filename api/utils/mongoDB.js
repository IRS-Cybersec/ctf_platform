const mongoDB = require('mongodb')

class Connection {

    static async open() {

        if (this.db) return true
        const status = await mongoDB.MongoClient.connect("mongodb://localhost:27017", {
            useNewUrlParser: true,
            useUnifiedTopology: true
        }).then(async (client) => {
            const db = client.db('ctf')
            const collections = {
                users: db.collection('users'),
                challs: db.collection('challs'),
                transactions: db.collection('transactions'),
                pages: db.collection('pages'),
                announcements: db.collection('announcements'),
                cache: db.collection('cache')
            }
            this.db = db
            this.collections = collections
            console.info("MongoDB connected successfully!")
            return true
        }).catch((error) => {
            console.error(error)
            console.error("Error connecting to MongoDB")
            return false
        })
        return status
    }

}

Connection.db = null
Connection.collections = null
module.exports = Connection