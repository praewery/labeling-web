import express from 'express';
import { createServer as createViteServer } from 'vite';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database('labeling.db');

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS config (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    fields TEXT
  );

  CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    url TEXT,
    status TEXT DEFAULT 'incomplete',
    data TEXT
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    role TEXT
  );
`);

// Seed initial config if empty
const configCount = db.prepare('SELECT COUNT(*) as count FROM config').get() as { count: number };
if (configCount.count === 0) {
  db.prepare('INSERT INTO config (id, fields) VALUES (1, ?)').run(JSON.stringify([]));
}

// Seed initial admin users if they don't exist
const admins = ['admin1', 'admin2', 'admin3', 'admin4'];
const checkUser = db.prepare('SELECT id FROM users WHERE username = ?');
const insertUser = db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)');

for (const admin of admins) {
  const existing = checkUser.get(admin);
  if (!existing) {
    insertUser.run(admin, 'admin123', 'admin');
  }
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // AUTH API
  app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    const user = db.prepare('SELECT id, username, role FROM users WHERE username = ? AND password = ?').get(username, password) as any;
    if (user) {
      res.json(user);
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  });

  app.post('/api/auth/signup', (req, res) => {
    const { username, password } = req.body;
    try {
      const result = db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)').run(username, password, 'labeler');
      res.json({ id: result.lastInsertRowid, username, role: 'labeler' });
    } catch (e) {
      res.status(400).json({ error: 'Username already exists' });
    }
  });

  // CONFIG API
  app.get('/api/config', (req, res) => {
    const config = db.prepare('SELECT fields FROM config WHERE id = 1').get() as { fields: string };
    res.json({ fields: JSON.parse(config.fields) });
  });

  app.post('/api/config', (req, res) => {
    const { fields } = req.body;
    db.prepare('UPDATE config SET fields = ? WHERE id = 1').run(JSON.stringify(fields));
    res.json({ success: true });
  });

  // ITEMS API
  app.get('/api/items', (req, res) => {
    const items = db.prepare('SELECT * FROM items ORDER BY id DESC').all() as any[];
    const parsedItems = items.map(item => ({
      ...item,
      data: item.data ? JSON.parse(item.data) : {}
    }));
    res.json(parsedItems);
  });

  app.post('/api/items/bulk', (req, res) => {
    const { urls } = req.body;
    const insert = db.prepare('INSERT INTO items (url, status, data) VALUES (?, ?, ?)');
    const insertMany = db.transaction((urls: string[]) => {
      for (const url of urls) insert.run(url, 'incomplete', JSON.stringify({}));
    });
    insertMany(urls);
    res.json({ success: true });
  });

  app.post('/api/items/delete', (req, res) => {
    const { ids } = req.body;
    const deleteStmt = db.prepare('DELETE FROM items WHERE id = ?');
    const deleteMany = db.transaction((ids: number[]) => {
      for (const id of ids) deleteStmt.run(id);
    });
    deleteMany(ids);
    res.json({ success: true });
  });

  app.delete('/api/items', (req, res) => {
    db.prepare('DELETE FROM items').run();
    res.json({ success: true });
  });

  app.get('/api/items/:id', (req, res) => {
    const item = db.prepare('SELECT * FROM items WHERE id = ?').get(req.params.id) as any;
    if (item) {
      res.json({
        ...item,
        data: item.data ? JSON.parse(item.data) : {}
      });
    } else {
      res.status(404).json({ error: 'Item not found' });
    }
  });

  app.put('/api/items/:id', (req, res) => {
    const { url, status, data } = req.body;
    if (url !== undefined) {
      db.prepare('UPDATE items SET url = ? WHERE id = ?').run(url, req.params.id);
    }
    if (status !== undefined) {
      db.prepare('UPDATE items SET status = ? WHERE id = ?').run(status, req.params.id);
    }
    if (data !== undefined) {
      db.prepare('UPDATE items SET data = ? WHERE id = ?').run(JSON.stringify(data), req.params.id);
    }
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
