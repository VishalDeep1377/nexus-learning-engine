import path from "path";
import dotenv from "dotenv";
import express, { Request, Response, NextFunction } from "express";
import { getUserContext, getUserMCPContext, MCPContextRequest } from "./resources/userContext.js";

// Load local .env file first, then fall back to root .env.local if available
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), "../../.env.local") });

const app = express();
app.use(express.json());

const PORT = process.env.MCP_PORT ? parseInt(process.env.MCP_PORT) : 3001;

// ── Startup validation ────────────────────────────────────────────────────────

const MCP_SECRET = process.env.MCP_SERVER_SECRET || "dev_mcp_secret_key_12345";
if (!process.env.MCP_SERVER_SECRET) {
  console.warn("[mentor-context] WARNING: MCP_SERVER_SECRET not set in environment — using default dev secret key.");
}

// ── Security middleware ───────────────────────────────────────────────────────

/**
 * Validates the x-mcp-secret header against the configured secret.
 * Applied to all endpoints except /health.
 */
function validateSecret(req: Request, res: Response, next: NextFunction): void {
  const providedSecret = req.headers["x-mcp-secret"];
  if (!providedSecret || providedSecret !== MCP_SECRET) {
    res.status(401).json({
      error: "Unauthorized",
      message: "Missing or invalid x-mcp-secret header",
    });
    return;
  }
  next();
}

// ── Health check (public — no secret required) ────────────────────────────────

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", service: "mentor-context" });
});

// ── Legacy resource endpoint (secured) ───────────────────────────────────────
// Accepts: GET /resource?uri=resource://mentor/user_context/{userId}
// Returns: UserContextResult JSON (backward-compatible with mentor/route.ts)

app.get("/resource", validateSecret, async (req: Request, res: Response) => {
  const uri = req.query.uri as string;

  if (!uri) {
    res.status(400).json({ error: "Missing ?uri= parameter" });
    return;
  }

  const match = uri.match(/^resource:\/\/mentor\/user_context\/(.+)$/);
  if (!match) {
    res.status(400).json({ error: "Invalid resource URI format. Expected: resource://mentor/user_context/{userId}" });
    return;
  }

  const userId = match[1];
  const context = await getUserContext(userId);
  res.json(context);
});

// ── POST /context — full learner context for roadmap pipeline ─────────────────

app.post("/context", validateSecret, async (req: Request, res: Response) => {
  const { userId, careerParams, jobData, topSkills } = req.body as MCPContextRequest & { topSkills?: any[] };

  // Validate required fields
  if (!userId || typeof userId !== "string" || userId.trim() === "") {
    res.status(400).json({
      error: "Bad Request",
      message: "userId is required and must be a non-empty string",
    });
    return;
  }

  console.log(`[MCP] Context request started for userId: ${userId.slice(0, 8)}...`);

  const response = await getUserMCPContext({
    userId: userId.trim(),
    careerParams,
    jobData: Array.isArray(jobData) ? jobData : [],
    topSkills: Array.isArray(topSkills) ? topSkills : [],
  });

  console.log(`[MCP] Context returned — source: ${response.source}, available: ${response.available}`);
  res.json(response);
});

// ── Start ─────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`[mentor-context] Ready on port ${PORT}`);
  console.log(`[mentor-context] Health:   GET  http://localhost:${PORT}/health`);
  console.log(`[mentor-context] Resource: GET  http://localhost:${PORT}/resource?uri=resource://mentor/user_context/{userId}`);
  console.log(`[mentor-context] Context:  POST http://localhost:${PORT}/context`);
  console.log(`[mentor-context] All endpoints except /health require x-mcp-secret header`);
});
