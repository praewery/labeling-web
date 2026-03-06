import express from "express";
import { createServer as createViteServer } from "vite";
import { Firestore } from "@google-cloud/firestore";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const firestore = new Firestore();

async function startServer() {

  const app = express();

  app.use(express.json());

  // =========================
  // AUTH API
  // =========================

  app.post("/api/auth/login", async (req, res) => {

    const { username, password } = req.body;

    const snapshot = await firestore
      .collection("users")
      .where("username", "==", username)
      .where("password", "==", password)
      .get();

    if (!snapshot.empty) {

      const doc = snapshot.docs[0];

      res.json({
        id: doc.id,
        ...doc.data()
      });

    } else {

      res.status(401).json({
        error: "Invalid credentials"
      });

    }

  });

  app.post("/api/auth/signup", async (req, res) => {

    const { username, password } = req.body;

    const existing = await firestore
      .collection("users")
      .where("username", "==", username)
      .get();

    if (!existing.empty) {

      return res.status(400).json({
        error: "Username already exists"
      });

    }

    const userRef = await firestore
      .collection("users")
      .add({
        username,
        password,
        role: "labeler",
        createdAt: Date.now()
      });

    res.json({
      id: userRef.id,
      username,
      role: "labeler"
    });

  });

  // =========================
  // CONFIG API
  // =========================

  app.get("/api/config", async (req, res) => {

    const doc = await firestore
      .collection("config")
      .doc("main")
      .get();

    if (!doc.exists) {

      return res.json({
        fields: []
      });

    }

    res.json({
      fields: doc.data()?.fields || []
    });

  });

  app.post("/api/config", async (req, res) => {

    const { fields } = req.body;

    await firestore
      .collection("config")
      .doc("main")
      .set({
        fields
      });

    res.json({
      success: true
    });

  });

  // =========================
  // ITEMS API
  // =========================

  app.get("/api/items", async (req, res) => {

    const snapshot = await firestore
      .collection("items")
      .orderBy("createdAt", "desc")
      .get();

    const items = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json(items);

  });

  app.get("/api/items/:id", async (req, res) => {

    const doc = await firestore
      .collection("items")
      .doc(req.params.id)
      .get();

    if (!doc.exists) {

      return res.status(404).json({
        error: "Item not found"
      });

    }

    res.json({
      id: doc.id,
      ...doc.data()
    });

  });

  app.post("/api/items/bulk", async (req, res) => {

    const { urls } = req.body;

    const batch = firestore.batch();

    for (const url of urls) {

      const ref = firestore
        .collection("items")
        .doc();

      batch.set(ref, {
        url,
        status: "incomplete",
        data: {},
        createdAt: Date.now()
      });

    }

    await batch.commit();

    res.json({
      success: true
    });

  });

  app.post("/api/items/delete", async (req, res) => {

    const { ids } = req.body;

    const batch = firestore.batch();

    for (const id of ids) {

      const ref = firestore
        .collection("items")
        .doc(id);

      batch.delete(ref);

    }

    await batch.commit();

    res.json({
      success: true
    });

  });

  app.delete("/api/items", async (req, res) => {

    const snapshot = await firestore
      .collection("items")
      .get();

    const batch = firestore.batch();

    snapshot.docs.forEach(doc => {

      batch.delete(doc.ref);

    });

    await batch.commit();

    res.json({
      success: true
    });

  });

  app.put("/api/items/:id", async (req, res) => {

    const { url, status, data } = req.body;

    const updateData: any = {};

    if (url !== undefined) updateData.url = url;
    if (status !== undefined) updateData.status = status;
    if (data !== undefined) updateData.data = data;

    await firestore
      .collection("items")
      .doc(req.params.id)
      .update(updateData);

    res.json({
      success: true
    });

  });

  // =========================
  // VITE (dev / production)
  // =========================

  if (process.env.NODE_ENV !== "production") {

    const vite = await createViteServer({
      server: {
        middlewareMode: true
      },
      appType: "spa"
    });

    app.use(vite.middlewares);

  } else {

    app.use(express.static(path.join(__dirname, "dist")));

    app.get("*", (req, res) => {

      res.sendFile(
        path.join(__dirname, "dist", "index.html")
      );

    });

  }

  // =========================
  // START SERVER
  // =========================

  const PORT = process.env.PORT || 8080;

  app.listen(PORT, "0.0.0.0", () => {

    console.log(`Server running on port ${PORT}`);

  });

}

startServer();
