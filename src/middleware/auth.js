const jwt = require('jsonwebtoken');
const User = require('../models/user');

const auth = async (request, respond, next) => {
    try {
        const token = request.header('Authorization').replace('Bearer ', '');
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        const user = await User.findOne({ _id: decoded._id, 'tokens.token': token });

        if (!user) {
            throw new Error();
        }

        request.token = token;
        request.user = user;
        next();
    } catch (error) {
        respond.status(401).send({ error: 'You are unauthorized!' });
    }
};

module.exports = auth;
