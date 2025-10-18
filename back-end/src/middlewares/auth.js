const jwt = require('jsonwebtoken');

function authRequired(req, res, next) {
      const header = req.headers.authorization || '';
      const token = header.startsWith('Bearer ') ? header.slice(7) : null;
      if (!token) {
            return res.status(401).json({ message: 'Missing token', code: 'UNAUTHORIZED' });
      }
      try {
            const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
            req.user = { id: payload.sub };
            return next();
      } catch (e) {
            return res.status(401).json({ message: 'Invalid token', code: 'UNAUTHORIZED' });
      }
}

function socketAuth(socket, next) {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Missing token'));
      try {
            const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
            socket.user = { id: payload.sub };
            return next();
      } catch (e) {
            return next(new Error('Invalid token'));
      }
}

module.exports = { authRequired, socketAuth };


