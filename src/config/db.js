import mongoose from 'mongoose';
import config from './index.js';
import logger from './logger.js';

export async function connectDB() {
  try {
    await mongoose.connect(config.db.uri);
    logger.info('MongoDB connected successfully');
  } catch (error) {
    logger.error('MongoDB connection failed', { error: error.message });
    process.exit(1);
  }

  mongoose.connection.on('error', (error) => {
    logger.error('MongoDB connection error', { error: error.message });
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected');
  });
}

export async function disconnectDB() {
  await mongoose.disconnect();
  logger.info('MongoDB disconnected gracefully');
}
