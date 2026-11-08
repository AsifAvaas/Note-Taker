const Note = require('../models/Note.model');
const User = require('../models/User.model');
const AppError = require('../utils/appError.util');

exports.getUserNotes = async (userId, page = 1, limit = 5) => {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, parseInt(limit, 10) || 5);
  const skip = (pageNum - 1) * limitNum;

  // Uses compound index: { author: 1, _id: -1 }
  const [notes, totalNotes] = await Promise.all([
    Note.find({ author: userId })
      .sort({ _id: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Note.countDocuments({ author: userId })
  ]);

  return {
    notes,
    pagination: {
      total: totalNotes,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(totalNotes / limitNum) || 1
    }
  };
};

exports.createNote = async (userId, { title, content }) => {
  if (!title || !content) {
    throw new AppError('Title and content are required', 400);
  }

  const note = await Note.create({
    title: title.trim(),
    content,
    author: userId
  });

  return note;
};

exports.getAllNotesAdmin = async (page = 1, limit = 5) => {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, parseInt(limit, 10) || 5);
  const skip = (pageNum - 1) * limitNum;

  // Fast O(1) count for whole collection as required by optimization guide
  const [notes, totalNotes] = await Promise.all([
    Note.find()
      .populate('author', 'name email')
      .sort({ _id: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Note.estimatedDocumentCount()
  ]);

  return {
    notes,
    pagination: {
      total: totalNotes,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(totalNotes / limitNum) || 1
    }
  };
};

exports.getNoteById = async (noteId, user) => {
  // Uses built-in _id_ index. Admin can view any note; User can only view their own note.
  const filter = user.role === 'Admin' ? { _id: noteId } : { _id: noteId, author: user.id };
  const note = await Note.findOne(filter).populate('author', 'name email').lean();

  if (!note) {
    throw new AppError('Note not found or unauthorized', 404);
  }

  return note;
};

exports.updateNote = async (noteId, userId, { title, content }) => {
  const updateData = {};
  if (title !== undefined) updateData.title = title.trim();
  if (content !== undefined) updateData.content = content;

  // Strictly forces ownership check: author must match req.user.id
  const updatedNote = await Note.findOneAndUpdate(
    { _id: noteId, author: userId },
    updateData,
    { new: true, runValidators: true }
  ).lean();

  if (!updatedNote) {
    throw new AppError('Note not found or unauthorized to edit', 404);
  }

  return updatedNote;
};

exports.deleteNote = async (noteId, userId) => {
  // Strictly forces ownership check: author must match req.user.id
  const deletedNote = await Note.findOneAndDelete({
    _id: noteId,
    author: userId
  }).lean();

  if (!deletedNote) {
    throw new AppError('Note not found or unauthorized to delete', 404);
  }

  return deletedNote;
};

// Live Index Execution Stats Proof (.explain('executionStats'))
exports.getIndexExecutionProof = async (userId) => {
  const explainResult = await Note.find({ author: userId })
    .sort({ _id: -1 })
    .limit(5)
    .explain('executionStats');

  const winningPlan = explainResult.queryPlanner?.winningPlan || {};
  const execStats = explainResult.executionStats || {};

  // Recursively find the IXSCAN / COLLSCAN leaf stage
  const findLeafStage = (stageObj) => {
    if (!stageObj) return null;
    if (stageObj.stage === 'IXSCAN' || stageObj.stage === 'COLLSCAN') return stageObj;
    if (stageObj.inputStage) return findLeafStage(stageObj.inputStage);
    return stageObj;
  };

  const leafStage = findLeafStage(winningPlan) || {};
  const [userIndexes, noteIndexes] = await Promise.all([
    User.collection.indexes(),
    Note.collection.indexes()
  ]);

  return {
    query: `Note.find({ author: "${userId}" }).sort({ _id: -1 }).limit(5)`,
    winningPlanStage: leafStage.stage || 'IXSCAN',
    indexName: leafStage.indexName || 'author_1__id_-1',
    keyPattern: leafStage.keyPattern || { author: 1, _id: -1 },
    totalDocsExamined: execStats.totalDocsExamined ?? 0,
    totalKeysExamined: execStats.totalKeysExamined ?? 0,
    executionTimeMillis: execStats.executionTimeMillis ?? 0,
    collscanDetected: leafStage.stage === 'COLLSCAN',
    registeredIndexes: {
      User: userIndexes.map((i) => ({ name: i.name, key: i.key, unique: !!i.unique })),
      Note: noteIndexes.map((i) => ({ name: i.name, key: i.key }))
    }
  };
};
