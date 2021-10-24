const Connection = require('./../utils/mongoDB.js')
const { deletePermissions } = require('./../utils/permissionUtils.js')
const crypto = require('crypto');
const argon2 = require('argon2');
const dayjs = require('dayjs')
const relativeTime = require('dayjs/plugin/relativeTime')
dayjs.extend(relativeTime)

const disableStates = async (req, res) => {
    if (req.locals.perms < 2) throw new Error('Permissions');
    res.send({
        success: true,
        states: {
            host: NodeCacheObj.get("SMTPHost"),
            port: NodeCacheObj.get("SMTPPort"),
            secure: NodeCacheObj.get("SMTPSecure"),
            user: NodeCacheObj.get("SMTPUser"),
            pass: NodeCacheObj.get("SMTPPass"),
            websiteLink: NodeCacheObj.get("websiteLink"),
            emailSenderAddr: NodeCacheObj.get("emailSenderAddr"),
            emailSender: NodeCacheObj.get("emailSender"),
            emailResetTime: NodeCacheObj.get("emailResetTime"),
            emailCooldown: NodeCacheObj.get("emailCooldown")
        }
    });
}

const testConnection = async (req, res) => {
    if (req.locals.perms < 2) throw new Error('Permissions');
    const transporter = NodeCacheObj.get("NodemailerT")
    transporter.verify((err, success) => {
        if (err) {
            console.error(err)
            res.send({
                success: false,
                error: err
            })
        }
        else res.send({ success: true })
    })
}

const forgotPassword = async (req, res) => {
    const collections = Connection.collections
    if (NodeCacheObj.get("forgotPass")) {
        res.send({ success: true }) // send request first so that they can't check if an email exists by time brute forcing
        const user = await collections.users.findOne({ email: req.body.email.toLowerCase() }, { projection: { username: 1, email: 1, _id: 0 } });
        if (user) {
            let tooRecent = false
            const NodemailerT = NodeCacheObj.get('NodemailerT')
            // Check if an existing code for that username already exists, if so, invalidate it
            const passReset = await collections.passResetCode.findOne({ username: user.username })
            if (passReset) {
                // If the code was created less than 2 mins ago, refuse to create & resend another one
                if (new Date() - passReset.timestamp < NodeCacheObj.get("emailCooldown") * 1000) tooRecent = true
                else await collections.passResetCode.deleteOne({ username: user.username })
            }
            if (!tooRecent) {
                const code = crypto.randomBytes(32).toString('hex')
                await collections.passResetCode.insertOne({ username: user.username, code: await argon2.hash(code), timestamp: new Date() })

                // Send email using nodemailer
                try {
                    const link = NodeCacheObj.get("websiteLink") + "/reset/password/" + user.username + "/" + code
                    const timeLeft = dayjs().add(NodeCacheObj.get("emailResetTime"), "s").toNow(true)
                    console.log(timeLeft)

                    const response = await NodemailerT.sendMail({
                        from: '"' + NodeCacheObj.get("emailSender") + '"' + ' <' + NodeCacheObj.get("emailSenderAddr") + '>', // sender address
                        to: user.email,
                        subject: "Password Reset Request for Sieberrsec CTF Platform", // Subject line
                        text: "Dear " + user.username + ",\n\n  Someone has requested a password reset for your Sieberrsec CTF Platform account. Your password reset link is: \n" + link + "\n\n The password link will expire in 10 minutes. If you did not request this email, you can safely ignore this email.", // plain text body
                        html: `
                        Dear ${user.username},<br><br>  Someone has requested a password reset for your Sieberrsec CTF Platform account. To reset your password, click <a href='${link}'>here</a>. 
                        <br><br>
                        The password link will expire in <b>${timeLeft}</b>. If you did not request this email, you can safely ignore this email.
                        `, // html body
                    })
                }
                catch (e) {
                    console.error(e)
                }
            }

        }
    }
    else res.send({
        success: false,
        error: "disabled"
    })
}

const checkPassResetLink = async (req, res) => {
    const collections = Connection.collections
    if (NodeCacheObj.get("forgotPass")) {
        const user = await collections.passResetCode.findOne({ username: req.body.username })
        if (user && await argon2.verify(user.code, req.body.code)) return res.send({ success: true })
        else return res.send({
            success: false,
            error: "invalid-code"
        })
    }
    else res.send({
        success: false,
        error: "disabled"
    })
}

const resetForgottenPassword = async (req, res) => {
    const collections = Connection.collections
    if (NodeCacheObj.get("forgotPass")) {
        const user = await collections.passResetCode.findOne({ username: req.body.username }, { projection: { code: 1, username: 1, _id: 0 } });
        if (user && await argon2.verify(user.code, req.body.code)) {
            await collections.users.updateOne({ username: user.username }, { $set: { password: await argon2.hash(req.body.password) } })
            await collections.passResetCode.deleteOne({ username: user.username })
            deletePermissions(user.username) // force user to re-login
            res.send({ success: true })
        }
        else return res.send({
            success: false,
            error: "invalid-code"
        })
    }
    else res.send({
        success: false,
        error: "disabled"
    })
}

module.exports = { disableStates, testConnection, forgotPassword, resetForgottenPassword, checkPassResetLink }