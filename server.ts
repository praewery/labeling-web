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

// --- API ของคุณ (Users, Items, Labels) ---
app.get("/api/users", async (req, res) => {
  try {
    const snapshot = await db.collection("users").get();
    const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(users);
  } catch (err) { res.status(500).json({ error: err }); }
});
// (ก๊อปปี้ API อื่นๆ ของคุณมาวางตรงนี้ได้เลย)

// --- ส่งหน้าเว็บให้ User ---
app.get("*", (req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
