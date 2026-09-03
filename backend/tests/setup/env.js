// Runs via jest.config.js's `setupFiles`, which executes before any test file (and therefore
// before app.js's own `dotenv.config()`) — dotenv does not overwrite an already-set process.env
// key, so setting these here guarantees tests use these values instead of whatever real secrets
// happen to be in the local .env file, without needing a separate .env.test to keep in sync.
process.env.NODE_ENV = 'test';
process.env.ACCESS_TOKEN_SECRET = 'test-access-secret';
process.env.ACCESS_TOKEN_EXPIRY = '1d';
process.env.REFRESH_TOKEN_SECRET = 'test-refresh-secret';
process.env.REFRESH_TOKEN_EXPIRY = '10d';

// Blank out every outbound delivery credential.
//
// Not a precaution — a real problem, found because the run was full of "Cannot log after tests
// are done ... Attempted to log 'Email sent to t16-...@sub.test'". dotenv had loaded the
// developer's real SMTP account, so every test run was genuinely sending mail through it to
// invented addresses. Twilio would do the same the moment those keys exist locally.
//
// Every transport already checks its own credentials and returns {skipped:true} when they are
// missing (see mailServices.js, smsServices.js, whatsappServices.js). Emptying them here makes
// the test run take that existing path instead of adding a NODE_ENV branch to each sender.
//
// It also settles a second problem: notifyUser dispatches without the request waiting for it, so
// those sends outlived the suite that triggered them and went on writing deliveryStats after
// mongoose had disconnected — which is both the "Cannot log after tests are done" noise and a
// plausible cause of a random later suite failing.
process.env.SMTP_USER = '';
process.env.SMTP_PASS = '';
process.env.TWILIO_ACCOUNT_SID = '';
process.env.TWILIO_AUTH_TOKEN = '';
process.env.TWILIO_PHONE_NUMBER = '';
process.env.TWILIO_WHATSAPP_NUMBER = '';
process.env.FIREBASE_SERVICE_ACCOUNT_JSON = '';
