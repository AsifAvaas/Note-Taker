const app = require('../src/app');
const connectDB = require('../src/config/db');

// Vercel Serverless Function entry point
module.exports = async (req, res) => {
  try {
    // Ensure MongoDB connection is established / reused before delegating to Express
    await connectDB();
    return app(req, res);
  } catch (error) {
    console.error('[Vercel Serverless Error]:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to establish database connection in serverless environment',
      error: error.message
    });
  }
};
