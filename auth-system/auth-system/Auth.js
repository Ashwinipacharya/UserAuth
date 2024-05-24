const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

const auth = {
  verifyToken: (req, res, next) => {
    const authHeader = req.header('Authorization');
    if (!authHeader) return res.status(401).send({ message: 'Access Denied' });

    const token = authHeader.replace('Bearer ', '');
    if (!token) return res.status(401).send({ message: 'Access Denied' });

    try {
      const verified = jwt.verify(token, JWT_SECRET);
      req.user = verified;
      req.token = token;  // Add the token to the request object
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
