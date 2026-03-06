import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { db } from "./firestore.js"; // แก้ชื่อให้ตรงกับไฟล์ด้านบน

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());

// ชี้ไปที่โฟลเดอร์ dist (หน้าเว็บ React ที่ Build แล้ว)
const distPath = path.join(__dirname, "dist");
app.use(express.static(distPath));

// ==========================
// AUTH API (LOGIN / SIGNUP)
// ==========================

app.post("/api/auth/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    // ค้นหาแค่ username อย่างเดียว เพื่อเลี่ยงปัญหา Composite Index Error
    const snapshot = await db.collection("users").where("username", "==", username).get();

    if (snapshot.empty) {
      return res.status(401).json({ error: "ไม่พบชื่อผู้ใช้งานนี้ในระบบ" });
    }

    const userData = snapshot.docs[0].data();

    // ตรวจสอบรหัสผ่านด้วย Code (Manual Check)
    if (userData.password !== password) {
      return res.status(401).json({ error: "รหัสผ่านไม่ถูกต้อง" });
    }

    // ส่งข้อมูลกลับไปให้ Frontend (ข้อมูลจะอยู่ถาวรใน Firestore)
    res.json({ 
      id: snapshot.docs[0].id, 
      username: userData.username, 
      role: userData.role 
    });

  } catch (err: any) {
    console.error("Login Error:", err.message);
    res.status(500).json({ error: "Server Error", details: err.message });
  }
});

app.post("/api/auth/signup", async (req, res) => {
  const { username, password } = req.body;
  try {
    const userRef = db.collection("users");
    const checkExist = await userRef.where("username", "==", username).get();
    
    if (!checkExist.empty) {
      return res.status(400).json({ error: "มีชื่อผู้ใช้งานนี้แล้ว" });
    }

    const newUser = {
      username,
      password,
      role: "labeler", // ค่าเริ่มต้นสำหรับคนสมัครใหม่
      createdAt: Date.now()
    };

    const ref = await userRef.add(newUser);
    res.json({ id: ref.id, username, role: "labeler" });
  } catch (err: any) {
    res.status(500).json({ error: "Signup failed", details: err.message });
  }
});

// ==========================
// DATA API (ITEMS & LABELS) - ข้อมูลอยู่ถาวรบน Cloud
// ==========================

app.get("/api/items", async (req, res) => {
  try {
    const snapshot = await db.collection("items").get();
    res.json(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/items", async (req, res) => {
  try {
    const ref = await db.collection("items").add(req.body);
    res.json({ id: ref.id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// หน้าอื่นๆ ให้วิ่งไปหา index.html ของ React
app.get("*", (req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
