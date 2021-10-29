const Connection = require('./../utils/mongoDB.js')
const { deletePermissions, setPermissions, signToken } = require('./../utils/permissionUtils.js')
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

const adminVerifyEmail = async (req, res) => {
    if (req.locals.perms < 2) throw new Error('Permissions');
    if (!Array.isArray(req.body.users)) throw new Error('Validation');
    const collections = Connection.collections
    await collections.users.updateMany({ username: { $in: req.body.users } }, { $unset: { code: 0, codeTimestamp: 0 } })
    return res.send({ success: true })
}


const adminUnVerifyEmail = async (req, res) => {
    if (req.locals.perms < 2) throw new Error('Permissions');
    if (!Array.isArray(req.body.users)) throw new Error('Validation');
    const collections = Connection.collections
    await collections.users.find({ username: { $in: req.body.users } }).forEach(async (doc) => {
        const code = crypto.randomBytes(32).toString('hex')
        const link = NodeCacheObj.get("websiteLink") + "/verify/" + doc.username + "/" + code
        await collections.users.updateOne({ username: doc.username }, { $set: { code: await argon2.hash(code), codeTimestamp: new Date() } })
        const NodemailerT = NodeCacheObj.get('NodemailerT')
        await NodemailerT.sendMail({
            from: '"' + NodeCacheObj.get("emailSender") + '"' + ' <' + NodeCacheObj.get("emailSenderAddr") + '>', // sender address
            to: doc.email,
            subject: "Email Verification for Sieberrsec CTF Platform", // Subject line
            text: "Dear " + doc.username + ",\n\n  Please verify your email here: \n" + link + "\n\n  If you did not request this email, you can safely ignore this email. You will be able to login immediately after verifying your email.", // plain text body
            html: `
            Dear ${doc.username},<br><br>  Please verify your email by clicking <a href='${link}'>here</a>.
            <br><br>
            If you did not request this email, you can safely ignore this email. You will be able to login immediately after verifying your email.
            `, // html body
        })
    })

    return res.send({ success: true })
}

const verifyEmail = async (req, res) => {
    if (NodeCacheObj.get("emailVerify")) {
        const collections = Connection.collections
        const user = await collections.users.findOne({ username: req.body.username });
        if (user) {
            if ("code" in user) { // successfully verified, let user login immediately
                if (await argon2.verify(user.code, req.body.code)) {
                    await collections.users.updateOne({ username: user.username }, { $unset: { code: 0, codeTimestamp: 0 } })
                    setPermissions(user.username, user.type)
                    res.send({
                        success: true,
                        permissions: user.type,
                        token: signToken(user.username)
                    });
                }
                else return res.send({
                    success: false,
                    error: "invalid-code"
                })

            }
            else res.send({ success: false, error: "already-verified" })

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



const resendVerifyEmail = async (req, res) => {
    if (NodeCacheObj.get("emailVerify")) {
        try {
            const collections = Connection.collections
            const user = await collections.users.findOne({ email: req.body.email });
            if (user && "code" in user) {
                if (new Date() - user.codeTimestamp > NodeCacheObj.get("emailCooldown") * 1000) {
                    // regenerate code and re-hash
                    const code = crypto.randomBytes(32).toString('hex')
                    const link = NodeCacheObj.get("websiteLink") + "/verify/" + user.username + "/" + code
                    await collections.users.updateOne({ email: user.email }, { $set: { codeTimestamp: new Date(), code: await argon2.hash(code) } })
                    const NodemailerT = NodeCacheObj.get('NodemailerT')
                    await NodemailerT.sendMail({
                        from: '"' + NodeCacheObj.get("emailSender") + '"' + ' <' + NodeCacheObj.get("emailSenderAddr") + '>', // sender address
                        to: user.email,
                        subject: "Email Verification for Sieberrsec CTF Platform", // Subject line
                        text: "Dear " + user.username + ",\n\n  Please verify your email here: \n" + link + "\n\n  If you did not request this email, you can safely ignore this email. You will be able to login immediately after verifying your email.", // plain text body
                        html: `
                        Dear ${user.username},<br><br>  Please verify your email by clicking <a href='${link}'>here</a>.
                        <br><br>
                        If you did not request this email, you can safely ignore this email. You will be able to login immediately after verifying your email.
                        `, // html body
                    })
                    res.send({ success: true })
                }
                else res.send({ success: false, error: "too-recent", waitTime: dayjs().add((NodeCacheObj.get("emailCooldown") * 1000) - (new Date() - user.codeTimestamp)).toNow(true) })

            }
            else res.send({ success: false, error: "already-verified" })
        }
        catch (e) {
            console.error(e)
        }

    }
    else res.send({
        success: false,
        error: "disabled"
    })
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
        res.send({ success: true }) // send request first so that they can't check if an email exists
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

                    const response = await NodemailerT.sendMail({
                        from: '"' + NodeCacheObj.get("emailSender") + '"' + ' <' + NodeCacheObj.get("emailSenderAddr") + '>', // sender address
                        to: user.email,
                        subject: "Password Reset Request for Sieberrsec CTF Platform", // Subject line
                        text: "Dear " + user.username + ",\n\n  Someone has requested a password reset for your Sieberrsec CTF Platform account. Your password reset link is: \n" + link + "\n\n The password link will expire in " + timeLeft + ". If you did not request this email, you can safely ignore this email.", // plain text body
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

module.exports = { adminUnVerifyEmail, adminVerifyEmail, disableStates, resendVerifyEmail, testConnection, forgotPassword, resetForgottenPassword, checkPassResetLink, verifyEmail }