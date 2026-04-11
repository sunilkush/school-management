import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import  { auth, enforceApiAuthByDefault } from "../src/middlewares/auth.middleware.js";

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
test("enforceApiAuthByDefault allows unauthenticated login route", async () => {
  const req = { method: "POST", path: "/user/login", cookies: {}, header: () => null };
  let nextCalled = false;
  let passedError = null;

  await enforceApiAuthByDefault(req, {}, (err) => {
    nextCalled = true;
    passedError = err ?? null;
  });

  assert.equal(nextCalled, true);
  assert.equal(passedError, null);
});

test("enforceApiAuthByDefault allows unauthenticated refresh-token route", async () => {
  const req = { method: "POST", path: "/user/refresh-token", cookies: {}, header: () => null };
  let nextCalled = false;
  let passedError = null;

  await enforceApiAuthByDefault(req, {}, (err) => {
    nextCalled = true;
    passedError = err ?? null;
  });

  assert.equal(nextCalled, true);
  assert.equal(passedError, null);
});