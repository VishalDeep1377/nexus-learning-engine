/**
 * mcp-servers/mentor-context/test.ts
 *
 * Integration tests for the MCP Context Server.
 * Covers both happy-path and negative/failure-path scenarios.
 *
 * Usage: npm run test
 * Requires: MCP server running on http://localhost:3001
 */

import path from "path";
import dotenv from "dotenv";

dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), "../../.env.local") });

const BASE_URL = `http://localhost:${process.env.MCP_PORT ?? 3001}`;
const VALID_SECRET = process.env.MCP_SERVER_SECRET || "dev_mcp_secret_key_12345";
const REAL_USER_ID = process.env.TEST_USER_ID ?? "";
const FAKE_USER_ID = "507f1f77bcf86cd799439011";

let passed = 0;
let failed = 0;

async function test(name: string, fn: () => Promise<void>): Promise<void> {
  try {
    await fn();
    console.log(`  ✅ PASS: ${name}`);
    passed++;
  } catch (err: any) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(`         ${err.message}`);
    failed++;
  }
}

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`Assertion failed: ${message}`);
}

async function fetchJSON(
  path: string,
  options: RequestInit = {}
): Promise<{ status: number; body: any }> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });
  let body: any;
  try {
    body = await res.json();
  } catch {
    body = null;
  }
  return { status: res.status, body };
}

async function runAllTests() {
  console.log("\n[test] MCP Context Server Integration Tests");
  console.log(`[test] Target: ${BASE_URL}`);
  console.log(`[test] Secret configured: ${VALID_SECRET.length > 0 ? "YES" : "NO"}`);
  if (REAL_USER_ID) console.log(`[test] Real userId: ${REAL_USER_ID.slice(0, 8)}...`);
  console.log("");

  // 1. Health check
  await test("GET /health returns { status: 'ok', service: 'mentor-context' }", async () => {
    const { status, body } = await fetchJSON("/health");
    assert(status === 200, `Expected 200, got ${status}`);
    assert(body?.status === "ok", `Expected status 'ok', got '${body?.status}'`);
    assert(body?.service === "mentor-context", `Expected service 'mentor-context', got '${body?.service}'`);
  });

  // 2. Security — /resource
  await test("GET /resource without x-mcp-secret returns 401", async () => {
    const { status } = await fetchJSON("/resource?uri=resource://mentor/user_context/anything");
    assert(status === 401, `Expected 401, got ${status}`);
  });

  await test("GET /resource with wrong secret returns 401", async () => {
    const { status } = await fetchJSON("/resource?uri=resource://mentor/user_context/anything", {
      headers: { "x-mcp-secret": "definitely-wrong-secret" },
    });
    assert(status === 401, `Expected 401, got ${status}`);
  });

  // 3. Security — /context
  await test("POST /context without x-mcp-secret returns 401", async () => {
    const { status } = await fetchJSON("/context", {
      method: "POST",
      body: JSON.stringify({ userId: FAKE_USER_ID }),
    });
    assert(status === 401, `Expected 401, got ${status}`);
  });

  await test("POST /context with wrong secret returns 401", async () => {
    const { status } = await fetchJSON("/context", {
      method: "POST",
      headers: { "x-mcp-secret": "wrong-secret" },
      body: JSON.stringify({ userId: FAKE_USER_ID }),
    });
    assert(status === 401, `Expected 401, got ${status}`);
  });

  // 4. Validation — /context
  await test("POST /context with missing userId returns 400", async () => {
    const { status } = await fetchJSON("/context", {
      method: "POST",
      headers: { "x-mcp-secret": VALID_SECRET },
      body: JSON.stringify({}),
    });
    assert(status === 400, `Expected 400, got ${status}`);
  });

  await test("POST /context with empty string userId returns 400", async () => {
    const { status } = await fetchJSON("/context", {
      method: "POST",
      headers: { "x-mcp-secret": VALID_SECRET },
      body: JSON.stringify({ userId: "   " }),
    });
    assert(status === 400, `Expected 400, got ${status}`);
  });

  // 5. Non-existent userId returns safe empty context
  await test("POST /context with non-existent userId returns safe empty context (not 500)", async () => {
    const { status, body } = await fetchJSON("/context", {
      method: "POST",
      headers: { "x-mcp-secret": VALID_SECRET },
      body: JSON.stringify({
        userId: FAKE_USER_ID,
        careerParams: { skill: "Python", experience: "Beginner", learningPreference: "Hands-on", expectedOutcome: "Job" },
        jobData: [],
        topSkills: [],
      }),
    });
    assert(status === 200, `Expected 200, got ${status}`);
    assert(body?.source === "mcp", `Expected source 'mcp', got '${body?.source}'`);
    assert(body?.available === true, `Expected available: true, got ${body?.available}`);
    assert(body?.contextVersion === "1.0", `Expected contextVersion '1.0'`);
    assert(typeof body?.generatedAt === "string", "Expected generatedAt string");
    assert(typeof body?.context === "object", "Expected context object");
  });

  // 6. Empty job data
  await test("POST /context with empty jobData returns context without jobMarket", async () => {
    const { status, body } = await fetchJSON("/context", {
      method: "POST",
      headers: { "x-mcp-secret": VALID_SECRET },
      body: JSON.stringify({
        userId: FAKE_USER_ID,
        careerParams: { skill: "React", experience: "Intermediate", learningPreference: "Self Learning", expectedOutcome: "Skill Enhancement" },
        jobData: [],
        topSkills: [],
      }),
    });
    assert(status === 200, `Expected 200, got ${status}`);
    assert(body?.context?.jobMarket === undefined || body?.context?.jobMarket === null,
      "Expected jobMarket to be absent when no jobData provided");
  });

  // 7. Job data with topSkills
  await test("POST /context with job data returns jobMarket context", async () => {
    const { status, body } = await fetchJSON("/context", {
      method: "POST",
      headers: { "x-mcp-secret": VALID_SECRET },
      body: JSON.stringify({
        userId: FAKE_USER_ID,
        careerParams: { skill: "Python", experience: "Beginner", learningPreference: "Hands-on Projects", expectedOutcome: "Technical Interview" },
        jobData: [
          { title: "Python Developer", company: "TechCorp", skills: ["Python", "FastAPI"] },
          { title: "Backend Engineer", company: "StartupXYZ", skills: ["Python", "Docker"] },
        ],
        topSkills: [
          { skill: "Python", frequency: 2 },
          { skill: "FastAPI", frequency: 1 },
          { skill: "Docker", frequency: 1 },
        ],
      }),
    });
    assert(status === 200, `Expected 200, got ${status}`);
    assert(body?.context?.jobMarket?.jobCount === 2, `Expected jobCount 2, got ${body?.context?.jobMarket?.jobCount}`);
  });

  // 8. Legacy /resource endpoint
  await test("GET /resource with valid secret returns safe object", async () => {
    const uri = encodeURIComponent(`resource://mentor/user_context/${FAKE_USER_ID}`);
    const { status, body } = await fetchJSON(`/resource?uri=${uri}`, {
      headers: { "x-mcp-secret": VALID_SECRET },
    });
    assert(status === 200, `Expected 200, got ${status}`);
    assert(body?.userId === FAKE_USER_ID, "Expected userId in response");
  });

  // Summary
  console.log(`\n[test] Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    process.exit(1);
  } else {
    console.log("[test] All tests passed ✅\n");
  }
}

runAllTests().catch(err => {
  console.error("Test suite runner error:", err);
  process.exit(1);
});
