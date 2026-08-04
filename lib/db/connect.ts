import mongoose from "mongoose";

// Ensure referenced schemas are registered before any populate() calls occur.
import "@/models/Vehicle";
import "@/models/Customer";
import "@/models/User";
import "@/models/Invoice";
import "@/models/Workshop";
import "@/models/ServiceTemplate";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    "MONGODB_URI is not set. Add it to your .env.local (see .env.example)."
  );
}

/**
 * Next.js dev mode hot-reloads modules, which would otherwise create a new
 * Mongoose connection on every file change. We cache the connection promise
 * on the global object to survive reloads, same pattern Vercel recommends.
 */
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var _mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global._mongooseCache ?? { conn: null, promise: null };
global._mongooseCache = cached;

export async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI as string, {
      bufferCommands: false,
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null;
    throw err;
  }

  return cached.conn;
}
