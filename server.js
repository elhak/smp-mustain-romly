const express = require('express');
const initSqlJs = require('sql.js');
const path = require('path');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'database.sqlite');

let db = null;

function persistDb() {
  if (!db) return;
  try {
    const data = db.export();
    fs.writeFileSync(DB_FILE, Buffer.from(data));
  } catch (error) {
    console.error('Gagal menyimpan database:', error);
  }
}

function runSchema() {
  db.run(`
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
  db.run(`
    CREATE TABLE IF NOT EXISTS school_activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      summary TEXT,
      cover_image TEXT,
      content_html TEXT NOT NULL,
      published INTEGER NOT NULL DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'src')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase() || '.jpg';
    cb(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/\.(jpg|jpeg|png|gif|webp)$/i.test(path.extname(file.originalname || ''))) {
      cb(null, true);
    } else if (/^image\//.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Hanya file gambar yang diizinkan.'));
    }
  }
});

// Hardcoded admin password
const ADMIN_PASSWORD = 'smp2026admin';

function all(sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length) stmt.bind(params);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

function get(sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length) stmt.bind(params);
  let row = null;
  if (stmt.step()) row = stmt.getAsObject();
  stmt.free();
  return row;
}

function run(sql, params = []) {
  db.run(sql, params);
  persistDb();
}

function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    || `item-${Date.now()}`;
}

function uniqueSlug(base) {
  let candidate = base;
  let counter = 1;
  while (get('SELECT 1 as ok FROM school_activities WHERE slug = ?', [candidate])) {
    counter += 1;
    candidate = `${base}-${counter}`;
  }
  return candidate;
}

function requireAdminPassword(req, res) {
  const password = req.body?.password || req.headers['x-admin-password'];
  if (password !== ADMIN_PASSWORD) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return false;
  }
  return true;
}

// API: Submit registration
app.post('/api/register', (req, res) => {
  try {
    const { nama_siswa, nama_ortu, no_hp, email, asal_sekolah, alamat } = req.body || {};
    run(
      `INSERT INTO registrations (nama_siswa, nama_ortu, no_hp, email, asal_sekolah, alamat) VALUES (?, ?, ?, ?, ?, ?)`,
      [nama_siswa, nama_ortu, no_hp, email || '', asal_sekolah, alamat]
    );
    const row = get('SELECT last_insert_rowid() AS id');
    res.json({ success: true, id: row?.id });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// API: Get all registrations (protected)
app.post('/api/admin/registrations', (req, res) => {
  try {
    if (!requireAdminPassword(req, res)) return;
    const registrations = all('SELECT * FROM registrations ORDER BY timestamp DESC');
    res.json({ success: true, data: registrations });
  } catch (error) {
    console.error('Admin error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// API: Delete registration (protected)
app.post('/api/admin/delete', (req, res) => {
  try {
    if (!requireAdminPassword(req, res)) return;
    const id = req.body?.id;
    run('DELETE FROM registrations WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Public API: list published school activities
app.get('/api/school-activities', (req, res) => {
  const rows = all('SELECT id, slug, title, summary, cover_image, created_at, updated_at FROM school_activities WHERE published = 1 ORDER BY datetime(created_at) DESC');
  res.json({ success: true, data: rows });
});

// Public API: detail by slug
app.get('/api/school-activities/:slug', (req, res) => {
  const row = get('SELECT * FROM school_activities WHERE slug = ?', [req.params.slug]);
  if (!row || (!row.published && row.published !== 1)) {
    return res.status(404).json({ success: false, error: 'Not found' });
  }
  res.json({ success: true, data: row });
});

// Admin API: list all school activities
app.post('/api/admin/school-activities', (req, res) => {
  if (!requireAdminPassword(req, res)) return;
  const rows = all('SELECT id, slug, title, summary, cover_image, published, created_at, updated_at FROM school_activities ORDER BY datetime(created_at) DESC');
  res.json({ success: true, data: rows });
});

// Admin API: create
app.post('/api/admin/school-activities/add', upload.single('cover_image'), (req, res) => {
  console.log('[HIT] /api/admin/school-activities/add');
  try {
    if (!requireAdminPassword(req, res)) return;
    const { title, summary, content_html, published } = req.body || {};
    if (!title || !content_html) {
      return res.status(400).json({ success: false, error: 'title dan content_html wajib diisi.' });
    }
    const cover_image = req.file ? `/uploads/${req.file.filename}` : (req.body.cover_image_url || '');
    const slug = uniqueSlug(slugify(req.body.slug || title));
    const publishedValue = published === '0' || published === 0 ? 0 : 1;

    run(
      `INSERT INTO school_activities (slug, title, summary, cover_image, content_html, published) VALUES (?, ?, ?, ?, ?, ?)`,
      [slug, title, summary || '', cover_image, content_html, publishedValue]
    );
    const created = get('SELECT id, slug FROM school_activities WHERE slug = ?', [slug]);
    res.json({ success: true, id: created?.id, slug });
  } catch (error) {
    console.error('Create school activity error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Admin API: get one
app.post('/api/admin/school-activities/:id', (req, res) => {
  if (!requireAdminPassword(req, res)) return;
  const row = get('SELECT * FROM school_activities WHERE id = ?', [Number(req.params.id)]);
  if (!row) return res.status(404).json({ success: false, error: 'Not found' });
  res.json({ success: true, data: row });
});

// Admin API: update
app.post('/api/admin/school-activities/:id/update', upload.single('cover_image'), (req, res) => {
  try {
    if (!requireAdminPassword(req, res)) return;
    const existing = get('SELECT * FROM school_activities WHERE id = ?', [Number(req.params.id)]);
    if (!existing) return res.status(404).json({ success: false, error: 'Not found' });

    const { title, summary, content_html, published, keep_cover } = req.body || {};
    if (!title || !content_html) {
      return res.status(400).json({ success: false, error: 'title dan content_html wajib diisi.' });
    }

    let cover_image = existing.cover_image;
    if (req.file) {
      cover_image = `/uploads/${req.file.filename}`;
    } else if (keep_cover !== '1' && req.body.cover_image_url !== undefined) {
      cover_image = req.body.cover_image_url || '';
    }

    let slug = existing.slug;
    if (req.body.slug || req.body.title) {
      const nextBase = slugify(req.body.slug || title);
      if (nextBase !== existing.slug) {
        slug = uniqueSlug(nextBase);
      }
    }

    const publishedValue = published === '0' || published === 0 ? 0 : 1;

    run(
      `UPDATE school_activities SET slug = ?, title = ?, summary = ?, cover_image = ?, content_html = ?, published = ?, updated_at = datetime('now') WHERE id = ?`,
      [slug, title, summary || '', cover_image, content_html, publishedValue, existing.id]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Update school activity error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Admin API: delete
app.post('/api/admin/school-activities/:id/delete', (req, res) => {
  try {
    if (!requireAdminPassword(req, res)) return;
    const existing = get('SELECT id FROM school_activities WHERE id = ?', [Number(req.params.id)]);
    if (!existing) return res.status(404).json({ success: false, error: 'Not found' });
    run('DELETE FROM school_activities WHERE id = ?', [existing.id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete school activity error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Admin API: single image upload helper for editor / general use
app.post('/api/admin/school-activities/create-image', upload.single('cover_image'), (req, res) => {
  try {
    if (!requireAdminPassword(req, res)) return;
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Tidak ada file yang diunggah.' });
    }
    res.json({ success: true, url: `/uploads/${req.file.filename}` });
  } catch (error) {
    console.error('Upload image error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Serve admin page
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'admin.html'));
});

// Public detail page for gallery content
app.get('/kegiatan/:slug', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'kegiatan.html'));
});

// Debug: log unmatched requests
app.use((req, res, next) => {
  console.log('[MISS]', req.method, req.originalUrl);
  res.status(404).json({ success: false, error: 'Not found' });
});

async function start() {
  const SQL = await initSqlJs();
  const exists = fs.existsSync(DB_FILE);
  const buffer = exists ? fs.readFileSync(DB_FILE) : undefined;
  db = buffer ? new SQL.Database(buffer) : new SQL.Database();
  runSchema();
  persistDb();

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Admin panel: http://localhost:${PORT}/admin`);
  });
}

start().catch((error) => {
  console.error('Gagal menjalankan server:', error);
  process.exit(1);
});
