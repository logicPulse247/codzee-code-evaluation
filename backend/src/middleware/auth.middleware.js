import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/user.model.js';

export const requireAuth = async (req, res, next) => {
  try {
    let token = req.cookies?.token;

    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        status: 'error',
        code: 'UNAUTHORIZED',
        message: 'Authentication required. No session token provided.'
      });
    }

    const decoded = jwt.verify(token, env.JWT_SECRET);
    
    // Attempt to locate user in DB if DB is active, or use token payload
    let user = null;
    try {
      user = await User.findById(decoded.userId).select('-passwordHash');
    } catch (dbErr) {
      // In case DB query fails or fallback mode
    }

    if (!user) {
      // Fallback object from token decoded data if DB user record check fails
      user = { _id: decoded.userId, id: decoded.userId, email: decoded.email, name: decoded.name };
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: 'error',
        code: 'SESSION_EXPIRED',
        message: 'Session expired. Please log in again.'
      });
    }

    return res.status(401).json({
      status: 'error',
      code: 'INVALID_SESSION',
      message: 'Invalid session token. Please log in again.'
    });
  }
};
