const dns = require('dns');

dns.resolveSrv('_mongodb._tcp.cluster0.sbp2zi2.mongodb.net', (err, addresses) => {
  if (err) {
    console.error("❌ SRV Lookup Failed:", err);
  } else {
    console.log("✅ SRV Lookup Succeeded:", addresses);
  }
});

dns.resolveTxt('cluster0.sbp2zi2.mongodb.net', (err, addresses) => {
  if (err) {
    console.error("❌ TXT Lookup Failed:", err);
  } else {
    console.log("✅ TXT Lookup Succeeded:", addresses);
  }
});
