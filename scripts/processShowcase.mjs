#!/usr/bin/env node

/**
 * Showcase Processing Pipeline
 *
 * Usage:
 *   npm run process:showcase            # Process showcase images
 *   npm run process:showcase -- --force  # Reprocess all images
 *
 * What it does:
 *   1) Reads originals from photo-source/originals/config/showcase/
 *   2) Generates WebP variants to public/photos/showcase/:
 *        -large.webp (1800px), -small.webp (800px), -blur.webp (40px)
 *   3) Extracts EXIF data (camera, lens, aperture, shutter, ISO, focal length, date)
 *   4) Extracts location from metadata file or EXIF GPS (if available)
 *   5) Builds/updates content/site/showcase.json with:
 *        - Images with type, side, src paths, dimensions, EXIF data, and location
 *
 * Notes:
 *   - Processes all images in photo-source/originals/config/showcase/ (unlimited number)
 *   - Determines image type from aspect ratio
 *   - Alternates left/right sides automatically
 *   - Location can be configured via _showcase.json metadata file:
 *        { "locations": { "IMG_9041.JPG": "Zion National Park", "1": "Bryce Canyon" } }
 */

import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';
import sharp from 'sharp';
import exifr from 'exifr';
import heicConvert from 'heic-convert';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const CONFIG = {
  INPUT_DIR: 'photo-source/originals/config/showcase',
  OUTPUT_DIR: 'public/photos/showcase',
  CONTENT_DIR: 'content',
  SHOWCASE_CONFIG: 'content/site/showcase.json',
  METADATA_FILE: 'photo-source/originals/config/showcase/_showcase.json',
  SUPPORTED_FORMATS: ['.jpg', '.jpeg', '.png', '.heic', '.heif'],
  VARIANTS: {
    large: { maxSize: 1800, quality: 80, suffix: '-large' },
    small: { maxSize: 800, quality: 80, suffix: '-small' },
    blur: { maxSize: 40, quality: 40, suffix: '-blur' }
  }
};

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    force: false
  };

  for (const arg of args) {
    if (arg === '--force') options.force = true;
  }

  return options;
}

function toWebPath(p) {
  return p.replace(/\\/g, '/');
}

function isHeicLike(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return ext === '.heic' || ext === '.heif';
}

async function getSharpInput(imagePath) {
  if (!isHeicLike(imagePath)) {
    return { input: imagePath, source: 'path' };
  }

  const heicBuffer = await fsp.readFile(imagePath);
  try {
    await sharp(heicBuffer)
      .rotate()
      .resize(1, 1, { fit: 'inside', withoutEnlargement: true })
      .toBuffer();
    return { input: heicBuffer, source: 'buffer' };
  } catch {
    const jpegBuffer = await heicConvert({
      buffer: heicBuffer,
      format: 'JPEG',
      quality: 1.0
    });
    return { input: jpegBuffer, source: 'buffer', note: 'converted from HEIC' };
  }
}

/**
 * Determine image type from aspect ratio
 * Refined thresholds for better classification:
 * - Landscape: > 1.25 (wider than 5:4)
 * - Portrait: < 0.8 (taller than 5:4)
 * - Square: between 0.8 and 1.25
 */
function getImageType(width, height) {
  const aspectRatio = width / height;
  
  if (aspectRatio > 1.25) {
    return 'landscape';
  } else if (aspectRatio < 0.8) {
    return 'portrait';
  } else {
    return 'square';
  }
}

/**
 * Format shutter speed from decimal to fraction
 */
function formatShutterSpeed(speed) {
  if (!speed) return null;
  if (speed >= 1) {
    return `${speed}s`;
  }
  const frac = Math.round(1 / speed);
  return `1/${frac}s`;
}

/**
 * Get image metadata (dimensions and EXIF) efficiently
 * Returns both dimensions and EXIF data in one pass
 * Reuses Sharp input to avoid duplicate file reads (important for HEIC files)
 */
async function getImageMetadata(imagePath) {
  try {
    const sharpInput = await getSharpInput(imagePath);
    const image = sharp(sharpInput.input);
    
    // Get dimensions and EXIF in parallel
    const [metadata, exifData] = await Promise.all([
      image.metadata(),
      exifr.parse(imagePath, {
        pick: [
          'Make',
          'Model',
          'LensModel',
          'FNumber',
          'ExposureTime',
          'ISO',
          'DateTimeOriginal',
          'FocalLength',
          'Copyright',
          'Artist',
          'ImageDescription',
          'latitude',
          'longitude',
          'GPSLatitude',
          'GPSLongitude',
          'GPSLatitudeRef',
          'GPSLongitudeRef'
        ]
      }).catch(() => ({})) // Ignore EXIF errors
    ]);

    // Format EXIF data similar to importPhotos.mjs
    const formattedExif = {
      camera: exifData.Make && exifData.Model ? `${exifData.Make} ${exifData.Model}` : null,
      lens: exifData.LensModel || null,
      aperture: exifData.FNumber ? `f/${exifData.FNumber}` : null,
      shutterSpeed: exifData.ExposureTime ? formatShutterSpeed(exifData.ExposureTime) : null,
      iso: exifData.ISO || null,
      focalLength: exifData.FocalLength ? `${Math.round(exifData.FocalLength)}mm` : null,
      dateTaken: exifData.DateTimeOriginal || null,
      copyright: exifData.Copyright || null,
      artist: exifData.Artist || null,
      description: exifData.ImageDescription || null
    };

    // Extract GPS coordinates for location (optional, can also be set manually)
    let location = null;
    if (typeof exifData.latitude === 'number' && typeof exifData.longitude === 'number') {
      // Already in decimal format - location name would need to come from metadata file
    } else if (exifData.GPSLatitude && exifData.GPSLongitude) {
      // GPS coordinates available but location name would still need to come from metadata
    }

    return {
      width: metadata.width,
      height: metadata.height,
      aspectRatio: metadata.width / metadata.height,
      sharpInput, // Return the input for reuse
      exif: formattedExif,
      location: location // Will be overridden by metadata file if available
    };
  } catch (error) {
    console.error(`  ⚠️  Could not read metadata for ${imagePath}: ${error.message}`);
    return {
      width: 1600,
      height: 900,
      aspectRatio: 16/9,
      sharpInput: null,
      exif: {},
      location: null
    };
  }
}

/**
 * Process a single showcase image efficiently
 * Reuses Sharp input to avoid duplicate file reads
 */
async function processShowcaseImage(imageFile, index, force = false, metadata = {}) {
  const inputPath = path.join(ROOT, CONFIG.INPUT_DIR, imageFile);
  const outputDir = path.join(ROOT, CONFIG.OUTPUT_DIR);
  
  if (!existsSync(inputPath)) {
    console.error(`  ❌ Source file not found: ${imageFile}`);
    return null;
  }

  await fsp.mkdir(outputDir, { recursive: true });

  const baseName = path.parse(imageFile).name;

  try {
    console.log(`  🔄 Processing: ${imageFile}`);

    // Get metadata (dimensions + EXIF) and Sharp input in one pass
    const imageMetadata = await getImageMetadata(inputPath);
    
    if (!imageMetadata.sharpInput) {
      throw new Error('Failed to load image input');
    }

    const { width, height, aspectRatio, sharpInput, exif, location: exifLocation } = imageMetadata;
    const imageType = getImageType(width, height);

    // Get location from metadata file (by filename or index 1-based) or use EXIF-derived location
    const locations = metadata.locations || {};
    const location = locations[imageFile] || locations[baseName] || locations[index + 1] || exifLocation || null;

    // Check which variants need processing (skip existing unless force)
    const variantsToProcess = [];
    for (const [variantName, config] of Object.entries(CONFIG.VARIANTS)) {
      const outputPath = path.join(outputDir, `${baseName}${config.suffix}.webp`);
      if (force || !existsSync(outputPath)) {
        variantsToProcess.push({ variantName, config, outputPath });
      }
    }

    // Process all variants in parallel
    const variantResults = await Promise.all(
      variantsToProcess.map(async ({ variantName, config, outputPath }) => {
        try {
          // Use the cached Sharp input
          await sharp(sharpInput.input)
            .rotate() // Auto-rotate based on EXIF
            .resize(config.maxSize, config.maxSize, {
              fit: 'inside',
              withoutEnlargement: true
            })
            .webp({ 
              quality: config.quality,
              effort: 4 // Balance between quality and speed (0-6, 4 is good default)
            })
            .toFile(outputPath);
          
          return { variant: variantName, success: true, skipped: false };
        } catch (error) {
          console.error(`    ❌ Failed ${variantName}: ${error.message}`);
          return { variant: variantName, success: false, error };
        }
      })
    );

    // Check results
    const allSucceeded = variantResults.length === 0 || variantResults.every(r => r.success);
    const skippedCount = Object.keys(CONFIG.VARIANTS).length - variantsToProcess.length;
    
    if (allSucceeded) {
      if (skippedCount > 0) {
        console.log(`    ✅ Variants ready (${skippedCount} skipped, ${variantsToProcess.length} created)`);
      } else {
        console.log(`    ✅ Created all variants for ${baseName}`);
      }
    }

    // Determine side (alternate left/right)
    const side = index % 2 === 0 ? 'left' : 'right';

    // Get alt text from EXIF or use default
    const altText = exif?.description || `Showcase image ${index + 1}`;

    // Only include exif if it has any meaningful data
    const hasExifData = exif && (
      exif.camera || exif.lens || exif.aperture || exif.shutterSpeed || 
      exif.iso || exif.focalLength || exif.dateTaken
    );

    return {
      id: index + 1,
      filename: imageFile, // Include filename for matching
      type: imageType,
      side: side,
      src: `/photos/showcase/${baseName}-large.webp`,
      alt: altText,
      label: null,
      location: location,
      exif: hasExifData ? exif : undefined,
      dimensions: { width, height, aspectRatio }
    };
  } catch (error) {
    console.error(`  ❌ ERROR processing ${imageFile}: ${error.message}`);
    return null;
  }
}

/**
 * Load metadata file if it exists
 * Supports:
 * - locations: Object mapping image filename or index (1-based) to location name
 *   Example: { "locations": { "IMG_9041.JPG": "Zion National Park", "1": "Bryce Canyon" } }
 */
async function loadMetadata() {
  const metadataPath = path.join(ROOT, CONFIG.METADATA_FILE);
  if (!existsSync(metadataPath)) {
    return { locations: {} };
  }

  try {
    const content = await fsp.readFile(metadataPath, 'utf-8');
    const metadata = JSON.parse(content);
    return {
      locations: metadata.locations || {}
    };
  } catch (error) {
    console.warn(`  ⚠️  Could not load metadata file: ${error.message}`);
    return { locations: {} };
  }
}

/**
 * Load existing showcase config if it exists
 */
async function loadExistingShowcaseConfig() {
  const configPath = path.join(ROOT, CONFIG.SHOWCASE_CONFIG);
  if (!existsSync(configPath)) {
    return { images: [] };
  }

  try {
    const content = await fsp.readFile(configPath, 'utf-8');
    const config = JSON.parse(content);
    return config.images ? config : { images: [] };
  } catch (error) {
    console.warn(`  ⚠️  Could not load existing showcase config: ${error.message}`);
    return { images: [] };
  }
}

/**
 * Extract base name from src path for matching
 */
function extractBaseNameFromSrc(src) {
  if (!src) return null;
  const match = src.match(/\/([^/]+)-large\.webp$/);
  return match ? match[1] : null;
}

/**
 * Extract base name from filename for matching
 */
function extractBaseNameFromFilename(filename) {
  if (!filename) return null;
  return path.parse(filename).name;
}

/**
 * Write showcase.json configuration, preserving existing data
 */
async function writeShowcaseConfig(processedImages, existingConfig, metadata) {
  const configPath = path.join(ROOT, CONFIG.SHOWCASE_CONFIG);
  const configDir = path.dirname(configPath);
  
  await fsp.mkdir(configDir, { recursive: true });

  const existingImages = existingConfig.images || [];
  const newImages = processedImages.filter(img => img !== null);
  
  // Create a map of existing images by base name for quick lookup
  const existingByBaseName = new Map();
  for (const existing of existingImages) {
    const baseName = extractBaseNameFromSrc(existing.src) || extractBaseNameFromFilename(existing.filename);
    if (baseName) {
      existingByBaseName.set(baseName.toLowerCase(), existing);
    }
  }
  
  // Merge processed images with existing config data
  const mergedImages = [];
  const processedBaseNames = new Set();
  
  // First, preserve existing images in their original order
  // Update them if we have new processed data, otherwise keep as-is
  for (const existing of existingImages) {
    const baseName = extractBaseNameFromSrc(existing.src) || extractBaseNameFromFilename(existing.filename);
    const baseNameKey = baseName ? baseName.toLowerCase() : null;
    
    if (baseNameKey) {
      const processed = newImages.find(img => {
        const imgBaseName = extractBaseNameFromSrc(img.src) || extractBaseNameFromFilename(img.filename);
        return imgBaseName && imgBaseName.toLowerCase() === baseNameKey;
      });
      
      if (processed) {
        // Merge: preserve existing custom fields, update paths/dimensions/exif
        mergedImages.push({
          ...existing, // Preserve all existing fields (order, side, location, label, alt, etc.)
          src: processed.src, // Update image path
          dimensions: processed.dimensions, // Update dimensions
          exif: processed.exif, // Update EXIF from image
          type: processed.type // Update type from dimensions
        });
        processedBaseNames.add(baseNameKey);
      } else {
        // Image exists in config but not in source - preserve it (might be removed from source but user wants to keep)
        mergedImages.push(existing);
      }
    } else {
      // Can't match - preserve as-is
      mergedImages.push(existing);
    }
  }
  
  // Add new images that don't exist in config
  for (const newImage of newImages) {
    const baseName = extractBaseNameFromSrc(newImage.src) || extractBaseNameFromFilename(newImage.filename);
    const baseNameKey = baseName ? baseName.toLowerCase() : null;
    
    if (baseNameKey && !processedBaseNames.has(baseNameKey)) {
      // Assign order based on highest existing order + 1
      const maxOrder = mergedImages.length > 0 
        ? Math.max(...mergedImages.map(img => img.order || 0), 0)
        : 0;
      mergedImages.push({
        ...newImage,
        order: maxOrder + 1
      });
      processedBaseNames.add(baseNameKey);
    }
  }

  const config = {
    images: mergedImages
  };

  await fsp.writeFile(configPath, JSON.stringify(config, null, 2));
  console.log(`  ✅ Updated ${configPath}`);
  console.log(`     - ${mergedImages.length} images (preserved existing data, updated image paths)`);
}

/**
 * Main processing function
 */
async function main() {
  console.log('');
  console.log('🎨 Showcase Processing Pipeline');
  console.log('━'.repeat(60));
  console.log('');

  const options = parseArgs();
  const inputDir = path.join(ROOT, CONFIG.INPUT_DIR);

  if (!existsSync(inputDir)) {
    console.error(`❌ ERROR: Input directory does not exist: ${inputDir}`);
    console.error('   Please create photo-source/originals/config/showcase/ and add your images');
    process.exit(1);
  }

  // Find all image files
  console.log('🔍 Discovering images...');
  const files = await fsp.readdir(inputDir);
  const imageFiles = files.filter(file => {
    const ext = path.extname(file).toLowerCase();
    return CONFIG.SUPPORTED_FORMATS.includes(ext) && !file.startsWith('_');
  }).sort();

  if (imageFiles.length === 0) {
    console.error('❌ No images found in photo-source/originals/config/showcase/');
    console.error(`   Supported formats: ${CONFIG.SUPPORTED_FORMATS.join(', ')}`);
    process.exit(1);
  }

  console.log(`   Found ${imageFiles.length} image(s) to process`);
  console.log('');

  // Load metadata if available
  const metadata = await loadMetadata();
  
  // Load existing config to preserve custom data
  const existingConfig = await loadExistingShowcaseConfig();

  // Process images in parallel with concurrency limit
  console.log('🔄 Processing images...');
  console.log('');
  
  // Process images in batches to avoid overwhelming the system
  // Concurrency limit balances speed with memory usage
  const CONCURRENCY_LIMIT = 3; // Process 3 images at a time
  const images = [];
  let processedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < imageFiles.length; i += CONCURRENCY_LIMIT) {
    const batch = imageFiles.slice(i, i + CONCURRENCY_LIMIT);
    const batchIndex = i;
    
    console.log(`📦 Processing batch ${Math.floor(i / CONCURRENCY_LIMIT) + 1}/${Math.ceil(imageFiles.length / CONCURRENCY_LIMIT)} (${batch.length} image(s))...`);
    
    const batchPromises = batch.map((imageFile, idx) => 
      processShowcaseImage(imageFile, batchIndex + idx, options.force, metadata)
    );
    
    const batchResults = await Promise.all(batchPromises);
    
    for (const imageData of batchResults) {
      if (imageData) {
        images.push(imageData);
        processedCount++;
      } else {
        errorCount++;
      }
    }
    
    // Check for skipped files (already processed)
    for (const imageFile of batch) {
      const baseName = path.parse(imageFile).name;
      const outputDir = path.join(ROOT, CONFIG.OUTPUT_DIR);
      const allVariantsExist = Object.values(CONFIG.VARIANTS).every(config => {
        const outputPath = path.join(outputDir, `${baseName}${config.suffix}.webp`);
        return existsSync(outputPath);
      });
      if (allVariantsExist && !options.force) {
        skippedCount++;
      }
    }
    
    console.log(''); // Blank line between batches
  }
  
  // Summary
  if (processedCount > 0 || skippedCount > 0) {
    console.log(`📊 Summary: ${processedCount} processed, ${skippedCount} skipped, ${errorCount} errors`);
    console.log('');
  }

  if (images.length === 0) {
    console.error('❌ No images were successfully processed');
    process.exit(1);
  }

  // Generate showcase.json, preserving existing data
  console.log('📝 Updating showcase.json...');
  await writeShowcaseConfig(images, existingConfig, metadata);

  console.log('');
  console.log('✅ Showcase processing complete!');
  console.log(`   Images: ${images.length} configured`);
  console.log(`   Config: ${CONFIG.SHOWCASE_CONFIG}`);
  console.log(`   Output: ${CONFIG.OUTPUT_DIR}`);
  console.log('');
}

main().catch(error => {
  console.error('');
  console.error('❌ Fatal error:', error);
  console.error('');
  process.exit(1);
});

