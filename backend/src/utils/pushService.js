import admin from "firebase-admin";
import { DeviceToken } from "../models/DeviceToken.model.js";

const FCM_MULTICAST_LIMIT = 500; // hard cap enforced by sendEachForMulticast

let firebaseApp;
let initAttempted = false;

/**
 * Lazily initializes Firebase Admin from FIREBASE_SERVICE_ACCOUNT_JSON. Returns null (rather than
 * throwing) when the env var isn't set, so a school that hasn't configured push yet doesn't take
 * the whole notification-creation request down — push becomes a no-op, not a 500.
 */
function getFirebaseApp() {
  if (initAttempted) return firebaseApp || null;
  initAttempted = true;

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!serviceAccountJson) {
    console.warn("[pushService] FIREBASE_SERVICE_ACCOUNT_JSON not set — push notifications are disabled");
    return null;
  }

  try {
    const credentials = JSON.parse(serviceAccountJson);
    firebaseApp = admin.apps.length ? admin.app() : admin.initializeApp({ credential: admin.credential.cert(credentials) });
    return firebaseApp;
  } catch (error) {
    console.error("[pushService] Failed to initialize Firebase Admin:", error.message);
    return null;
  }
}

function chunk(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) chunks.push(array.slice(i, i + size));
  return chunks;
}

/**
 * Sends a push notification (FCM for Android, FCM-relayed APNs for iOS) to every active device
 * registered for the given user ids. Never throws for a delivery failure — the caller (creating a
 * Notification record) should succeed regardless of push outcome, since in-app delivery via
 * GET /notification is the source of truth.
 */
export async function sendPushToUsers(userIds, { title, body, data = {} }) {
  if (!userIds?.length) return { sent: 0, failed: 0, skipped: false };

  const app = getFirebaseApp();
  if (!app) return { sent: 0, failed: 0, skipped: true };

  const devices = await DeviceToken.find({ userId: { $in: userIds }, isActive: true }).select("token");
  if (!devices.length) return { sent: 0, failed: 0, skipped: false };

  // FCM data-message values must all be strings.
  const stringData = Object.fromEntries(Object.entries(data).map(([key, value]) => [key, String(value)]));

  let sent = 0;
  let failed = 0;
  const deadTokens = [];

  for (const batch of chunk(devices, FCM_MULTICAST_LIMIT)) {
    try {
      const response = await admin.messaging(app).sendEachForMulticast({
        notification: { title, body },
        data: stringData,
        tokens: batch.map((d) => d.token),
      });
      sent += response.successCount;
      failed += response.failureCount;

      response.responses.forEach((result, index) => {
        const code = result.error?.code;
        if (!result.success && (code === "messaging/registration-token-not-registered" || code === "messaging/invalid-registration-token")) {
          deadTokens.push(batch[index].token);
        }
      });
    } catch (error) {
      console.error("[pushService] sendEachForMulticast failed for a batch:", error.message);
      failed += batch.length;
    }
  }

  if (deadTokens.length) {
    await DeviceToken.updateMany({ token: { $in: deadTokens } }, { isActive: false });
  }

  return { sent, failed, skipped: false };
}
