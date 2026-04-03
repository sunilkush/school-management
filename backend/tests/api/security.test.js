import fs from "fs";
import request from "supertest";
import { app } from "../../src/app.js";
import { connectTestDB, clearTestDB, closeTestDB } from "../helpers/testSetup.js";

const toPath = (raw) =>
  raw
    .replace(/:([a-zA-Z_][a-zA-Z0-9_]*)/g, "507f1f77bcf86cd799439011")
    .replace(/\/$/, "");

describe("Security - unauthenticated routes", () => {
  const routes = [];

  beforeAll(async () => {
    await connectTestDB();
    const content = fs.readFileSync("API_CATALOG.md", "utf8");
    const lines = content.split("\n").filter((line) => line.startsWith("- `"));

    for (const line of lines) {
      const m = line.match(/- `([A-Z]+)\s+([^`]+)`/);
      if (!m) continue;
      const method = m[1];
      const path = m[2];
      if (!path.startsWith("/api/v1")) continue;
      if (path.includes("/auth") || path.includes("/login") || path.includes("/register") || path.includes("/forgot-password") || path.includes("/reset-password") || path.includes("/verify-email") || path.includes("/resend-verification")) {
        continue;
      }
      routes.push({ method, path: toPath(path) });
    }
  });

  afterAll(async () => closeTestDB());
  beforeEach(async () => clearTestDB());

  test("all protected endpoints should not return 500", async () => {
    for (const route of routes) {
      const req = request(app)[route.method.toLowerCase()](route.path);
      const res = await req.send({});
      expect(res.status).not.toBeGreaterThanOrEqual(500);
      expect([401, 403, 404, 400, 405]).toContain(res.status);
    }
  });

  test("POST /api/v1/attempt/submit without token -> 401 or 403", async () => {
    const res = await request(app)
      .post("/api/v1/attempt/submit")
      .send({ attemptId: "507f1f77bcf86cd799439011", answers: [] });

    expect([401, 403]).toContain(res.status);
  });
});
