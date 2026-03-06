import admin from "firebase-admin";

if (!admin.apps.length) {
  const serviceAccountVar = process.env.FIREBASE_SERVICE_ACCOUNT;

  if (serviceAccountVar) {
    // รันบน Render: ใช้ JSON จาก Environment Variable
    const serviceAccount = JSON.parse(serviceAccountVar);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("Firebase Admin: Initialized with Service Account (Render)");
  } else {
    // รันบนเครื่องตัวเอง: ใช้ Default Credentials
    admin.initializeApp();
    console.log("Firebase Admin: Initialized with Default Credentials");
  }
}

export const db = admin.firestore();
