const jwt = require('jsonwebtoken');
const User = require('../models/User.model');
const AppError = require('../utils/appError.util');

exports.authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new AppError('No token provided. Please log in to gain access.', 401));
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Validates user still exists and role is fresh (Uses built-in _id_ index, <1ms)
    const currentUser = await User.findById(decoded.id).select('_id role').lean();
    if (!currentUser) {
      return next(new AppError('The user belonging to this token no longer exists.', 401));
    }

    req.user = { id: currentUser._id.toString(), role: currentUser.role };
    next();
  } catch (error) {
    return next(new AppError('Invalid or expired authentication token', 401));
  }
};
