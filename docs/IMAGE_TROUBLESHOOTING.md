# Image Troubleshooting Guide

## Quick Diagnostic Checklist

Run these checks on your server to identify the issue:

### 1. Verify Images Were Generated

```bash
# Check if WebP files exist in public/photos/
ls -la public/photos/*/

# Should see files like:
# IMG_001-large.webp
# IMG_001-small.webp
# IMG_001-blur.webp
```

### 2. Verify Images Were Copied to dist/

```bash
# Check if images are in dist/photos/ after build
ls -la dist/photos/*/

# Vite automatically copies public/ to dist/ during build
```

### 3. Check JSON Paths

```bash
# Check a sample album JSON file
cat content/albums/your-album-slug.json | grep -A 5 '"path"'

# Paths should look like:
# "path": "photos/album-slug/IMG_001-large.webp"
# (no leading slash, no /public/ prefix)
```

### 4. Verify BASE_URL

Check browser console for image requests:
- Open DevTools → Network tab
- Look for failed image requests
- Check the URL being requested

Expected format: `http://yoursite.com/photos/album-slug/IMG_001-large.webp`

### 5. Check Server Configuration

Ensure your web server serves static files from `dist/`:

**Nginx example:**
```nginx
root /path/to/dist;
location / {
    try_files $uri $uri/ /index.html;
}
```

**Apache example:**
```apache
DocumentRoot /path/to/dist
```

## Common Issues & Solutions

### Issue 1: Images Not Generated

**Symptoms:** No `.webp` files in `public/photos/`

**Solution:**
```bash
# Check if source images exist
ls -la photo-source/originals/*/

# Re-run import with force flag
npm run import:photos -- --force
```

### Issue 2: Images Not in dist/

**Symptoms:** Images exist in `public/photos/` but not in `dist/photos/`

**Solution:**
```bash
# Rebuild - Vite copies public/ to dist/ automatically
npm run build

# Or manually copy if needed
cp -r public/photos dist/photos
```

### Issue 3: 404 Errors for Images

**Symptoms:** Browser shows 404 for image requests

**Check:**
1. Image paths in JSON are correct (no `/public/` prefix)
2. BASE_URL is set correctly (usually `/` for root)
3. Server is serving from `dist/` directory
4. File permissions are correct

**Solution:**
```bash
# Verify file permissions
chmod -R 755 dist/photos/

# Check if files are actually there
ls -la dist/photos/album-slug/
```

### Issue 4: Wrong Image Paths in JSON

**Symptoms:** Images exist but paths in JSON are incorrect

**Check JSON structure:**
```json
{
  "path": "photos/album-slug/IMG_001-large.webp",  // ✅ Correct
  "path": "/photos/album-slug/IMG_001-large.webp",  // ⚠️ May work but not ideal
  "path": "public/photos/album-slug/IMG_001-large.webp"  // ❌ Wrong
}
```

**Solution:** Re-run import script - it should generate correct paths

### Issue 5: BASE_URL Configuration

**Symptoms:** Images load with wrong URL

**Check vite.config.js:**
```javascript
export default defineConfig({
  base: '/',  // Should be '/' for root, or '/subfolder/' for subdirectory
  // ...
})
```

**For production with subdirectory:**
```javascript
base: '/your-subfolder/'
```

## Step-by-Step Debugging

1. **Check image generation:**
   ```bash
   npm run import:photos
   ls public/photos/
   ```

2. **Check build output:**
   ```bash
   npm run build
   ls dist/photos/
   ```

3. **Check JSON paths:**
   ```bash
   cat content/albums/your-album.json | jq '.photos[0].path'
   ```

4. **Check browser network tab:**
   - Open site in browser
   - DevTools → Network → Filter: Img
   - Check failed requests
   - Verify URL format

5. **Check server logs:**
   ```bash
   # Nginx
   tail -f /var/log/nginx/error.log
   
   # Apache
   tail -f /var/log/apache2/error.log
   ```

## Quick Fix Commands

```bash
# Full rebuild from scratch
npm run import:photos
npm run process:hero
npm run process:showcase
npm run build

# Verify structure
ls -R dist/ | grep -E "(photos|content)"

# Check one album's images
ls -la dist/photos/your-album-slug/
cat dist/content/albums/your-album-slug.json | grep path
```

## Expected File Structure

```
dist/
├── index.html
├── assets/
│   └── [bundled JS/CSS]
├── photos/                    # ✅ Images should be here
│   └── album-slug/
│       ├── IMG_001-large.webp
│       ├── IMG_001-small.webp
│       └── IMG_001-blur.webp
├── hero/                      # Hero images
├── showcase/                  # Showcase images
├── about/                     # About images
└── content/                   # JSON files
    ├── site/
    ├── albums.json
    └── albums/
        └── album-slug.json
```
