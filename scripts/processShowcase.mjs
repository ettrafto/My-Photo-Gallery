#!/usr/bin/env node

/**
 * Showcase Processing Pipeline
 *
 * Usage:
 *   npm run process:showcase            # Process showcase images
 *   npm run process:showcase -- --force  # Reprocess all images
 *
 * What it does:
 *   1) Reads originals from photo-source/showcase/
 *   2) Generates WebP variants to public/photos/showcase/:
 *        -large.webp (1800px), -small.webp (800px), -blur.webp (40px)
 *   3) Builds/updates content/site/showcase.json with:
 *        - 12 images with type (landscape/portrait/square), side (left/right), src paths
 *        - 6 callouts (location text) positioned between images
 *
 * Notes:
 *   - Assumes exactly 12 images in photo-source/showcase/
 *   - Determines image type from aspect ratio
 *   - Alternates left/right sides automatically
 *   - Callouts can be configured via _showcase.json metadata file
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
  INPUT_DIR: 'photo-source/showcase',
  OUTPUT_DIR: 'public/photos/showcase',
  CONTENT_DIR: 'content',
  SHOWCASE_CONFIG: 'content/site/showcase.json',
  METADATA_FILE: 'photo-source/showcase/_showcase.json',
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
        pick: ['ImageDescription', 'DateTimeOriginal']
      }).catch(() => ({})) // Ignore EXIF errors
    ]);

    return {
      width: metadata.width,
      height: metadata.height,
      aspectRatio: metadata.width / metadata.height,
      sharpInput, // Return the input for reuse
      exif: exifData
    };
  } catch (error) {
    console.error(`  ⚠️  Could not read metadata for ${imagePath}: ${error.message}`);
    return {
      width: 1600,
      height: 900,
      aspectRatio: 16/9,
      sharpInput: null,
      exif: {}
    };
  }
}

/**
 * Process a single showcase image efficiently
 * Reuses Sharp input to avoid duplicate file reads
 */
async function processShowcaseImage(imageFile, index, force = false) {
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

    const { width, height, aspectRatio, sharpInput, exif } = imageMetadata;
    const imageType = getImageType(width, height);

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
    const altText = exif?.ImageDescription || `Showcase image ${index + 1}`;

    return {
      id: index + 1,
      type: imageType,
      side: side,
      src: `/photos/showcase/${baseName}-large.webp`,
      alt: altText,
      label: null,
      dimensions: { width, height, aspectRatio }
    };
  } catch (error) {
    console.error(`  ❌ ERROR processing ${imageFile}: ${error.message}`);
    return null;
  }
}

/**
 * Load metadata file if it exists
 */
async function loadMetadata() {
  const metadataPath = path.join(ROOT, CONFIG.METADATA_FILE);
  if (!existsSync(metadataPath)) {
    return { callouts: null };
  }

  try {
    const content = await fsp.readFile(metadataPath, 'utf-8');
    const metadata = JSON.parse(content);
    return metadata;
  } catch (error) {
    console.warn(`  ⚠️  Could not load metadata file: ${error.message}`);
    return { callouts: null };
  }
}

/**
 * Generate default callouts based on image positions
 * For 12 images, place 6 callouts at strategic positions
 */
function generateDefaultCallouts(imageCount) {
  // Place callouts at strategic positions: before images 1, 3, 5, 7, 9, 11
  const calloutPositions = [1, 3, 5, 7, 9, 11];
  const defaultLocations = [
    'Costa Brava',
    'Bryce Canyon',
    'Arches',
    'Zion',
    'Acadia',
    'White Mountains'
  ];

  // Ensure we have enough locations (pad if needed)
  const locations = defaultLocations.slice(0, Math.min(calloutPositions.length, imageCount / 2));
  while (locations.length < calloutPositions.length) {
    locations.push(`Location ${locations.length + 1}`);
  }

  return calloutPositions.slice(0, Math.min(calloutPositions.length, Math.floor(imageCount / 2))).map((targetId, idx) => ({
    id: `callout${idx + 1}`,
    text: locations[idx] || `Location ${idx + 1}`,
    position: idx % 2 === 0 ? 'before' : 'after',
    targetId: targetId
  }));
}

/**
 * Write showcase.json configuration
 */
async function writeShowcaseConfig(images, metadata) {
  const configPath = path.join(ROOT, CONFIG.SHOWCASE_CONFIG);
  const configDir = path.dirname(configPath);
  
  await fsp.mkdir(configDir, { recursive: true });

  // Use callouts from metadata if available, otherwise generate defaults
  const callouts = metadata.callouts || generateDefaultCallouts(images.length);

  const config = {
    images: images.filter(img => img !== null),
    callouts: callouts
  };

  await fsp.writeFile(configPath, JSON.stringify(config, null, 2));
  console.log(`  ✅ Generated ${configPath}`);
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
    console.error('   Please create photo-source/showcase/ and add your 12 images');
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
    console.error('❌ No images found in photo-source/showcase/');
    console.error(`   Supported formats: ${CONFIG.SUPPORTED_FORMATS.join(', ')}`);
    process.exit(1);
  }

  if (imageFiles.length < 12) {
    console.warn(`⚠️  Expected 12 images, found ${imageFiles.length}`);
    console.warn('   Processing all found images...');
  } else if (imageFiles.length > 12) {
    console.warn(`⚠️  Expected 12 images, found ${imageFiles.length}`);
    console.warn('   Processing first 12 images only...');
    imageFiles.splice(12);
  }

  console.log(`   Found ${imageFiles.length} image(s)`);
  console.log('');

  // Load metadata if available
  const metadata = await loadMetadata();

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
      processShowcaseImage(imageFile, batchIndex + idx, options.force)
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

  // Generate showcase.json
  console.log('📝 Generating showcase.json...');
  await writeShowcaseConfig(images, metadata);

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

