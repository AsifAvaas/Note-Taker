const userService = require('../services/user.service');
const asyncHandler = require('../utils/asyncHandler.util');
const AppError = require('../utils/appError.util');

// Scenario 1: Aggregation interests
exports.getUsersGroupedByInterests = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const result = await userService.getUsersGroupedByInterests(page, limit);
  res.status(200).json({
    success: true,
    ...result
  });
});

// Scenario 2: Aggregation lookup for user's posts
exports.getUserPostsViaLookup = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { page, limit } = req.query;
  const result = await userService.getUserPostsViaLookup(id, page, limit);
  res.status(200).json({
    success: true,
    ...result
  });
});

// Admin: Get all users paginated
exports.getAllUsers = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const result = await userService.getAllUsers(page, limit);
  res.status(200).json({
    success: true,
    ...result
  });
});

// Admin: Get user by ID
exports.getUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = await userService.getUserById(id);
  res.status(200).json({
    success: true,
    user
  });
});

// Admin: Create user
exports.createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, interests } = req.body;
  if (!name || !email) {
    throw new AppError('Name and email are required', 400);
  }

  const user = await userService.createUser({ name, email, password, role, interests });
  res.status(201).json({
    success: true,
    message: 'User created successfully',
    user
  });
});

// Admin: Update user
exports.updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = await userService.updateUser(id, req.body);
  res.status(200).json({
    success: true,
    message: 'User updated successfully',
    user
  });
});

// Admin: Delete user (Cascade delete)
exports.deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await userService.deleteUser(id);
  res.status(200).json({
    success: true,
    message: 'User and all associated notes/posts deleted successfully',
    ...result
  });
});
