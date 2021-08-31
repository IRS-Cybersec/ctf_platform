var wss = null
var app = null
var collections = null
const ws = require('ws')
const { checkPermissions } = require('./../utils/permissionUtils.js')
const Connection = require('./../utils/mongoDB.js')

const startup = async (server, appVar) => {
    collections = Connection.collections
    wss = new ws.Server({ server })
    app = appVar

    //websocket methods
    wss.on('connection', (socket) => {
        socket.isAlive = true
        socket.on('pong', () => { socket.isAlive = true }); // check for any clients that dced without informing the server

        socket.on("message", async (msg) => {
            const data = JSON.parse(msg)
            if (data.type === "init") {
                const payload = data.data
                //Authenticate
                if (payload.auth == undefined) {
                    socket.send(JSON.stringify({ type: "init", data: "missing-auth" }));
                    return socket.terminate()
                }
                const permsObject = await checkPermissions(payload.auth);
                if (permsObject === false) {
                    socket.send(JSON.stringify({ type: "init", data: "bad-auth" }))
                    return socket.terminate()
                }
                socket.isAuthed = true

                
                const latestSolveSubmissionID = app.get("latestSolveSubmissionID")
                console.log(payload.lastChallengeID)
                console.log(latestSolveSubmissionID)
                if (payload.lastChallengeID < latestSolveSubmissionID) {
                    let challengesToBeSent = collections.transactions.find({}, { projection: { _id: 0, perms: 1, author: 1, timestamp: 1, points: 1 } }).sort({ $natural: -1 }).limit(app.get("latestSolveSubmissionID") - payload.lastChallengeID);
                    let finalChallenges = []
                    if (app.get("adminShowDisable")) {
                        await challengesToBeSent.forEach((doc) => {
                            if (doc.perms !== 2) finalChallenges.push(doc)
                        })
                    }
                    else {
                        finalChallenges = await challengesToBeSent.toArray()
                    }
                    console.log(finalChallenges)
                    socket.send(JSON.stringify({ type: "init", data: finalChallenges, lastChallengeID: latestSolveSubmissionID }))
                }
                else socket.send(JSON.stringify({ type: "init", data: "up-to-date" }))
            }
        })
    })

    // check for any clients that dced without informing the server
    const interval = setInterval(function ping() {
        wss.clients.forEach(function each(ws) {
            if (ws.isAlive === false) return ws.terminate();

            ws.isAlive = false;
            ws.ping();
        });
    }, 30000);

    wss.on('close', function close() {
        clearInterval(interval);
    });
}

const broadCastNewSolve = async (solveDetails) => {
    if (app.get("adminShowDisable") && solveDetails.perms === 2) {
        return false
    }
    wss.clients.forEach((client) => {
        if (client.readyState === ws.OPEN && client.isAuthed === true) {
            client.send(JSON.stringify({ type: "score", data: solveDetails }));
        }
    })
}



module.exports = { startup, broadCastNewSolve }