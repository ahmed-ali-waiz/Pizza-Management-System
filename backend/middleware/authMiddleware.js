import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import asyncHandler from './asyncHandler.js';

export const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production');
      req.user = await User.findById(decoded.userId).select('-password');
      next();
    } catch (error) {
      res.status(401);
      throw new Error('Not authorized, token failed');
    }
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token');
  }
});

export const admin = (req, res, next) => {
  if (req.user && req.user.role === 'Admin') {
    next();
  } else {
    res.status(403);
    throw new Error('Not authorized as an admin');
  }
};

export const staff = (req, res, next) => {
  if (req.user && ['Admin', 'BranchManager', 'Staff'].includes(req.user.role)) {
    next();
  } else {
    res.status(403);
    throw new Error('Not authorized - staff access required');
  }
};

export const branchManager = (req, res, next) => {
  if (req.user && ['Admin', 'BranchManager'].includes(req.user.role)) {
    next();
  } else {
    res.status(403);
    throw new Error('Not authorized - branch manager access required');
  }
};
