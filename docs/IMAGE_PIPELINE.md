# Image Pipeline

## Overview

The image processing pipeline transforms source images into optimized WebP variants and extracts metadata at build time. All processing happens before deployment - the production site serves only static, pre-processed images.

**Flow:**
```
Source Images (photo-source/originals/)
    ↓
Processing Scripts (scripts/*.mjs)
    ↓
WebP Variants (public/photos/)
    ↓
JSON Manifests (content/)
```

## Supported Formats

### Input Formats
- `.jpg`, `.jpeg` - Standard JPEG images
- `.png` - PNG images
- `.heic`, `.heif` - Apple HEIC/HEIF format (with conversion)

### Output Format
- `.webp` only - All images are converted to WebP for optimal web performance

### HEIC/HEIF Handling

HEIC/HEIF files require special handling:

1. **Try Sharp Native Support First**
   - Tests Sharp's ability to decode HEIC by attempting a 1x1 resize
   - If successful, uses Sharp directly with the file path

2. **Fallback to heic-convert**
   - If Sharp cannot decode, reads the HEIC file into a buffer
   - Converts to JPEG buffer using `heic-convert` library
   - Passes the JPEG buffer to Sharp for processing

3. **Auto-Rotation**
   - All variants are auto-rotated based on EXIF orientation data
   - Ensures correct display regardless of camera orientation

## Image Variants

Three variants are generated for each source image:

| Variant | Max Size | Quality | Suffix | Use Case |
|---------|----------|---------|--------|----------|
| **Large** | 1800px | 80 | `-large.webp` | Full-size display, lightbox |
| **Small** | 800px | 80 | `-small.webp` | Thumbnails, grid views |
| **Blur** | 40px | 40 | `-blur.webp` | Blur-up placeholders, lazy loading |

### Processing Parameters

All variants use:
- **Fit**: `inside` - Maintains aspect ratio, fits within max dimensions
- **Enlargement**: `withoutEnlargement: true` - Never upscales small images
- **Rotation**: Auto-rotates based on EXIF orientation
- **Format**: WebP with specified quality

### Example Output

For source image `IMG_001.jpg`:
```
public/photos/album-slug/
  ├── IMG_001-large.webp  (max 1800px)
  ├── IMG_001-small.webp  (max 800px)
  └── IMG_001-blur.webp  (max 40px)
```

## EXIF Extraction

Metadata is extracted using the `exifr` library with specific field picks:

### Camera Metadata
- **Make** + **Model** → Combined as `camera` string (e.g., "Canon EOS R5")
- **LensModel** → `lens` string (e.g., "RF 24-70mm f/2.8")

### Exposure Settings
- **FNumber** → `aperture` (e.g., "f/8")
- **ExposureTime** → `shutterSpeed` (formatted as "1/250s" or "2s")
- **ISO** → `iso` (number)
- **FocalLength** → `focalLength` (e.g., "50mm", rounded)

### GPS Coordinates
- **latitude/longitude** (decimal) → `lat`, `lng`
- **GPSLatitude/GPSLongitude** (DMS format) → Converted to decimal
- **GPSLatitudeRef/GPSLongitudeRef** → Handles 'N'/'S' and 'E'/'W' signs

### Dates
- **DateTimeOriginal** → `dateTaken` (ISO string)

### Copyright/Artist
- **Copyright** → `copyright` (string or null)
- **Artist** → `artist` (string or null)
- **ImageDescription** → `description` (string or null)

### Shutter Speed Formatting

Shutter speeds are formatted intelligently:
- `>= 1 second`: `"2s"`, `"5s"`
- `< 1 second`: `"1/250s"`, `"1/8000s"`

## Processing Workflow

```
Source Image (JPEG/PNG/HEIC)
    ↓
Detect Format (isHeicLike)
    ↓
getSharpInput()
    ├─→ JPEG/PNG: Return file path
    └─→ HEIC: Convert to buffer or use path
    ↓
Parallel Processing:
    ├─→ Sharp Metadata (width, height)
    └─→ EXIF Extraction (exifr)
    ↓
Generate Variants (large, small, blur)
    ├─→ Auto-rotate
    ├─→ Resize (fit: inside)
    └─→ Convert to WebP
    ↓
Build JSON Manifest Entry
    ├─→ Paths (path, pathLarge, pathSmall, pathBlur)
    ├─→ Dimensions (width, height, aspectRatio)
    ├─→ GPS (lat, lng)
    └─→ EXIF (camera, lens, aperture, etc.)
```

## Path Generation

### Input Paths
```
photo-source/originals/{album-name}/IMG_001.jpg
photo-source/originals/config/hero/hero-1.jpg
photo-source/originals/config/showcase/IMG_4062.jpg
photo-source/originals/config/about/portrait.jpg
```

### Output Paths
```
public/photos/{album-slug}/IMG_001-{variant}.webp
public/hero/hero-1-{variant}.webp
public/photos/showcase/IMG_4062-{variant}.webp
public/about/portrait-{variant}.webp
```

### Web Paths
- All paths in JSON use forward slashes only (`toWebPath()`)
- Paths are relative to site root (start with `/`)
- Example: `photos/album-slug/IMG_001-large.webp`

### Slug Generation
- Album names are slugified: `"My Album"` → `"my-album"`
- Uses `slugify` library with `lower: true, strict: true`

## Incremental Processing

The pipeline supports incremental processing for fast rebuilds:

### Skip Existing Files
- Checks if WebP variants already exist
- Skips generation unless `--force` flag is provided
- Only processes new or changed images

### Preserve JSON Data
- Loads existing album JSON before processing
- Merges new photo data with existing photos
- Preserves manual edits (custom EXIF, tags, descriptions)
- Matches photos by filename or path

### Force Reprocessing
```bash
npm run import:photos -- --force
```
Forces regeneration of all WebP variants, useful after:
- Changing variant sizes/quality in config
- Fixing image processing bugs
- Updating Sharp or heic-convert libraries

## Error Handling

### Missing EXIF
- Falls back gracefully to `null` values
- Continues processing without metadata
- Logs warnings for debugging

### Invalid Images
- Logs error message with filename
- Skips the file and continues processing
- Does not crash the entire pipeline

### HEIC Conversion Failures
- Logs error with specific failure reason
- Continues with next image
- May indicate missing system dependencies

### JSON Parsing Errors
- Warns but continues processing
- Preserves existing JSON structure
- Allows manual fixes to JSON files

## Processing Scripts

### `scripts/importPhotos.mjs`
**Main album photo pipeline**

- **Input**: `photo-source/originals/{album}/`
- **Output**: `public/photos/{album-slug}/`
- **JSON**: `content/albums/{slug}.json`
- **Features**:
  - Processes all images in album folders
  - Generates all three variants
  - Extracts full EXIF data
  - Updates album JSON with photo data
  - Preserves existing photo metadata

### `scripts/processHero.mjs`
**Hero section images**

- **Input**: `photo-source/originals/config/hero/`
- **Output**: `public/hero/`
- **JSON**: `content/site/site.json` → `hero.images[]`
- **Features**:
  - Processes hero images
  - Extracts EXIF for captions
  - Preserves existing order and alt text

### `scripts/processShowcase.mjs`
**Showcase images**

- **Input**: `photo-source/originals/config/showcase/`
- **Output**: `public/photos/showcase/`
- **JSON**: `content/site/showcase.json`
- **Features**:
  - Determines type (landscape/portrait) from aspect ratio
  - Alternates left/right sides automatically
  - Extracts location from metadata or EXIF GPS
  - Full EXIF extraction

### `scripts/processAbout.mjs`
**About page images**

- **Input**: `photo-source/originals/config/about/`
- **Output**: `public/about/`
- **JSON**: `content/site/about.json`
- **Features**:
  - Processes about page images
  - Preserves alt text and captions
  - Updates JSON with processed paths

## Configuration

All scripts use a shared `CONFIG` object:

```javascript
{
  VARIANTS: {
    large: { maxSize: 1800, quality: 80, suffix: '-large' },
    small: { maxSize: 800, quality: 80, suffix: '-small' },
    blur: { maxSize: 40, quality: 40, suffix: '-blur' }
  },
  SUPPORTED_FORMATS: ['.jpg', '.jpeg', '.png', '.heic', '.heif']
}
```

To change variant sizes or quality, update the `CONFIG.VARIANTS` object in each script.

## Dependencies

- **sharp** - Image processing (resize, convert, rotate)
- **exifr** - EXIF metadata extraction
- **heic-convert** - HEIC/HEIF to JPEG conversion (fallback)
- **slugify** - Album name slugification
