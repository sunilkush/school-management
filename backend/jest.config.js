export default {
  testEnvironment: "node",
  testMatch: ["**/tests/api/**/*.test.js", "**/tests/unit/**/*.test.js"],
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
  // Connecting is fast; building indexes is not. Each suite gets a fresh database and then builds
  // the indexes for all ~132 models, measured at roughly 9-10s on its own and more when the rest
  // of the run is competing for the machine. At 20000 that tipped over the hook timeout now and
  // then, and a suite would fail in beforeAll for no reason of its own.
  //
  // It got slower for a good reason: three indexes used to be declared twice and Model.init()
  // rejected early on the conflict, so most of this work never happened. Now it does.
  testTimeout: 60000,
};
