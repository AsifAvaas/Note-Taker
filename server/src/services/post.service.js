const Post = require('../models/Post.model');
const AppError = require('../utils/appError.util');

exports.createPost = async (userId, { title, content }) => {
  if (!title || !content) {
    throw new AppError('Title and content are required', 400);
  }

  const post = await Post.create({
    title: title.trim(),
    content,
    author: userId
  });

  return post;
};

exports.getAllPosts = async (page = 1, limit = 5) => {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, parseInt(limit, 10) || 5);
  const skip = (pageNum - 1) * limitNum;

  const [posts, totalPosts] = await Promise.all([
    Post.find()
      .populate('author', 'name email')
      .sort({ _id: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Post.estimatedDocumentCount()
  ]);

  return {
    posts,
    pagination: {
      total: totalPosts,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(totalPosts / limitNum) || 1
    }
  };
};
