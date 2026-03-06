import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { db } from "./firestore.js";

const app = express();

// ตั้งค่า Path สำหรับ ES Modules เพื่อให้หาโฟลเดอร์ dist เจอ
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());

// 1. ให้ Express เสิร์ฟไฟล์ Static จากโฟลเดอร์ dist (ที่ได้จากการ build React)
app.use(express.static(path.join(__dirname, "dist")));

// ==========================
// USERS API
// ==========================
app.post("/api/users", async (req, res) => {
  const { username, password, role } = req.body;
  try {
    const ref = await db.collection("users").add({
      username,
      password,
      role,
      createdAt: Date.now(),
    });
    res.json({ id: ref.id });
  } catch (err) {
    res.status(500).json({ error: err });
  }
});

app.get("/api/users", async (req, res) => {
  try {
    const snapshot = await db.collection("users").get();
    const users = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err });
  }
});

// ==========================
// ITEMS API
// ==========================
app.post("/api/items", async (req, res) => {
  try {
    const ref = await db.collection("items").add(req.body);
    res.json({ id: ref.id });
  } catch (err) {
    res.status(500).json({ error: err });
  }
});

app.get("/api/items", async (req, res) => {
  try {
    const snapshot = await db.collection("items").get();
    const items = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err });
  }
});

// ==========================
// LABELS API
// ==========================
app.post("/api/labels", async (req, res) => {
  try {
    const ref = await db.collection("labels").add({
      ...req.body,
      createdAt: Date.now(),
    });
    res.json({ id: ref.id });
  } catch (err) {
    res.status(500).json({ error: err });
  }
});

app.get("/api/labels", async (req, res) => {
  try {
    const snapshot = await db.collection("labels").get();
    const labels = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    res.json(labels);
  } catch (err) {
    res.status(500).json({ error: err });
  }
});

// ==========================
// FRONTEND ROUTING
// ==========================
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
