const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'src')));

// Initialize SQLite database
const db = new Database('./registrations.db');

// Create table if not exists
db.exec(`
  CREATE TABLE IF NOT EXISTS registrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nama_siswa TEXT NOT NULL,
    nama_ortu TEXT NOT NULL,
    no_hp TEXT NOT NULL,
    email TEXT,
    asal_sekolah TEXT NOT NULL,
    alamat TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Hardcoded admin password
const ADMIN_PASSWORD = 'smp2026admin';

// API: Submit registration
app.post('/api/register', (req, res) => {
  try {
    const { nama_siswa, nama_ortu, no_hp, email, asal_sekolah, alamat } = req.body;
    
    const stmt = db.prepare(`
      INSERT INTO registrations (nama_siswa, nama_ortu, no_hp, email, asal_sekolah, alamat)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(nama_siswa, nama_ortu, no_hp, email, asal_sekolah, alamat);
    
    res.json({ success: true, id: result.lastInsertRowid });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// API: Get all registrations (protected)
app.post('/api/admin/registrations', (req, res) => {
  try {
    const { password } = req.body;
    
    if (password !== ADMIN_PASSWORD) {
      return res.status(401).json({ success: false, error: 'Invalid password' });
    }
    
    const stmt = db.prepare('SELECT * FROM registrations ORDER BY timestamp DESC');
    const registrations = stmt.all();
    
    res.json({ success: true, data: registrations });
  } catch (error) {
    console.error('Admin error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// API: Delete registration (protected)
app.post('/api/admin/delete', (req, res) => {
  try {
    const { password, id } = req.body;
    
    if (password !== ADMIN_PASSWORD) {
      return res.status(401).json({ success: false, error: 'Invalid password' });
    }
    
    const stmt = db.prepare('DELETE FROM registrations WHERE id = ?');
    stmt.run(id);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Serve admin page
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'admin.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Admin panel: http://localhost:${PORT}/admin`);
});
