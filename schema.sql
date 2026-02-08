-- D1 Database Migration
-- Run this to create the registrations table

CREATE TABLE IF NOT EXISTS registrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nama_siswa TEXT NOT NULL,
    nama_ortu TEXT NOT NULL,
    no_hp TEXT NOT NULL,
    email TEXT,
    asal_sekolah TEXT NOT NULL,
    alamat TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_timestamp ON registrations(timestamp);
