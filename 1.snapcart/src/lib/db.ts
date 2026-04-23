import mongoose from "mongoose";

const MONGODB_URL = process.env.MONGODB_URL;

if (!MONGODB_URL) {
  throw new Error("Please define MONGODB_URL in .env");
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongoose: MongooseCache | undefined;
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectDb = async (): Promise<typeof mongoose> => {
  if (cached!.conn) {
    return cached!.conn;
  }

  if (!cached!.promise) {
    cached!.promise = mongoose.connect(MONGODB_URL, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000,
    });
  }

  try {
    cached!.conn = await cached!.promise;
    console.log("MongoDB Connected");
  } catch (error) {
    cached!.promise = null;
    console.error("MongoDB Connection Error:", error);
    throw error;
  }

  return cached!.conn;
};

export default connectDb;
