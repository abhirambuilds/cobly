import mongoose from 'mongoose';
import { config } from './index';

export const connectDatabase = async (): Promise<void> => {
  try {
    await mongoose.connect(config.mongodbUri);
    console.log(`[Database] Connected successfully to MongoDB`);
  } catch (error) {
    console.error(`[Database] Connection failed:`, error);
    process.exit(1); // Fail startup if DB is unreachable
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    console.log(`[Database] Disconnected successfully`);
  } catch (error) {
    console.error(`[Database] Disconnect failed:`, error);
  }
};
