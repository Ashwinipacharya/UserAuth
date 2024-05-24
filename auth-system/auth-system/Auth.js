const jwt = require('jsonwebtoken');
const User = require('./User');
const { JWT_SECRET } = process.env;

const auth = {
  verifyToken: (req, res, next) => {
    const token = req.header('Authorization').replace('Bearer ', '');
    if (!token) return res.status(401).send({ message: 'Access Denied' });

    try {
      const verified = jwt.verify(token, JWT_SECRET);
      req.user = verified;
      next();
    } catch (error) {
      res.status(400).send({ message: 'Invalid Token' });
    }
  },

  isAdmin: (req, res, next) => {
    if (req.user.role !== 'admin') {
      return res.status(403).send({ message: 'Access Denied' });
    }
    next();
  }
};

module.exports = auth;
