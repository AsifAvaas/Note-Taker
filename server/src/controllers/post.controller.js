const postService = require('../services/post.service');
const asyncHandler = require('../utils/asyncHandler.util');

exports.createPost = asyncHandler(async (req, res) => {
  const { title, content } = req.body;
  const post = await postService.createPost(req.user.id, { title, content });
  res.status(201).json({
    success: true,
    message: 'Post created successfully',
    post
  });
});

exports.getAllPosts = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const result = await postService.getAllPosts(page, limit);
  res.status(200).json({
    success: true,
    ...result
  });
});
