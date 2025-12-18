# 📸 Photo Log

A modern, minimalist static photo portfolio built with React + Vite that automatically scans folders of images, extracts EXIF metadata, and builds beautiful album pages.

**No CMS. No database. No backend.**

---

## ✨ Features

- 🔍 **Automatic EXIF extraction** - Camera, lens, settings, dates, and more
- 📁 **Folder-based organization** - Drop images in folders, run one command
- 🏷️ **Tag filtering** - Organize and filter albums by tags
- 🖼️ **Responsive grid layouts** - Beautiful on all devices
- 🔦 **Lightbox with EXIF toggle** - View full images with technical details
- ⌨️ **Keyboard navigation** - Arrow keys, ESC, and 'I' for info
- 🎨 **Theme system** - Multiple themes (mono, paper)
- 🗺️ **Trip visualization** - Group albums into journeys with maps
- ⚡ **Fast & lightweight** - Static build, lazy-loaded images
- 🔒 **EXIF preserved** - Metadata stays intact in your images

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Add Your Photos

Place original photos in `photo-source/originals/{album-name}/`:

```
photo-source/originals/
  └── my-album/
      ├── _album.json  (optional)
      ├── IMG_001.jpg
      ├── IMG_002.jpg
      └── ...
```

### 3. Process Images

```bash
npm run import:photos
```

This processes images, extracts EXIF data, and generates JSON manifests.

### 4. Develop or Build

```bash
# Development server
npm run dev

# Production build
npm run build
```

---

## 📚 Documentation

- **[Configuration Guide](docs/CONFIGURATION.md)** - Complete reference for all JSON configuration options
- **[Development Guide](docs/DEVELOPMENT.md)** - Local setup, workflows, and common tasks
- **[Architecture Guide](docs/ARCHITECTURE.md)** - System design and data flow

---

## 📂 Project Structure

```
Photo-Log/
├── content/              # JSON manifests (generated + config)
│   ├── site/            # Site configuration
│   ├── albums.json      # Album index (generated)
│   ├── albums/          # Individual albums (generated)
│   └── trips/           # Trip definitions
├── photo-source/        # Source photos (your originals)
│   └── originals/
├── public/              # Static assets (processed images)
├── scripts/             # Build/processing scripts
├── src/                 # React application
└── dist/                # Production build (generated)
```

---

## 🎯 Common Workflows

### Adding Photos

1. Place photos in `photo-source/originals/{album-name}/`
2. Optionally create `_album.json` for metadata
3. Run `npm run import:photos`
4. View at `http://localhost:5173`

### Creating a New Album

```bash
npm run new-album
```

Follow the prompts, then add photos to the created folder.

### Configuration

Edit `content/site/site.json` to customize:
- Site title and owner name
- Navigation menu
- Social links
- SEO settings
- Hero section
- Theme

See [Configuration Guide](docs/CONFIGURATION.md) for details.

---

## 🖼️ Supported Image Formats

- `.jpg` / `.jpeg`
- `.png`
- `.webp`
- `.avif`

---

## 📊 EXIF Data Extracted

- Camera make and model
- Lens model
- Aperture (f-stop)
- Shutter speed
- ISO
- Focal length
- Date taken
- GPS coordinates (if available)
- Artist / Copyright
- Image dimensions

---

## 🛠️ Tech Stack

- **React 19** - UI framework
- **Vite** - Build tool & dev server
- **React Router** - Client-side routing
- **exifr** - EXIF parsing library
- **Sharp** - Image processing
- **Leaflet** - Map visualization

---

## 📝 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run import:photos` | Process photos and generate JSON |
| `npm run scan` | Legacy: scan public/images/ |
| `npm run new-album` | Create new album interactively |
| `npm run init-locations` | Initialize album location config |
| `npm run lint` | Run ESLint |

---

## 🚀 Deployment

Build the static site:

```bash
npm run build
```

Deploy the `dist/` folder to any static host:
- **Netlify** - Drag & drop or Git integration
- **Vercel** - Import from Git
- **GitHub Pages** - Push to gh-pages branch
- **Cloudflare Pages** - Git integration
- **Any static host** - Upload `dist/` contents

---

## 🐛 Troubleshooting

### Albums not showing?

- Ensure images exist in the album folder
- Run `npm run import:photos` after adding images
- Check browser console for errors

### EXIF data missing?

- Some images don't have EXIF (screenshots, edited images, etc.)
- Ensure images weren't stripped during editing

### Build errors?

- Clear `node_modules` and reinstall: `npm ci`
- Clear Vite cache: Delete `.vite` folder

**For more help, see [Development Guide](docs/DEVELOPMENT.md).**

---

## 📄 License

MIT - Feel free to use for personal or commercial projects.

---

## 🎉 Getting Started

```bash
# Install
npm install

# Add photos to photo-source/originals/
# Create _album.json files (optional)

# Process and preview
npm run import:photos
npm run dev

# Build for production
npm run build
```

Enjoy your photo gallery! 📸✨