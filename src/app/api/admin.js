import * as admin from "firebase-admin";
import { cert } from "firebase-admin/app";
// const ServiceCredential = { 
//   "type": "service_account",
//   "project_id":process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID, 
//   "private_key_id": process.env.NEXT_PUBLIC_PRIVATE_KEY_ID,
//   "private_key": process.env.NEXT_PUBLIC_PRIVATE_KEY,
//   "client_email": process.env.NEXT_PUBLIC_CLIENT_EMAIL,
//   "client_id": process.env.NEXT_PUBLIC_CLIENT_ID,
//   "auth_uri": "https://accounts.google.com/o/oauth2/auth",
//   "token_uri": "https://oauth2.googleapis.com/token",
//   "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
//   "client_x509_cert_url": process.env.NEXT_PUBLIC_CERT_URL,
//   "universe_domain": "googleapis.com"
// }


if (!admin.apps.length) {
  try {
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "demo-app";
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (clientEmail && privateKey) {
      admin.initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      });
    } else {
      admin.initializeApp({
        projectId,
      });
    }
  } catch (error) {
    console.warn('Firebase admin initialization fallback:', error.message);
  }
}

export default admin;

