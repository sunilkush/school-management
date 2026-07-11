// Runs via jest.config.js's `setupFiles`, which executes before any test file (and therefore
// before app.js's own `dotenv.config()`) — dotenv does not overwrite an already-set process.env
// key, so setting these here guarantees tests use these values instead of whatever real secrets
// happen to be in the local .env file, without needing a separate .env.test to keep in sync.
process.env.NODE_ENV = 'test';
process.env.ACCESS_TOKEN_SECRET = 'test-access-secret';
process.env.ACCESS_TOKEN_EXPIRY = '1d';
process.env.REFRESH_TOKEN_SECRET = 'test-refresh-secret';
process.env.REFRESH_TOKEN_EXPIRY = '10d';
