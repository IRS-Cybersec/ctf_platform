const errorHandler = (err, req, res) => {
    console.error(err)
    if (err.message) {
        switch (err.message) {
            case 'Permissions':
                res.code(403);
                return res.send({
                    success: false,
                    error: 'permissions'
                });
            case 'MissingToken':
                res.code(401);
                return res.send({
                    success: false,
                    error: 'missing-token'
                });
            case 'NotFound':
                res.code(400);
                return res.send({
                    success: false,
                    error: 'not-found'
                });
            case 'WrongPassword':
                res.code(401);
                return res.send({
                    success: false,
                    error: 'wrong-password'
                });
            case 'OutOfRange':
                res.code(400);
                return res.send({
                    success: false,
                    error: 'out-of-range'
                });
            case 'NotFound':
                res.code(401);
                return res.send({
                    success: false,
                    error: 'wrong-token'
                });
            case 'AdminHidden':
                res.code(401);
                return res.send({
                    success: false,
                    error: 'admin-hidden'
                });
        }
        if (err.message.includes('BadSignature') || err.message == 'BadToken') {
            res.code(401);
            return res.send({
                success: false,
                error: 'wrong-token'
            });

        }
    }
    if (err.name == 'MongoServerError') {
        switch (err.code) {
            case 121:
                res.code(400);
                return res.send({
                    success: false,
                    error: 'validation'
                });

        }
    }

    res.code(500);
    res.send({
        success: false,
        error: 'unknown'
    });
    
}

module.exports = {  errorHandler }