**⚠️ ARCHIVED on 2025-01-XX**  
**Superseded by**: `README.md` and `docs/DEVELOPMENT.md`  
**Reason**: Content merged into canonical documentation

---

# 🚀 Quick Start Guide

Your static photo gallery with EXIF metadata is ready! Here's how to use it:

## ✅ What's Been Set Up

1. ✅ **Dependencies installed**: exifr, slugify, react-router-dom
2. ✅ **Folder structure created**: 
   - `public/images/` - where your photos go
   - `content/` - auto-generated manifests
   - `scripts/` - EXIF scanning script
3. ✅ **React components built**:
   - AlbumGrid - displays all albums
   - AlbumPage - shows photos in an album
   - Lightbox - full-screen viewer with EXIF toggle
4. ✅ **Routing configured** with React Router
5. ✅ **Dark theme** with minimal black background

## 🎯 Next Steps

### Option 1: Test with Sample Images

1. **Add some test images** to the sample album:
   ```
   public/images/sample-album/
   ```
   Copy any `.jpg`, `.png`, or `.webp` files there.

2. **Scan the images**:
   ```bash
   npm run scan
   ```

3. **View in browser** (dev server should be running):
   Open http://localhost:5173

### Option 2: Create Your Own Album

1. **Create a new folder** in `public/images/`:
   ```
   public/images/my-vacation/
   ```

2. **Add your photos** to that folder

3. **(Optional) Create metadata** `public/images/my-vacation/_album.json`:
   ```json
   {
     "title": "Summer Vacation 2025",
     "description": "Beach photos from Greece",
     "tags": ["travel", "beach", "summer"],
     "date": "2025-08-01"
   }
   ```

4. **Scan and view**:
   ```bash
   npm run scan
   npm run dev
   ```

## 🎨 Features to Try

### In the Album Grid (homepage)
- Filter by tags (if you've added tags to albums)
- Click any album to view its photos

### In an Album
- Click any photo to open the lightbox
- Use keyboard navigation:
  - `←` `→` to navigate photos
  - `i` to toggle EXIF information
  - `ESC` to close lightbox

### EXIF Data Displayed
The lightbox shows (when available):
- Camera make and model
- Lens
- Aperture, shutter speed, ISO
- Focal length
- Date taken
- Dimensions
- Artist/Copyright

## 📦 When You're Ready to Deploy

1. **Build the site**:
   ```bash
   npm run build
   ```

2. **Test the build**:
   ```bash
   npm run preview
   ```

3. **Deploy the `dist/` folder** to:
   - Netlify (recommended - drag & drop)
   - Vercel
   - GitHub Pages
   - Cloudflare Pages
   - Any static host

## 🔄 Regular Workflow

Every time you add/remove/change images:

```bash
npm run scan    # Regenerate manifests
npm run dev     # Preview changes
```

When ready to publish:

```bash
npm run build   # Build for production
```

## 💡 Tips

1. **EXIF is preserved** - Your original images keep all their metadata
2. **Lazy loading** - Images load as you scroll for better performance
3. **Aspect ratios** - Each image maintains its original proportions
4. **No backend needed** - Everything is static files
5. **Git-friendly** - Only track source images, not generated JSON

## 🐛 Troubleshooting

**No albums showing?**
- Make sure you have actual image files in `public/images/your-album/`
- Run `npm run scan` after adding images
- Check the console for errors

**EXIF not showing?**
- Some images don't have EXIF data (screenshots, heavily edited photos)
- Press `i` in the lightbox to toggle EXIF view

**Changes not appearing?**
- Re-run `npm run scan` after modifying images or metadata
- Refresh your browser

## 📚 More Info

See `README.md` for complete documentation including:
- Detailed feature list
- Customization options
- Optional enhancements
- Deployment guides

---

**Your gallery is ready! Start adding photos and enjoy! 📸**

