import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore"; // Import แยกออกมาเพื่อความชัวร์

if (!admin.apps.length) {
  const serviceAccountVar = process.env.FIREBASE_SERVICE_ACCOUNT;

  if (serviceAccountVar) {
    try {
      const serviceAccount = JSON.parse(serviceAccountVar);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log("Firebase Admin: Initialized with Service Account (Render)");
    } catch (e) {
      console.error("Error parsing FIREBASE_SERVICE_ACCOUNT:", e);
    }
  } else {
    admin.initializeApp();
    console.log("Firebase Admin: Initialized with Default Credentials");
  }
}

// ใช้ getFirestore และระบุ Database ID "label-bu" ตามที่คุณสร้างไว้
export const db = getFirestore("label-bu");
