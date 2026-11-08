const express = require('express');
const router = express.Router();
const noteController = require('../controllers/note.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorizeRoles } = require('../middlewares/role.middleware');

// All note routes require authentication
router.use(authenticate);

// Admin-only route: View everyone's notes paginated (MUST come before /:id)
router.get('/admin/all', authorizeRoles('Admin'), noteController.getAllNotesAdmin);

// Live MongoDB .explain('executionStats') Index Proof (MUST come before /:id)
router.get('/verify-indexes', noteController.getIndexExecutionProof);

// User & Admin routes for personal notes
router.get('/', noteController.getMyNotes);
router.post('/', noteController.createNote);

// Fetch a specific note (supported by _id_ index; User sees own, Admin sees any)
router.get('/:id', noteController.getNoteById);

// Strict owner-only routes for editing/deleting notes
router.put('/:id', noteController.updateNote);
router.delete('/:id', noteController.deleteNote);

module.exports = router;
