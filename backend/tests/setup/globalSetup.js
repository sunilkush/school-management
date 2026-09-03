import { MongoMemoryReplSet } from "mongodb-memory-server";

/**
 * Starts ONE in-memory MongoDB for the whole test run.
 *
 * Every test file used to start its own replica set. That was fine at five suites and became a
 * real problem at twenty-six: the run spent most of its thirteen minutes starting and stopping
 * mongod processes, and often enough one of them lost the race to come up inside the timeout —
 * so a random, always-different suite failed with a `beforeAll` timeout or an ECONNRESET while
 * passing perfectly on its own. A test suite that fails at random is worse than a slow one,
 * because it trains everyone to re-run instead of to look.
 *
 * Suites still get a clean database: each one drops its own at the end, and clearTestDb wipes
 * collections between tests exactly as before. The only thing now shared is the server process.
 */
export default async function globalSetup() {
  const replSet = await MongoMemoryReplSet.create({
    replSet: {
      count: 1,
      storageEngine: "wiredTiger",
      // MongoDB's default 5ms transaction lock-wait timeout is tuned for a busy production
      // deployment. Against a single-node test replica set it trips on ordinary sequential test
      // traffic, throwing "Unable to acquire IX lock ... within 5ms" for no application reason.
      args: ["--setParameter", "maxTransactionLockRequestTimeoutMillis=5000"],
    },
  });

  // Workers are forked after this runs, so they inherit the URI through the environment.
  process.env.MONGO_TEST_URI = replSet.getUri();
  // Kept on globalThis so globalTeardown can stop the same instance.
  globalThis.__MONGO_REPLSET__ = replSet;
}
