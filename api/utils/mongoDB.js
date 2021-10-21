const mongoDB = require('mongodb')

class Connection {

    static async open() {

        if (this.db) return true
        const status = await mongoDB.MongoClient.connect("mongodb://ctf-mongodb:27017", {
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
                cache: db.collection('cache'),
                team: db.collection('team'),
                passResetCode: db.collection('passResetCode')
            }
            this.db = db
            this.collections = collections
            const collectionList = Object.keys(this.collections)
            const dbCollections = await db.listCollections().toArray()
            for (const collectionName of collectionList){
                if (!dbCollections.some(c => c.name === collectionName)){
                    console.info('Creating collection ' + collectionName + ' as it does not exist')
                    const tempDoc = await this.collections[collectionName].insertOne({'temp':'doc'})
                    await this.collections[collectionName].deleteOne({'_id': tempDoc.insertedId})
                }
            }
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
