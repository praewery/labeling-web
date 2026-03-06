import express from "express";
import cors from "cors";
import path from "path";
import { db } from "./firestore.js";

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 8080;

app.get("/", (req, res) => {
  res.send("Labeling API Running");
});


// ==========================
// USERS
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
  const snapshot = await db.collection("users").get();

  const users = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  res.json(users);
});


// ==========================
// ITEMS
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
  const snapshot = await db.collection("items").get();

  const items = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  res.json(items);
});


// ==========================
// LABELS
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
  const snapshot = await db.collection("labels").get();

  const labels = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  res.json(labels);
});


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
