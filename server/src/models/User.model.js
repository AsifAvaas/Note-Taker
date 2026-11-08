const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ['User', 'Admin'], default: 'User' },
    interests: [{ type: String, trim: true, lowercase: true }]
  },
  { timestamps: true }
);

// INDEX 1: Supports authentication and uniqueness
userSchema.index({ email: 1 }, { unique: true });

// INDEX 2: Multikey index supporting Scenario 1 (Grouping by interests)
userSchema.index({ interests: 1 });

module.exports = mongoose.model('User', userSchema);
