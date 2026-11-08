const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorizeRoles } = require('../middlewares/role.middleware');

// Scenario 1: Group by interests (Authenticated Users & Admins)
// Supporting both '/aggregations/interests' and '/aggregations/by-interest'
router.get(
  '/aggregations/interests',
  authenticate,
  userController.getUsersGroupedByInterests
);
router.get(
  '/aggregations/by-interest',
  authenticate,
  userController.getUsersGroupedByInterests
);

// Scenario 2: Public lookup for user & their posts
router.get('/:id/posts', userController.getUserPostsViaLookup);

// Admin-only User Management CRUD
router.use(authenticate, authorizeRoles('Admin'));

router.get('/', userController.getAllUsers);
router.post('/', userController.createUser);
router.get('/:id', userController.getUserById);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

module.exports = router;
