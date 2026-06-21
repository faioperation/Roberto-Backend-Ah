import { initializeApp, cert } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import { envVars } from "./env.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let firebaseApp = null;
let messaging = null;

try {
  let credentialCert = null;
  let jsonPath = null;

  if (envVars.FIREBASE_SERVICE_ACCOUNT_PATH) {
    jsonPath = path.resolve(process.cwd(), envVars.FIREBASE_SERVICE_ACCOUNT_PATH);
  } else {
    jsonPath = path.join(__dirname, "roberto-notification-firebase-adminsdk-fbsvc-ebd70cfbdc.json");
  }

  if (jsonPath && fs.existsSync(jsonPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
    credentialCert = cert(serviceAccount);
    console.log(`🔥 Firebase Admin SDK credential prepared via JSON key file at: ${jsonPath}`);
  }

  if (credentialCert) {
    firebaseApp = initializeApp({
      credential: credentialCert,
    });
    messaging = getMessaging(firebaseApp);
    console.log("🔥 Firebase Admin SDK initialized successfully.");
  } else {
    console.warn("⚠️ Firebase Admin credentials not found. FCM notifications will be disabled.");
  }
} catch (error) {
  console.error("❌ Error initializing Firebase Admin SDK:", error);
}

export { firebaseApp, messaging };
export default firebaseApp;
