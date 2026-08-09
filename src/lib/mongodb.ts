import mongoose from "mongoose";

// Pre-register all models to ensure Mongoose population never throws MissingSchemaError
import "../models/Product";
import "../models/Company";
import "../models/Category";
import "../models/Order";
import "../models/Shift";
import "../models/SiteSettings";
import "../models/User";

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache ?? { conn: null, promise: null };

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

async function dbConnect(): Promise<typeof mongoose> {
  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    throw new Error("Please define the MONGODB_URI environment variable in .env.local");
  }

  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      maxPoolSize: 1,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 30000,
      connectTimeoutMS: 5000,
    }).then((m) => m);
  } 

  cached.conn = await cached.promise;
  return cached.conn;
}

// Graceful shutdown — close DB connection on process termination
process.on("SIGINT", async () => {
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.close();
  }
  process.exit(0);
});

export default dbConnect;
