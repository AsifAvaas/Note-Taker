const express = require('express');
const router = express.Router();
const postController = require('../controllers/post.controller');
const { authenticate } = require('../middlewares/auth.middleware');

router.get('/', postController.getAllPosts);
router.post('/', authenticate, postController.createPost);

module.exports = router;
