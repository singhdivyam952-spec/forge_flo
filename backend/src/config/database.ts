import dns from 'dns';
import mongoose from 'mongoose';
import { env, isTest } from './env';
import { logger } from './logger';

mongoose.set('strictQuery', true);

/** Some local DNS resolvers refuse SRV lookups needed by mongodb+srv:// */
if (env.MONGODB_URI.startsWith('mongodb+srv://')) {
  try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
  } catch {
    // ignore — keep system DNS if servers cannot be overridden
  }
}

const options: mongoose.ConnectOptions = {
  autoIndex: !isTest,
  maxPoolSize: 20,
  minPoolSize: 2,
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  family: 4,
};

let isConnected = false;

export async function connectDatabase(uri: string = env.MONGODB_URI): Promise<typeof mongoose> {
  if (isConnected) {
    return mongoose;
  }

  mongoose.connection.on('connected', () => {
    isConnected = true;
    logger.info(`MongoDB connected: ${maskUri(uri)}`);
  });

  mongoose.connection.on('error', (err) => {
    logger.error('MongoDB connection error', { error: err.message });
  });

  mongoose.connection.on('disconnected', () => {
    isConnected = false;
    logger.warn('MongoDB disconnected');
  });

  process.on('SIGINT', async () => {
    await disconnectDatabase();
    process.exit(0);
  });

  try {
    await mongoose.connect(uri, options);
    return mongoose;
  } catch (error) {
    logger.error('Failed to connect to MongoDB', { error: (error as Error).message });
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
    isConnected = false;
    logger.info('MongoDB connection closed');
  }
}

export function isDatabaseConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

function maskUri(uri: string): string {
  try {
    return uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@');
  } catch {
    return uri;
  }
}

export default mongoose;
