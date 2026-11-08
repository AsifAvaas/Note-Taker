require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

// Connect to Database and start server
const startServer = async () => {
  try {
    await connectDB();

    const server = app.listen(PORT, () => {
      console.log(`[Server] Running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
      console.log(`[Server] Health check available at http://localhost:${PORT}/health`);
      console.log(`[Server] API v1 base URL: http://localhost:${PORT}/api/v1`);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err) => {
      console.error(`[Unhandled Rejection]: ${err.message}`);
      server.close(() => process.exit(1));
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (err) => {
      console.error(`[Uncaught Exception]: ${err.message}`);
      process.exit(1);
    });
  } catch (error) {
    console.error(`[Fatal Server Startup Error]: ${error.message}`);
    process.exit(1);
  }
};

startServer();
