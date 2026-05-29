# SMP Dr. Musta'in Romly (SMP SPARTA) - Website

Website landing page untuk SMP Dr. Musta'in Romly (SMP SPARTA) dengan fokus pada pendaftaran online siswa baru dan CMS admin untuk mengelola kegiatan sekolah.

## 🚀 Tech Stack

- **HTML5** - Semantic markup
- **Tailwind CSS** - Utility-first CSS (via CDN)
- **Vanilla JavaScript** - Form handling & interactions
- **Express.js** - Backend API server
- **SQLite (sql.js)** - Database for registrations and school activities
- **Multer** - File upload handling

## 📁 Project Structure

```
smp-mustain-romly/
├── src/
│   ├── index.html          # Main landing page
│   ├── admin.html          # Admin CMS panel
│   └── kegiatan.html       # Public detail page for school activities
├── uploads/                # Uploaded images (gitignored)
├── database.sqlite         # SQLite database (gitignored)
├── server.js               # Express backend server
└── README.md
```

## 🎨 Design System

### Colors
- Primary: `#1a5f2a` (Sparta Green)
- Primary Dark: `#0f4522` (hover)
- Primary Light: `#2d8a4e`
- Accent: `#d4af37` (Gold)
- Background: `#ffffff`, `#f9f7f0`

### Typography
- Heading: Poppins (600, 700, 800)
- Body: Inter (400, 500, 600)

## 📋 Sections

1. **Navbar** - Fixed navigation with mobile menu
2. **Hero** - CTA utama dengan stats
3. **About** - Profil sekolah + highlight cards
4. **Program** - Program sekolah (Riset & Inovasi, Relasi & Jaringan, Wirausaha)
5. **Galeri** - Kegiatan sekolah (dynamic from CMS)
6. **Pendaftaran** - Form pendaftaran online
7. **Footer** - Kontak & maps

## 🔧 Admin CMS

Akses admin panel di `/admin` dengan password default: `smp2026admin`

### Fitur CMS:
- Kelola kegiatan sekolah (CRUD)
- Upload cover image
- Rich text editor (TinyMCE)
- Publish/Draft status
- Kelola data pendaftaran siswa

## 🔧 TODO

- [ ] Setup environment variables untuk production
- [ ] Add logo resmi sekolah
- [ ] Replace placeholder images
- [ ] Update kontak info (alamat, telepon, email real)
- [ ] Update Google Maps embed dengan lokasi sebenarnya
- [ ] Deploy ke production (Cloudflare Pages / Workers)

## 🚀 Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Server will start at http://localhost:3000
# Admin panel: http://localhost:3000/admin
```

## 📝 License

Private - SMP Dr. Musta'in Romly
