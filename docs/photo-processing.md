# Photo Processing Pipeline

## Overview

This document describes the automated photo processing pipeline that generates optimized WebP images for the photo portfolio website.

## Purpose

The processing script (`scripts/processPhotos.mjs`) reads high-resolution source photos and automatically generates three optimized variants for each image:

1. **Large** (Desktop) - 1800px longest side, 80% quality
2. **Small** (Mobile/Grid) - 800px longest side, 80% quality  
3. **Blur** (LQIP Placeholder) - 40px longest side, 40% quality

This ensures fast loading times across all devices while maintaining image quality.

## Directory Structure

### Input (Source Photos)

```
photo-source/originals/
├── arches/
│   ├── IMG_9041.JPG
│   ├── IMG_9048.JPG
│   └── ...
├── yosemite/
│   ├── IMG_8989.JPG
│   └── ...
└── death-valley/
    └── ...
```

### Output (Optimized WebP)

```
public/photos/
├── arches/
│   ├── IMG_9041-large.webp   (1800px, 80% quality)
│   ├── IMG_9041-small.webp   (800px, 80% quality)
│   ├── IMG_9041-blur.webp    (40px, 40% quality)
│   ├── IMG_9048-large.webp
│   ├── IMG_9048-small.webp
│   ├── IMG_9048-blur.webp
│   └── ...
├── yosemite/
│   ├── IMG_8989-large.webp
│   ├── IMG_8989-small.webp
│   ├── IMG_8989-blur.webp
│   └── ...
└── death-valley/
    └── ...
```

**Note**: The folder structure is preserved from input to output.

## Usage

### Basic Usage

Process all new/missing images:

```bash
npm run process:photos
```

This will:
- Find all images in `photo-source/originals/`
- Generate optimized WebP outputs in `public/photos/`
- Skip images that already have all three variants
- Print a summary of what was processed

### Force Reprocessing

Reprocess ALL images (overwrite existing):

```bash
npm run process:photos -- --force
```

Use this when you want to regenerate all outputs with new settings.

### Custom Directories

Override input/output directories:

```bash
# Custom input directory
npm run process:photos -- --input=my-photos/raw

# Custom output directory
npm run process:photos -- --output=dist/images

# Both
npm run process:photos -- --input=my-photos/raw --output=dist/images
```

### Help

```bash
npm run process:photos -- --help
```

## Supported Formats

The script processes the following image formats:
- `.jpg`, `.jpeg` - JPEG images
- `.png` - PNG images
- `.heic`, `.heif` - Apple HEIC format (iPhone photos)

Unsupported files are silently skipped.

## Output Specifications

### Large Variant (`-large.webp`)
- **Purpose**: Desktop displays, full-screen viewing
- **Max Size**: 1800px (longest side)
- **Quality**: 80%
- **Format**: WebP

### Small Variant (`-small.webp`)
- **Purpose**: Mobile devices, grid thumbnails
- **Max Size**: 800px (longest side)
- **Quality**: 80%
- **Format**: WebP

### Blur Variant (`-blur.webp`)
- **Purpose**: Low-Quality Image Placeholder (LQIP) for progressive loading
- **Max Size**: 40px (longest side)
- **Quality**: 40%
- **Format**: WebP
- **Usage**: Shows while main image loads (blur-up effect)

## Features

### Automatic Orientation
- Reads and respects EXIF orientation data
- Images are automatically rotated correctly
- No manual rotation needed

### Aspect Ratio Preservation
- All variants maintain original aspect ratio
- No cropping or distortion
- Images are only resized, never enlarged

### Idempotent Processing
- Safe to run multiple times
- Only processes missing outputs by default
- Use `--force` to intentionally reprocess

### Error Handling
- Continues processing if one image fails
- Logs errors clearly
- Non-zero exit code if any errors occurred

## Workflow

### 1. Add Source Photos

Place your original photos in the input directory:

```bash
photo-source/originals/new-album/
```

### 2. Run Processing

```bash
npm run process:photos
```

### 3. Update Album JSON

Manually update your album JSON files to reference the new processed images:

```json
{
  "slug": "new-album",
  "title": "New Album",
  "photos": [
    {
      "filename": "IMG_9041.JPG",
      "path": "photos/new-album/IMG_9041-large.webp",
      "pathSmall": "photos/new-album/IMG_9041-small.webp",
      "pathBlur": "photos/new-album/IMG_9041-blur.webp",
      "width": 4000,
      "height": 3000,
      "aspectRatio": 1.33
    }
  ]
}
```

**Note**: The processing script does NOT modify JSON files. You must update them manually.

### 4. Test in Browser

Run your dev server and verify the images load correctly:

```bash
npm run dev
```

## Integration with Image Optimization

The processed images work seamlessly with the image optimization system:

```jsx
import LazyImage from '../components/LazyImage';

<LazyImage
  src={photo.path}              // Large: photos/album/image-large.webp
  srcSmall={photo.pathSmall}    // Small: photos/album/image-small.webp
  placeholderSrc={photo.pathBlur} // Blur: photos/album/image-blur.webp
  alt={photo.filename}
  aspectRatio={photo.aspectRatio}
/>
```

The `LazyImage` component will:
- Show the blur placeholder immediately
- Load the appropriate size (small or large) based on viewport
- Fade smoothly from blur to full-resolution

## Performance Benefits

### File Size Comparison

Typical savings with WebP:

| Format | Size | Savings |
|--------|------|---------|
| Original JPEG (6000×4000) | 5-8 MB | - |
| Large WebP (1800px) | 200-400 KB | **95%** |
| Small WebP (800px) | 80-150 KB | **98%** |
| Blur WebP (40px) | 1-3 KB | **99.9%** |

### Load Time Improvement

| Screen Size | Before | After | Improvement |
|-------------|--------|-------|-------------|
| Mobile | 5-8 MB | 80-150 KB | **98% faster** |
| Desktop | 5-8 MB | 200-400 KB | **95% faster** |
| Initial (blur) | - | 1-3 KB | Instant |

## Troubleshooting

### "Input directory does not exist"

Create the input directory:
```bash
mkdir -p photo-source/originals
```

Then add your photos and run again.

### "Failed to create variant"

Check that:
- Source image is not corrupted
- File is a supported format
- You have write permissions to output directory

### Images rotated incorrectly

The script automatically handles EXIF orientation. If images are still wrong:
- Verify the source image has correct EXIF data
- Try processing with `--force` to regenerate

### Sharp installation issues on Windows

If Sharp fails to install, you may need to install Windows Build Tools:
```bash
npm install --global windows-build-tools
```

Then try installing Sharp again.

## Advanced Configuration

### Changing Output Sizes

Edit `scripts/processPhotos.mjs` and modify the `VARIANTS` config:

```javascript
VARIANTS: {
  large: {
    maxSize: 2400,  // Change from 1800
    quality: 85,    // Change from 80
    suffix: '-large'
  },
  // ... etc
}
```

Then reprocess with `--force`:
```bash
npm run process:photos -- --force
```

### Adding New Variants

Add a new variant to the config:

```javascript
VARIANTS: {
  large: { /* ... */ },
  small: { /* ... */ },
  blur: { /* ... */ },
  medium: {  // New variant
    maxSize: 1200,
    quality: 80,
    suffix: '-medium'
  }
}
```

## Future Enhancements

Potential improvements to consider:

- [ ] Automatically update album JSON files
- [ ] Generate blur-hash strings for placeholders
- [ ] AVIF format support (even smaller than WebP)
- [ ] Parallel processing for faster execution
- [ ] Watch mode for automatic processing on file changes
- [ ] Metadata extraction (dimensions, EXIF) for JSON generation

## Related Documentation

- **Image Optimization Guide**: `docs/image-optimization-guide.md`
- **Performance Audit**: `docs/image-performance-audit.md`
- **Quick Reference**: `docs/QUICK-REFERENCE.md`

---

**Last Updated**: December 10, 2025  
**Script Version**: 1.0.0



