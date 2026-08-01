const { loadEnvConfig } = require('@next/env');
const mongoose = require('mongoose');

// Load environment variables exactly like Next.js does
loadEnvConfig(process.cwd());
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.log("❌ MONGODB_URI is not defined in .env.local!");
  process.exit(1);
}

console.log("Attempting to connect to MongoDB...");
mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 })
  .then(() => {
    console.log("✅ SUCCESSFULLY CONNECTED TO MONGODB!");
    process.exit(0);
  })
  .catch((err) => {
    console.log("❌ FAILED TO CONNECT TO MONGODB.");
    console.log("\nError Message:", err.message);
    if (err.message.includes("whitelist") || err.message.includes("network")) {
      console.log("\n⚠️ FIX REQUIRED: Your IP address is NOT whitelisted on MongoDB Atlas.");
      console.log("1. Go to https://account.mongodb.com/");
      console.log("2. Click Network Access > Add IP Address");
      console.log("3. Click 'Allow Access from Anywhere' (0.0.0.0/0)");
      console.log("4. Click Confirm.");
    }
    process.exit(1);
  });
