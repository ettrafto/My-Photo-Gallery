# Build Pipeline

## Overview

The build pipeline transforms source images into optimized web assets and generates JSON manifests. All processing happens at build time - the production site is fully static.

## Main Build Command

```bash
npm run build
```

This executes:
1. `npm run import:photos` - Process album photos
2. `npm run process:hero` - Process hero images
3. `npm run process:showcase` - Process showcase images
4. `vite build` - Build React app
5. `node scripts/copy-content.mjs` - Copy content to dist

## Photo Import Pipeline (`scripts/importPhotos.mjs`)

### Input
- Source: `photo-source/originals/{album-name}/`
- Images: `.jpg`, `.jpeg`, `.png`, `.heic`, `.heif`
- Optional: `_album.json` metadata file

### Process

1. **Scan Albums**
   - Reads directories in `photo-source/originals/`
   - Filters to image files only
   - Skips files starting with `_`

2. **Process Each Image**
   ```
   For each image file:
     a. Read EXIF metadata (exifr)
        - Camera make/model
        - Lens, aperture, shutter, ISO, focal length
        - GPS coordinates (lat/lng)
        - Date taken, copyright, artist
     b. Generate WebP variants (Sharp)
        - large: max 1800px, quality 80
        - small: max 800px, quality 80
        - blur: max 40px, quality 40
     c. Handle HEIC/HEIF
        - Try Sharp native support first
        - Fallback to heic-convert if needed
     d. Auto-rotate based on EXIF orientation
   ```

3. **Generate Album JSON**
   - Creates/updates `content/albums/{slug}.json`
   - Preserves existing photo data (never overwrites manual edits)
   - Merges new photos with existing photos
   - Extracts tags from filenames and EXIF
   - Calculates date range from photo dates
   - Determines cover photo (first image or metadata override)

4. **Update Index**
   - Generates `content/albums.json` (summary of all albums)
   - Generates `content/map.json` (albums with GPS data for Globe)

### Output
- Images: `public/photos/{album-slug}/{filename}-{variant}.webp`
- JSON: `content/albums/{slug}.json` (full data)
- Index: `content/albums.json` (summary)
- Map: `content/map.json` (geo data)

### Data Preservation

The script **never overwrites** existing JSON data:
- Preserves manual EXIF edits
- Preserves custom tags, descriptions, dates
- Only updates image paths and dimensions
- Merges new photos with existing photos

## Hero Processing (`scripts/processHero.mjs`)

### Input
- Source: `photo-source/originals/config/hero/`
- Optional: `_hero.json` for metadata

### Process
1. Process images (same as importPhotos)
2. Extract EXIF data
3. Update `content/site/site.json` → `hero.images[]`
4. Preserves existing order and captions

### Output
- Images: `public/hero/{filename}-{variant}.webp`
- Config: `content/site/site.json` (hero.images array)

## Showcase Processing (`scripts/processShowcase.mjs`)

### Input
- Source: `photo-source/originals/config/showcase/`
- Optional: `_showcase.json` for location metadata

### Process
1. Process images
2. Determine type (landscape/portrait) from aspect ratio
3. Alternate left/right sides automatically
4. Extract location from metadata or EXIF GPS
5. Update `content/site/showcase.json`

### Output
- Images: `public/photos/showcase/{filename}-{variant}.webp`
- Config: `content/site/showcase.json` (images array)

## About Processing (`scripts/processAbout.mjs`)

### Input
- Source: `photo-source/originals/config/about/`
- Optional: `_about.json` for metadata

### Process
1. Process images
2. Extract EXIF for captions
3. Update `content/site/about.json`

### Output
- Images: `public/about/{filename}-{variant}.webp`
- Config: `content/site/about.json` (images array)

## Index Rebuild (`scripts/rebuildAlbumsIndex.mjs`)

### Purpose
Rebuilds `albums.json` and `map.json` from individual album files.

### Process
1. Reads all `content/albums/{slug}.json` files
2. Extracts summary fields (excludes photos array)
3. Preserves manual geo data from existing `albums.json`
4. Generates `content/albums.json` (index)
5. Generates `content/map.json` (albums with GPS for Globe)

### Data Preservation
- Preserves `primaryLocation` if manually set in `albums.json`
- Preserves `isFavorite` status
- Syncs `isFavorite` back to individual album files

## Content Copy (`scripts/copy-content.mjs`)

### Purpose
Copies `content/` directory to `dist/content/` after Vite build.

### Process
1. Recursively copies `content/` to `dist/content/`
2. Ensures JSON files are available at runtime
3. Runs automatically in build script

## Build Output

After `npm run build`, `dist/` contains:

```
dist/
├── index.html
├── assets/
│   ├── index-[hash].js
│   ├── index-[hash].css
│   ├── react-vendor-[hash].js
│   ├── animation-[hash].js
│   ├── map-[hash].js
│   └── viz-[hash].js
├── photos/              # Processed images
│   └── {album-slug}/
├── hero/                # Hero images
├── showcase/            # Showcase images
├── about/               # About images
└── content/             # JSON files (copied)
    ├── site/
    ├── albums.json
    ├── albums/
    ├── trips/
    └── map.json
```

## Incremental Processing

All scripts support incremental processing:
- Skips existing WebP files unless `--force` flag
- Only processes new or changed images
- Fast rebuilds when adding new photos

## Error Handling

- Missing EXIF: Falls back gracefully, continues processing
- Invalid images: Logs warning, skips file
- JSON errors: Preserves existing data, merges safely
