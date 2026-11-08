const authService = require('../services/auth.service');
const asyncHandler = require('../utils/asyncHandler.util');
const AppError = require('../utils/appError.util');

exports.register = asyncHandler(async (req, res) => {
  const { name, email, password, interests } = req.body;
  if (!name || !email || !password) {
    throw new AppError('Name, email, and password are required', 400);
  }

  const result = await authService.registerUser({ name, email, password, interests });
  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    ...result
  });
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new AppError('Email and password are required', 400);
  }

  const result = await authService.loginUser({ email, password });
  res.status(200).json({
    success: true,
    message: 'Logged in successfully',
    ...result
  });
});

exports.getMe = asyncHandler(async (req, res) => {
  const user = await authService.getMe(req.user.id);
  res.status(200).json({
    success: true,
    user
  });
});
