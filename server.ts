import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { db } from "./firebase.js"; // ตรวจสอบว่าชื่อไฟล์ตรงกับ firebase.ts หรือ firestore.ts

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());

// ชี้ไปที่โฟลเดอร์ dist ที่ได้จากการ build หน้าเว็บ
const distPath = path.join(__dirname, "dist");
app.use(express.static(distPath));

// ==========================
// AUTH API (LOGIN / SIGNUP)
// ==========================

app.post("/api/auth/login", async (req, res) => {
  const { username, password } = req.body;
  console.log(`>>> Login attempt for: ${username}`);

  try {
    // ตรวจสอบว่า db เชื่อมต่อได้หรือไม่
    if (!db) {
      throw new Error("Firestore database is not initialized");
    }

    const snapshot = await db.collection("users")
      .where("username", "==", username)
      .where("password", "==", password)
      .get();

    if (snapshot.empty) {
      console.log(`!!! Login failed: Invalid credentials for ${username}`);
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const userData = snapshot.docs[0].data();
    console.log(`>>> Login success: ${username} (Role: ${userData.role})`);
    
    res.json({ 
      id: snapshot.docs[0].id, 
      username: userData.username, 
      role: userData.role 
    });

  } catch (err: any) {
    // พ่น Error ออกมาดูใน Render Logs แบบละเอียด
    console.error("--- LOGIN ERROR DETAILS ---");
    console.error("Message:", err.message);
    if (err.message.includes("index")) {
      console.error("ACTION REQUIRED: Click the link in the logs above to create a Firestore Index.");
    }
    console.error("---------------------------");

    res.status(500).json({ 
      error: "Login failed", 
      details: err.message 
    });
  }
});

app.post("/api/auth/signup", async (req, res) => {
  const { username, password } = req.body;
  try {
    const userRef = db.collection("users");
    const checkExist = await userRef.where("username", "==", username).get();
    
    if (!checkExist.empty) {
      return res.status(400).json({ error: "Username already exists" });
    }

    const newUser = {
      username,
      password,
      role: "labeler",
      createdAt: Date.now()
    };

    const ref = await userRef.add(newUser);
    res.json({ id: ref.id, username, role: "labeler" });
  } catch (err: any) {
    console.error("Signup Error:", err.message);
    res.status(500).json({ error: "Signup failed", details: err.message });
  }
});

// ==========================
// DATA API (ITEMS & LABELS)
// ==========================

app.get("/api/items", async (req, res) => {
  try {
    const snapshot = await db.collection("items").get();
    const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(items);
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

app.get("/api/labels", async (req, res) => {
  try {
    const snapshot = await db.collection("labels").get();
    const labels = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(labels);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/labels", async (req, res) => {
  try {
    const ref = await db.collection("labels").add({ ...req.body, createdAt: Date.now() });
    res.json({ id: ref.id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================
// FRONTEND ROUTING
// ==========================
app.get("*", (req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
