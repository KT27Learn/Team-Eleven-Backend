const jwt = require('jsonwebtoken');

//used to safeguard private routes by ensuring user is logged in through including user's JSON web token in the header
module.exports = function(req, res, next ) {
    const token = req.header('auth-token');
    if(!token) return res.status(401).send('Access Denied');

    try {

        const verified = jwt.verify(token, process.env.TOKEN_SECRET);
        req.user = verified;
    } catch {
        res.status(400).send('Invalid Token');
    }
}