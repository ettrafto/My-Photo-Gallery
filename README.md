# 📸 Static Photo Gallery with EXIF Metadata

A modern, minimalist static photo portfolio built with React + Vite that automatically scans folders of images, extracts EXIF metadata, and builds beautiful album pages.

**No CMS. No database. No backend.**

## ✨ Features

- 🔍 **Automatic EXIF extraction** - Camera, lens, settings, dates, and more
- 📁 **Folder-based organization** - Drop images in folders, run one command
- 🏷️ **Tag filtering** - Organize and filter albums by tags
- 🖼️ **Responsive grid layouts** - Beautiful on all devices
- 🔦 **Lightbox with EXIF toggle** - View full images with technical details
- ⌨️ **Keyboard navigation** - Arrow keys, ESC, and 'I' for info
- 🎨 **Minimal dark theme** - Clean black background with white text
- ⚡ **Fast & lightweight** - Static build, lazy-loaded images
- 🔒 **EXIF preserved** - Metadata stays intact in your images

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Add Your Photos

Create album folders in `public/images/`:

```
public/images/
  ├── iceland-2025/
  │   ├── _album.json
  │   ├── IMG_001.jpg
  │   ├── IMG_002.jpg
  │   └── IMG_003.jpg
  └── street-photography/
      ├── _album.json
      └── photos...
```

### 3. Create Album Metadata (Optional)

Add `_album.json` to customize album details:

```json
{
  "title": "Iceland 2025",
  "description": "Winter landscapes and northern lights",
  "tags": ["travel", "landscape", "nature"],
  "date": "2025-01-12",
  "cover": "IMG_002.jpg"
}
```

If you don't provide metadata, the folder name becomes the title and the first image becomes the cover.

### 4. Scan & Generate

```bash
npm run scan
```

This reads all images, extracts EXIF data, and generates JSON manifests in `/content/`.

### 5. Develop or Build

```bash
# Development server
npm run dev

# Production build
npm run build && npm run preview
```

## 📂 Project Structure

```
PhotoGallery/
├── public/
│   └── images/              # Your photo albums go here
│       ├── album-1/
│       ├── album-2/
│       └── README.md
├── content/                 # Auto-generated manifests
│   ├── albums.json          # Master index
│   └── albums/
│       ├── album-1.json
│       └── album-2.json
├── scripts/
│   └── scan.mjs             # EXIF extraction script
├── src/
│   ├── components/
│   │   ├── AlbumGrid.jsx    # Album listing page
│   │   ├── AlbumPage.jsx    # Single album view
│   │   └── Lightbox.jsx     # Image viewer with EXIF
│   ├── App.jsx              # Router setup
│   └── main.jsx
└── package.json
```

## 🎯 Workflow

1. **Add Images** - Drop new photos into `public/images/your-album/`
2. **Optional Metadata** - Create or update `_album.json` in the album folder
3. **Scan** - Run `npm run scan` to regenerate manifests
4. **Deploy** - Run `npm run build` and deploy the `dist/` folder

## 🖼️ Supported Image Formats

- `.jpg` / `.jpeg`
- `.png`
- `.webp`
- `.avif`

## 📊 EXIF Data Extracted

The scanner extracts the following EXIF fields when available:

- Camera make and model
- Lens model
- Aperture (f-stop)
- Shutter speed
- ISO
- Focal length
- Date taken
- Artist / Copyright
- Image dimensions
- Description

## 🎨 Features in Detail

### Album Grid
- Responsive card layout
- Cover image with aspect ratio preservation
- Photo count and date
- Tag filtering
- Lazy-loaded images

### Album Page
- Responsive photo grid
- Click to open lightbox
- Back navigation

### Lightbox
- Full-screen image viewer
- Keyboard navigation (← → arrows)
- EXIF data toggle (press 'i')
- Previous/Next buttons
- Close with ESC or × button

## 🔧 Customization

### Styles
All components have separate CSS files for easy customization:
- `src/components/AlbumGrid.css`
- `src/components/AlbumPage.css`
- `src/components/Lightbox.css`
- `src/index.css` (global styles)

### Album Metadata
Each `_album.json` supports:
```json
{
  "title": "Album Title",
  "description": "Optional description",
  "tags": ["tag1", "tag2"],
  "date": "2025-01-15",
  "cover": "specific-image.jpg"
}
```

## 🚀 Optional Enhancements

### Image Optimization with Sharp
To add automatic resizing while preserving EXIF:

```bash
npm install sharp
```

Update `scripts/scan.mjs` to add resize logic with `.withMetadata()`.

### Color Extraction
Add dominant color backgrounds:

```bash
npm install node-vibrant
```

### Analytics
Since this is static, you can add:
- Google Analytics
- Plausible
- Simple Analytics

## 📦 Deployment

Build the static site:

```bash
npm run build
```

Deploy the `dist/` folder to:
- **Netlify** - Drag & drop or Git integration
- **Vercel** - Import from Git
- **GitHub Pages** - Push to gh-pages branch
- **Cloudflare Pages** - Git integration
- **Any static host** - Upload `dist/` contents

### Build Configuration
The app is already configured for production builds. Vite handles:
- Code splitting
- Asset optimization
- Cache busting
- Base path configuration (if needed)

## 🔒 EXIF Privacy

The scanner **preserves** EXIF data in your images. If you want to strip location data or other sensitive metadata before publishing:

1. Use ExifTool or ImageMagick to clean images before adding them
2. Or modify `scripts/scan.mjs` to copy images with stripped metadata

## 🐛 Troubleshooting

### Albums not showing?
- Make sure you have images (not just `_album.json`) in the folder
- Supported extensions: `.jpg`, `.jpeg`, `.png`, `.webp`, `.avif`
- Run `npm run scan` after adding images

### EXIF data missing?
- Some images don't have EXIF (screenshots, edited images, etc.)
- Ensure images weren't stripped during upload/editing
- Check the browser console for parsing errors

### Build errors?
- Clear `node_modules` and reinstall: `npm ci`
- Clear Vite cache: Delete `.vite` folder
- Ensure all dependencies are installed

## 📝 Scripts

| Command | Description |
|---------|-------------|
| `npm run scan` | Scan images and generate JSON manifests |
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |

## 🛠️ Tech Stack

- **React 19** - UI framework
- **Vite** - Build tool & dev server
- **React Router** - Client-side routing
- **exifr** - EXIF parsing library
- **slugify** - URL-friendly slugs

## 📄 License

MIT - Feel free to use for personal or commercial projects.

## 🎉 Getting Started

```bash
# Clone or use this template
npm install

# Add photos to public/images/
# Create _album.json files (optional)

# Scan and preview
npm run scan
npm run dev

# Build for production
npm run build
```

Enjoy your photo gallery! 📸✨
