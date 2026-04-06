import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { auth } from "../src/middlewares/auth.middleware.js";

process.env.ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || "test-secret";

test("auth middleware sends error to next when token is missing", async () => {
  const req = { cookies: {}, header: () => null };
  let passedError = null;

  await auth(req, {}, (err) => {
    passedError = err;
  });

  assert.ok(passedError);
  assert.ok([401,500].includes(passedError.statusCode));
});

test("jwt signs token for unauthorized simulation", () => {
  const token = jwt.sign({ _id: "507f1f77bcf86cd799439011" }, process.env.ACCESS_TOKEN_SECRET);
  assert.ok(token);
});
