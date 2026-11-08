const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const noteRoutes = require('./note.routes');
const postRoutes = require('./post.routes');
const userRoutes = require('./user.routes');

router.use('/auth', authRoutes);
router.use('/notes', noteRoutes);
router.use('/posts', postRoutes);
router.use('/users', userRoutes);

module.exports = router;
