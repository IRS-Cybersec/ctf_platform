const unknownEndpoint = (req, res) => {
    res.status(404).send({ error: "unknown endpoint" })
}

const errorHandler = (err, req, res, next) => {

    if (res.headersSent) {
        return next(err)
    }

    if (err.message) {
        switch (err.message) {
            case 'Permissions':
                res.status(403);
                return res.send({
                    success: false,
                    error: 'permissions'
                });
            case 'MissingToken':
                res.status(401);
                return res.send({
                    success: false,
                    error: 'missing-token'
                });
            case 'NotFound':
                res.status(400);
                return res.send({
                    success: false,
                    error: 'not-found'
                });
            case 'WrongPassword':
                res.status(401);
                return res.send({
                    success: false,
                    error: 'wrong-password'
                });
            case 'OutOfRange':
                res.status(400);
                return res.send({
                    success: false,
                    error: 'out-of-range'
                });
        }
        if (err.message.includes('BadSignature') || err.message == 'BadToken') {
            res.status(401);
            return res.send({
                success: false,
                error: 'wrong-token'
            });

        }
    }
    if (err.name == 'MongoError') {
        switch (err.code) {
            case 121:
                res.status(400);
                return res.send({
                    success: false,
                    error: 'validation'
                });

        }
    }

    res.status(500);
    res.send({
        success: false,
        error: 'unknown'
    });
    console.error(err);
}

module.exports = { unknownEndpoint, errorHandler }