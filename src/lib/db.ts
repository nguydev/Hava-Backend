import mongoose from 'mongoose';

/** Read the Mongo connection string (supports either env var name). */
export function getMongoUri(): string {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI || '';
  if (!uri) {
    throw new Error('MONGODB_URI is not set. Add it to HVAC-backend/.env');
  }
  return uri;
}

export async function connectDb(): Promise<typeof mongoose> {
  mongoose.set('strictQuery', true);
  return mongoose.connect(getMongoUri());
}
