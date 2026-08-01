const { MongoClient } = require("mongodb");
const fs = require("fs");
const net = require("net");
const dns = require("dns");

// Read URI from .env.local
const uri = fs.readFileSync(".env.local", "utf8")
  .split("\n")
  .find(line => line.startsWith("MONGODB_URI="))
  ?.split("=").slice(1).join("=").trim().replace(/\r$/, "");

if (!uri) {
  console.error("❌ MONGODB_URI not found in .env.local");
  process.exit(1);
}

console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("🔍 MongoDB Verbose Connection Diagnostic");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("URI (masked):", uri.replace(/:([^@]+)@/, ":****@"));
console.log();

// Step 1: Test DNS resolution of SRV record
const srvHost = "_mongodb._tcp." + uri.match(/mongodb\+srv:\/\/[^@]+@([^/?]+)/)?.[1];
console.log("1️⃣  Resolving SRV record:", srvHost);

dns.resolveSrv(srvHost, async (err, addresses) => {
  if (err) {
    console.error("   ❌ SRV DNS resolution FAILED:", err.message);
    console.error("   → Your cluster hostname is wrong or DNS is broken");
    process.exit(1);
  }

  console.log("   ✅ SRV resolved to", addresses.length, "node(s):");
  addresses.forEach(a => console.log(`      - ${a.name}:${a.port}`));
  console.log();

  // Step 2: Test TCP connectivity to first node
  const firstNode = addresses[0];
  console.log(`2️⃣  Testing TCP connectivity to ${firstNode.name}:${firstNode.port}...`);

  await new Promise(resolve => {
    const socket = new net.Socket();
    const timeout = 5000;

    socket.setTimeout(timeout);
    socket.on("connect", () => {
      console.log("   ✅ TCP connection SUCCESS — port 27017 is reachable!");
      socket.destroy();
      resolve(true);
    });
    socket.on("timeout", () => {
      console.error("   ❌ TCP connection TIMED OUT");
      console.error("   → Port 27017 is BLOCKED by a firewall or your ISP");
      console.error("   → Fix: Add your IP to Atlas Network Access, or use 0.0.0.0/0");
      socket.destroy();
      resolve(false);
    });
    socket.on("error", (e) => {
      console.error("   ❌ TCP connection ERROR:", e.message);
      socket.destroy();
      resolve(false);
    });
    socket.connect(firstNode.port, firstNode.name);
  });

  console.log();

  // Step 3: Try MongoDB connection with detailed logging
  console.log("3️⃣  Attempting MongoDB authentication...");
  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 15000,
    connectTimeoutMS: 10000,
    socketTimeoutMS: 10000,
    monitorCommands: true,
  });

  try {
    await client.connect();
    console.log("   ✅ Connected successfully!");

    const result = await client.db().command({ ping: 1 });
    console.log("   ✅ Ping result:", JSON.stringify(result));

    const adminDb = client.db().admin();
    const dbList = await adminDb.listDatabases();
    console.log("\n   📂 Databases found:");
    dbList.databases.forEach(db => console.log(`      - ${db.name} (${(db.sizeOnDisk / 1024).toFixed(1)} KB)`));

    await client.close();
    console.log("\n✅ ALL CHECKS PASSED — MongoDB is working correctly!\n");
  } catch (err) {
    console.error("   ❌ MongoDB connection FAILED:", err.message);
    console.error("\n📋 Error code:", err.code || "N/A");

    if (err.message.includes("Authentication failed") || err.code === 18) {
      console.error("\n🔑 CAUSE: Wrong username or password in MONGODB_URI");
      console.error("   → Go to Atlas → Database Access → Edit the user password");
      console.error("   → Update MONGODB_URI in .env.local with the new password");
    } else if (err.message.includes("timed out")) {
      console.error("\n🔥 CAUSE: Network/Firewall is blocking the connection");
      console.error("   → Go to Atlas → Network Access → Add IP: 0.0.0.0/0");
      console.error("   → Or your cluster may be PAUSED — go to Atlas and Resume it");
    } else if (err.message.includes("ENOTFOUND") || err.message.includes("getaddrinfo")) {
      console.error("\n🌐 CAUSE: Cluster hostname not found — may be wrong URI");
    }

    process.exit(1);
  }
});
