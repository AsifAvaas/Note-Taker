const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User.model');
const Note = require('../models/Note.model');
const Post = require('../models/Post.model');
const AppError = require('../utils/appError.util');

// Scenario 1: Group by Interests (Optimized with $facet & IXSCAN)
exports.getUsersGroupedByInterests = async (page = 1, limit = 10) => {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, parseInt(limit, 10) || 10);
  const skip = (pageNum - 1) * limitNum;

  const result = await User.aggregate([
    // Stage 1: Uses the { interests: 1 } index to skip empty arrays/nulls
    { $match: { interests: { $gt: '' } } },
    { $unwind: '$interests' },
    // Stage 2: Grouping
    {
      $group: {
        _id: '$interests',
        count: { $sum: 1 },
        users: { $push: { _id: '$_id', name: '$name' } } // Excludes emails/passwords
      }
    },
    { $sort: { _id: 1 } },
    // Stage 3: Facet for single-call pagination
    {
      $facet: {
        metadata: [{ $count: 'totalGroups' }],
        data: [{ $skip: skip }, { $limit: limitNum }]
      }
    }
  ]);

  const facet = result[0] || { metadata: [], data: [] };
  const totalGroups = facet.metadata[0]?.totalGroups || 0;

  return {
    interests: facet.data,
    pagination: {
      total: totalGroups,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(totalGroups / limitNum) || 1
    }
  };
};

// Scenario 2: User Posts $lookup (with Inner Pagination & strict projection)
exports.getUserPostsViaLookup = async (userId, page = 1, limit = 5) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new mongoose.Error.CastError('ObjectId', userId, '_id');
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, parseInt(limit, 10) || 5);
  const skip = (pageNum - 1) * limitNum;

  const result = await User.aggregate([
    { $match: { _id: new mongoose.Types.ObjectId(userId) } },
    {
      $lookup: {
        from: 'posts',
        let: { userId: '$_id' },
        // Inner pipeline sorts and paginates using the Post compound index { author: 1, _id: -1 }
        pipeline: [
          { $match: { $expr: { $eq: ['$author', '$$userId'] } } },
          { $sort: { _id: -1 } },
          { $skip: skip },
          { $limit: limitNum }
        ],
        as: 'posts'
      }
    },
    // STRICT security projection: Never leak the password hash or private data
    {
      $project: {
        name: 1,
        email: 1,
        posts: 1
      }
    }
  ]);

  if (!result || result.length === 0) {
    throw new AppError('User not found', 404);
  }

  return {
    user: result[0],
    pagination: {
      page: pageNum,
      limit: limitNum
    }
  };
};

// Admin: List all users (Paginated)
exports.getAllUsers = async (page = 1, limit = 5) => {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, parseInt(limit, 10) || 5);
  const skip = (pageNum - 1) * limitNum;

  const [users, totalUsers] = await Promise.all([
    User.find()
      .select('-password')
      .sort({ _id: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    User.estimatedDocumentCount()
  ]);

  return {
    users,
    pagination: {
      total: totalUsers,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(totalUsers / limitNum) || 1
    }
  };
};

// Admin: Fetch single user profile
exports.getUserById = async (userId) => {
  const user = await User.findById(userId).select('-password').lean();
  if (!user) {
    throw new AppError('User not found', 404);
  }

  return user;
};

// Admin: Create user (can specify role)
exports.createUser = async ({ name, email, password, role, interests }) => {
  const normalizedEmail = email?.toLowerCase().trim();
  const existingUser = await User.findOne({ email: normalizedEmail }).lean();
  if (existingUser) {
    throw new AppError('User already exists with this email', 409);
  }

  const hashedPassword = await bcrypt.hash(password || 'Password123!', 10);

  let parsedInterests = [];
  if (Array.isArray(interests)) {
    parsedInterests = interests.map((i) => i.trim().toLowerCase()).filter(Boolean);
  } else if (typeof interests === 'string') {
    parsedInterests = interests.split(',').map((i) => i.trim().toLowerCase()).filter(Boolean);
  }

  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    password: hashedPassword,
    role: role === 'Admin' ? 'Admin' : 'User',
    interests: parsedInterests
  });

  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    interests: user.interests,
    createdAt: user.createdAt
  };
};

// Admin: Update user
exports.updateUser = async (userId, { name, email, role, interests, password }) => {
  const updateData = {};
  if (name) updateData.name = name.trim();
  if (email) updateData.email = email.toLowerCase().trim();
  if (role) updateData.role = role === 'Admin' ? 'Admin' : 'User';
  if (password) updateData.password = await bcrypt.hash(password, 10);
  if (interests !== undefined) {
    if (Array.isArray(interests)) {
      updateData.interests = interests.map((i) => i.trim().toLowerCase()).filter(Boolean);
    } else if (typeof interests === 'string') {
      updateData.interests = interests.split(',').map((i) => i.trim().toLowerCase()).filter(Boolean);
    }
  }

  const user = await User.findByIdAndUpdate(userId, updateData, {
    new: true,
    runValidators: true
  }).select('-password').lean();

  if (!user) {
    throw new AppError('User not found', 404);
  }

  return user;
};

// Admin: Cascade Delete User + Notes + Posts
exports.deleteUser = async (userId) => {
  // Extremely efficient thanks to prefix indexes on { author }
  const [deletedUser, deletedNotes, deletedPosts] = await Promise.all([
    User.findByIdAndDelete(userId).lean(),
    Note.deleteMany({ author: userId }),
    Post.deleteMany({ author: userId })
  ]);

  if (!deletedUser) {
    throw new AppError('User not found', 404);
  }

  return {
    user: deletedUser,
    notesDeleted: deletedNotes.deletedCount,
    postsDeleted: deletedPosts.deletedCount
  };
};
