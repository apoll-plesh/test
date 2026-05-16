const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const app = express();

const PORT = 3005;

app.use(express.json());
app.use(express.static(__dirname));

const db = new sqlite3.Database(path.join(__dirname, 'database.sqlite'));

db.run(`CREATE TABLE IF NOT EXISTS tickets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'средний',
  createdAt TEXT,
  synced INTEGER DEFAULT 1
)`);

app.get('/api/check', (req, res) => {
    res.json({ status: 'ok' });
});

app.get('/api/tickets', (req, res) => {
    db.all('SELECT * FROM tickets ORDER BY id DESC', (err, rows) => {
        if (err) res.status(500).json({ error: err.message });
        else res.json(rows);
    });
});

app.get('/api/check', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.json({ status: 'ok', timestamp: Date.now() });
});

app.post('/api/tickets', (req, res) => {
    const { title, description, priority, createdAt } = req.body;
    if (!title?.trim()) return res.status(400).json({ error: 'Название обязательно' });
    db.run('INSERT INTO tickets (title, description, priority, createdAt, synced) VALUES (?,?,?,?,1)',
        [title.trim(), description || '', priority || 'средний', createdAt || new Date().toISOString()],
        function(err) {
            if (err) res.status(500).json({ error: err.message });
            else res.json({ id: this.lastID });
        });
});

app.put('/api/tickets/:id', (req, res) => {
    const { title, description, priority } = req.body;
    if (!title?.trim()) return res.status(400).json({ error: 'Название обязательно' });
    db.run('UPDATE tickets SET title=?, description=?, priority=? WHERE id=?',
        [title.trim(), description || '', priority || 'средний', req.params.id],
        function(err) {
            if (err) res.status(500).json({ error: err.message });
            else res.json({ updated: this.changes });
        });
});

app.delete('/api/tickets/:id', (req, res) => {
    db.run('DELETE FROM tickets WHERE id=?', req.params.id,
        function(err) {
            if (err) res.status(500).json({ error: err.message });
            else res.json({ deleted: this.changes });
        });
});

app.listen(PORT, () => console.log(`Сервер запущен: http://localhost:${PORT}`));