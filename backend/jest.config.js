export default {
  testEnvironment: "node",
  testMatch: ["**/tests/api/**/*.test.js"],
  // testDb.js's connectTestDb now starts a single-node MongoMemoryReplSet (needed for
  // transactions — see testDb.js) instead of a standalone MongoMemoryServer. Replica-set
  // initiation + primary election reliably takes longer than Jest's 5000ms default for both
  // the beforeAll hook and, on a cold run, the first test in a file — raising the default here
  // covers every test file instead of hand-tuning a timeout arg on each one.
  testTimeout: 20000,
};
