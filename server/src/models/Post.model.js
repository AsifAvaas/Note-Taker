const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
  },
  { timestamps: true }
);

// INDEX 4: Replaces { author: 1 }. Supports the $lookup equality match AND the inner _id sort for pagination!
postSchema.index({ author: 1, _id: -1 });

module.exports = mongoose.model('Post', postSchema);
