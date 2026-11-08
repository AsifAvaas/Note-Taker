const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
  },
  { timestamps: true }
);

// INDEX 3: Compound index for listing a user's own notes paginated
noteSchema.index({ author: 1, _id: -1 });

module.exports = mongoose.model('Note', noteSchema);
