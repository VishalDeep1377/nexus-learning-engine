const { MongoClient } = require("mongodb");

const uri = process.env.MONGODB_URI || require("fs").readFileSync(".env.local", "utf8")
  .split("\n")
  .find(line => line.startsWith("MONGODB_URI="))
  ?.split("=").slice(1).join("=").trim();

console.log("Testing connection to:", uri?.replace(/:([^@]+)@/, ":****@"));
console.log("Connecting...");

const client = new MongoClient(uri, { serverSelectionTimeoutMS: 10000 });

client.connect()
  .then(() => {
    console.log("\n✅ SUCCESS! MongoDB connected!\n");
    return client.db().command({ ping: 1 });
  })
  .then(() => {
    console.log("✅ Ping successful - Database is fully operational!");
    client.close();
  })
  .catch(err => {
    console.error("\n❌ FAILED to connect:");
    console.error("Error:", err.message);
    console.error("\nPossible reasons:");
    console.error("  1. Cluster is PAUSED (go to Atlas and click Resume)");
    console.error("  2. Wrong password in MONGODB_URI");
    console.error("  3. Wrong cluster hostname");
    process.exit(1);
  });
