const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User.model');
const AppError = require('../utils/appError.util');

const generateToken = (userId, role) => {
  return jwt.sign({ id: userId, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

exports.registerUser = async ({ name, email, password, interests }) => {
  const normalizedEmail = email?.toLowerCase().trim();
  const existingUser = await User.findOne({ email: normalizedEmail }).lean();
  if (existingUser) {
    throw new AppError('User already exists with this email', 409);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  // Parse interests if passed as comma-separated string or array
  let parsedInterests = [];
  if (Array.isArray(interests)) {
    parsedInterests = interests.map((i) => i.trim().toLowerCase()).filter(Boolean);
  } else if (typeof interests === 'string') {
    parsedInterests = interests.split(',').map((i) => i.trim().toLowerCase()).filter(Boolean);
  }

  // Force role: 'User' on public registration as required by spec
  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    password: hashedPassword,
    role: 'User',
    interests: parsedInterests
  });

  const token = generateToken(user._id, user.role);

  return {
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      interests: user.interests
    }
  };
};

exports.loginUser = async ({ email, password }) => {
  const normalizedEmail = email?.toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail }).select('+password');
  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new AppError('Invalid email or password', 401);
  }

  const token = generateToken(user._id, user.role);

  return {
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      interests: user.interests
    }
  };
};

exports.getMe = async (userId) => {
  const user = await User.findById(userId).select('-password').lean();
  if (!user) {
    throw new AppError('User not found', 404);
  }
  return user;
};
