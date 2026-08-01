import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
    throw new Error("Please define the MONGODB_URI environment variable");
}

let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

export async function connectDb() {
    if (cached.conn) {
        return cached.conn;
    }

    if (!cached.promise) {
        const opts = {
            bufferCommands: false, // Disable buffering
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 30000 ,
        };

        cached.promise = mongoose.connect(MONGODB_URI, opts)
            .then(() => {
                console.log("Database connected successfully");
                return mongoose.connection;
            })
            .catch((err) => {
                console.error("Error connecting to database", err);
                throw err;
            });
    }

    try {
        cached.conn = await cached.promise;
        return cached.conn;
    } catch (e) {
        cached.promise = null;
        throw e;
    }
}