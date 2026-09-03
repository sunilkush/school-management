export default {
  testEnvironment: "node",
  testMatch: ["**/tests/api/**/*.test.js"],
  // tests/setup/env.js was written to be a setupFiles entry and describes itself as one, but was
  // never actually wired up — so until now the suite quietly authenticated with whatever real
  // secrets happened to be in the developer's .env.
  setupFiles: ["<rootDir>/tests/setup/env.js"],
  // One in-memory MongoDB for the whole run, instead of one per test file. Twenty-six suites
  // each starting and stopping their own replica set spent most of the run on process startup,
  // and often enough one lost the race to come up inside the timeout — so a random suite failed
  // with a beforeAll timeout while passing perfectly on its own. See tests/setup/globalSetup.js.
  globalSetup: "<rootDir>/tests/setup/globalSetup.js",
  globalTeardown: "<rootDir>/tests/setup/globalTeardown.js",
  // Connecting to an already-running replica set is fast, but a cold first test in a file still
  // has index builds ahead of it, so this stays well above Jest's 5000ms default.
  testTimeout: 20000,
};
