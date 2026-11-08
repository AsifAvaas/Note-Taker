const AppError = require('../utils/appError.util');

exports.authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(
        new AppError(
          `Forbidden: role '${req.user?.role || 'Guest'}' is not authorized to access this resource`,
          403
        )
      );
    }
    next();
  };
};
