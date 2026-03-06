import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { db } from "./firestore.js";

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());

// บอกให้ Express ไปหยิบไฟล์จากโฟลเดอร์ dist ที่ Vite สร้างให้
const distPath = path.join(__dirname, "dist");
app.use(express.static(distPath));

// ==========================
// AUTH API (LOGIN / SIGNUP)
// ==========================

// สำหรับสมัครสมาชิก (SIGNUP)
app.post("/api/auth/signup", async (req, res) => {
  const { username, password } = req.body;
  try {
    // 1. เช็คก่อนว่ามี user นี้หรือยัง
    const userSnapshot = await db.collection("users").where("username", "==", username).get();
    if (!userSnapshot.empty) {
      return res.status(400).json({ error: "Username already exists" });
    }

    const newUser = {
      username,
      password, // หมายเหตุ: ในระบบจริงควรใช้ bcrypt encrypt รหัสผ่าน
      role: "labeler",
      createdAt: Date.now(),
    };

    const ref = await db.collection("users").add(newUser);
    res.json({ id: ref.id, username, role: "labeler" });
  } catch (err) {
    res.status(500).json({ error: "Database error during signup" });
  }
});

// สำหรับเข้าสู่ระบบ (LOGIN)
app.post("/api/auth/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const snapshot = await db.collection("users")
      .where("username", "==", username)
      .where("password", "==", password)
      .get();

    if (snapshot.empty) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const userData = snapshot.docs[0].data();
    res.json({ 
      id: snapshot.docs[0].id, 
      username: userData.username, 
      role: userData.role 
    });
  } catch (err) {
    res.status(500).json({ error: "Login process failed" });
  }
});

// ==========================
// DATA API (USERS, ITEMS, LABELS)
// ==========================

app.get("/api/users", async (req, res) => {
  try {
    const snapshot = await db.collection("users").get();
    const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(users);
  } catch (err) { res.status(500).json({ error: err }); }
});

app.get("/api/items", async (req, res) => {
  try {
    const snapshot = await db.collection("items").get();
    const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(items);
  } catch (err) { res.status(500).json({ error: err }); }
});

app.post("/api/items", async (req, res) => {
  try {
    const ref = await db.collection("items").add(req.body);
    res.json({ id: ref.id });
  } catch (err) { res.status(500).json({ error: err }); }
});

app.get("/api/labels", async (req, res) => {
  try {
    const snapshot = await db.collection("labels").get();
    const labels = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(labels);
  } catch (err) { res.status(500).json({ error: err }); }
});

app.post("/api/labels", async (req, res) => {
  try {
    const ref = await db.collection("labels").add({ ...req.body, createdAt: Date.now() });
    res.json({ id: ref.id });
  } catch (err) { res.status(500).json({ error: err }); }
});

// ==========================
// FRONTEND ROUTING
// ==========================
app.get("*", (req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
