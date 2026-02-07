# SMP DR MUSTA'IN ROMLY - Landing Page

Website landing page untuk SMP DR MUSTA'IN ROMLY dengan fokus pada pendaftaran online siswa baru.

## 🚀 Tech Stack

- **HTML5** - Semantic markup
- **Tailwind CSS** - Utility-first CSS (via CDN)
- **Vanilla JavaScript** - Form handling & interactions
- **Google Sheets API** - Form submission backend (TODO: setup)

## 📁 Project Structure

```
smp-mustain-romly/
├── src/
│   └── index.html          # Main landing page
├── assets/                 # Images, logos (TODO: add)
└── README.md
```

## 🎨 Design System

### Colors
- Primary: `#1e40af` (Blue-800)
- Primary Dark: `#1e3a8a` (hover)
- Primary Light: `#3b82f6`
- Background: `#ffffff`, `#f8fafc`
- Text: `#1e293b`, `#64748b`

### Typography
- Heading: Poppins (600, 700)
- Body: Inter (400, 500, 600)

## 📋 Sections

1. **Navbar** - Fixed navigation with mobile menu
2. **Hero** - CTA utama dengan stats
3. **About** - Profil sekolah + highlight cards
4. **Fasilitas** - Grid fasilitas unggulan
5. **Form Pendaftaran** - Form dengan validasi
6. **Footer** - Kontak & maps

## 🔧 TODO

- [ ] Setup Google Sheets API untuk form submission
- [ ] Add logo resmi sekolah
- [ ] Replace placeholder images
- [ ] Update kontak info (alamat, telepon, email real)
- [ ] Update Google Maps embed dengan lokasi sebenarnya
- [ ] Deploy ke Cloudflare Pages

## 📝 Deployment

### Cloudflare Pages

1. Connect GitHub repo ke Cloudflare Pages
2. Build settings:
   - Build command: (none, static site)
   - Build output: `src/`
3. Deploy

## 🏗️ Development

```bash
# Serve locally
cd src
python3 -m http.server 8000

# or use live-server
npx live-server src/
```

---

*Created: 2026-02-08*
*By: ArkCode*
