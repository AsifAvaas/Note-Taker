const noteService = require('../services/note.service');
const asyncHandler = require('../utils/asyncHandler.util');

exports.getMyNotes = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const result = await noteService.getUserNotes(req.user.id, page, limit);
  res.status(200).json({
    success: true,
    ...result
  });
});

exports.createNote = asyncHandler(async (req, res) => {
  const { title, content } = req.body;
  const note = await noteService.createNote(req.user.id, { title, content });
  res.status(201).json({
    success: true,
    message: 'Note created successfully',
    note
  });
});

exports.getAllNotesAdmin = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const result = await noteService.getAllNotesAdmin(page, limit);
  res.status(200).json({
    success: true,
    ...result
  });
});

exports.getIndexExecutionProof = asyncHandler(async (req, res) => {
  const proof = await noteService.getIndexExecutionProof(req.user.id);
  res.status(200).json({
    success: true,
    proof
  });
});

exports.getNoteById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const note = await noteService.getNoteById(id, req.user);
  res.status(200).json({
    success: true,
    note
  });
});

exports.updateNote = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, content } = req.body;
  const updatedNote = await noteService.updateNote(id, req.user.id, { title, content });
  res.status(200).json({
    success: true,
    message: 'Note updated successfully',
    note: updatedNote
  });
});

exports.deleteNote = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await noteService.deleteNote(id, req.user.id);
  res.status(200).json({
    success: true,
    message: 'Note deleted successfully'
  });
});
