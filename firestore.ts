import admin from "firebase-admin";

if (!admin.apps.length) {
  // 1. ดึงค่า JSON ที่เราใส่ไว้ใน Environment Variable ของ Render (ชื่อต้องตรงกันเป๊ะ)
  const serviceAccountVar = process.env.FIREBASE_SERVICE_ACCOUNT;

  if (serviceAccountVar) {
    // 2. ถ้าเจอค่า JSON ให้แปลงเป็น Object แล้วใช้ล็อกอิน (กรณีรันบน Render)
    const serviceAccount = JSON.parse(serviceAccountVar);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("Firebase Admin: Initialized with Service Account (Render)");
  } else {
    // 3. ถ้าไม่เจอ (กรณีรันบน GCP หรือเครื่องตัวเองที่ตั้งค่าไว้แล้ว) ให้ใช้แบบเดิม
    admin.initializeApp();
    console.log("Firebase Admin: Initialized with Default Credentials");
  }
}

export const db = admin.firestore();
