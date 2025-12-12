import app from './app.js';
import prisma from './config/db.js';
import { env } from './config/env.js';

const PORT = env.PORT;

const startServer = async () => {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`👉 http://localhost:${PORT}/health`);
    });

    // Graceful shutdown
    const shutdown = async () => {
      console.log('🛑 Shutting down server...');
      server.close(() => {
        console.log('Server closed');
      });
      await prisma.$disconnect();
      console.log('Database disconnected');
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
