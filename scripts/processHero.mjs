#!/usr/bin/env node

/**
 * Hero Photo Processing Pipeline
 *
 * Usage:
 *   npm run process:hero            # Process hero images
 *   npm run process:hero -- --force  # Reprocess all images
 *
 * What it does:
 *   1) Reads originals from photo-source/originals/config/hero/
 *   2) Generates WebP variants to public/hero/:
 *        -large.webp (1800px), -small.webp (800px), -blur.webp (40px)
 *   3) Builds/updates content/site/site.json with:
 *        - Processed image paths in hero.images array
 *        - Preserves alt text and captions from metadata or EXIF
 *
 * Notes:
 *   - Processes all images found in photo-source/originals/config/hero/
 *   - Automatically updates site.json with processed paths
 *   - Preserves existing alt text and captions
 *   - Callouts can be configured via _hero.json metadata file
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
  INPUT_DIR: 'photo-source/originals/config/hero',
  OUTPUT_DIR: 'public/hero',
  CONTENT_DIR: 'content',
  SITE_CONFIG: 'content/site/site.json',
  METADATA_FILE: 'photo-source/originals/config/hero/_hero.json',
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
 * Get image metadata (dimensions and EXIF) efficiently
 * Returns both dimensions and EXIF data in one pass
 * Reuses Sharp input to avoid duplicate file reads (important for HEIC files)
 */
async function getImageMetadata(imagePath) {
  try {
    const sharpInput = await getSharpInput(imagePath);
    const image = sharp(sharpInput.input);
    
    // Get dimensions and EXIF in parallel for efficiency
    const [metadata, exifData] = await Promise.all([
      image.metadata(),
      exifr.parse(imagePath, {
        pick: ['ImageDescription', 'DateTimeOriginal', 'Make', 'Model', 'FNumber', 'ExposureTime', 'ISO', 'FocalLength']
      }).catch(() => ({})) // Ignore EXIF errors gracefully
    ]);

    if (!metadata.width || !metadata.height) {
      throw new Error('Invalid image dimensions');
    }

    return {
      width: metadata.width,
      height: metadata.height,
      aspectRatio: metadata.width / metadata.height,
      sharpInput, // Return the input for reuse in processing
      exif: exifData
    };
  } catch (error) {
    console.error(`  ⚠️  Could not read metadata for ${path.basename(imagePath)}: ${error.message}`);
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
 * Format EXIF data into a caption string
 */
function formatExifCaption(exif) {
  if (!exif || Object.keys(exif).length === 0) return null;
  
  const parts = [];
  
  // Focal length
  if (exif.FocalLength) {
    parts.push(`${Math.round(exif.FocalLength)}mm`);
  }
  
  // Aperture
  if (exif.FNumber) {
    parts.push(`f/${exif.FNumber}`);
  }
  
  // Shutter speed
  if (exif.ExposureTime) {
    if (exif.ExposureTime >= 1) {
      parts.push(`${exif.ExposureTime}s`);
    } else {
      const denominator = Math.round(1 / exif.ExposureTime);
      parts.push(`1/${denominator}s`);
    }
  }
  
  // ISO
  if (exif.ISO) {
    parts.push(`ISO ${exif.ISO}`);
  }
  
  return parts.length > 0 ? parts.join(' • ') : null;
}

/**
 * Process a single hero image efficiently
 * Reuses Sharp input to avoid duplicate file reads
 */
async function processHeroImage(imageFile, index, metadata, force = false) {
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

    // Get alt text and caption from metadata or EXIF
    const metadataItem = metadata?.images?.find(img => 
      img.filename === imageFile || img.filename === baseName
    );
    
    const altText = metadataItem?.alt || exif?.ImageDescription || `Hero image ${index + 1}`;
    const caption = metadataItem?.caption || formatExifCaption(exif) || null;

    return {
      src: `/hero/${baseName}-large.webp`,
      alt: altText,
      caption: caption,
      order: index + 1 // Assign order based on position (1-indexed)
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
    return { images: null };
  }

  try {
    const content = await fsp.readFile(metadataPath, 'utf-8');
    const metadata = JSON.parse(content);
    return metadata;
  } catch (error) {
    console.warn(`  ⚠️  Could not load metadata file: ${error.message}`);
    return { images: null };
  }
}

/**
 * Load existing site config
 */
async function loadSiteConfig() {
  const configPath = path.join(ROOT, CONFIG.SITE_CONFIG);
  if (!existsSync(configPath)) {
    throw new Error(`Site config not found: ${configPath}`);
  }

  try {
    const content = await fsp.readFile(configPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    throw new Error(`Failed to parse site config: ${error.message}`);
  }
}

/**
 * Write updated site.json with processed hero images
 */
async function writeSiteConfig(siteConfig, heroImages) {
  const configPath = path.join(ROOT, CONFIG.SITE_CONFIG);
  const configDir = path.dirname(configPath);
  
  await fsp.mkdir(configDir, { recursive: true });

  // Update hero.images in site config
  if (!siteConfig.hero) {
    siteConfig.hero = {
      layout: 'default',
      headline: 'Photography & Trips',
      subheadline: 'A minimal archive of places, light, and time.',
      images: []
    };
  }

  const existingImages = siteConfig.hero.images || [];
  
  // Preserve existing order values by matching images by src
  const updatedImages = heroImages
    .filter(img => img !== null)
    .map((newImage, index) => {
      // Try to find existing image with same src
      const existingImage = existingImages.find(existing => existing.src === newImage.src);
      
      // Preserve order if it exists, otherwise use index + 1
      const order = existingImage?.order !== undefined ? existingImage.order : newImage.order;
      
      return {
        ...newImage,
        order: order
      };
    });

  siteConfig.hero.images = updatedImages;

  await fsp.writeFile(configPath, JSON.stringify(siteConfig, null, 2));
  console.log(`  ✅ Updated ${configPath}`);
}

/**
 * Main processing function
 */
async function main() {
  console.log('');
  console.log('📸 Hero Photo Processing Pipeline');
  console.log('━'.repeat(60));
  console.log('');

  const options = parseArgs();
  const inputDir = path.join(ROOT, CONFIG.INPUT_DIR);

  if (!existsSync(inputDir)) {
    console.error(`❌ ERROR: Input directory does not exist: ${inputDir}`);
    console.error('   Please create photo-source/originals/config/hero/ and add your images');
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
    console.error('❌ No images found in photo-source/originals/config/hero/');
    console.error(`   Supported formats: ${CONFIG.SUPPORTED_FORMATS.join(', ')}`);
    process.exit(1);
  }

  console.log(`   Found ${imageFiles.length} image(s)`);
  console.log('');

  // Load metadata and existing site config
  const metadata = await loadMetadata();
  let siteConfig;
  try {
    siteConfig = await loadSiteConfig();
  } catch (error) {
    console.error(`❌ ERROR: ${error.message}`);
    process.exit(1);
  }

  // Process images in parallel with concurrency limit
  console.log('🔄 Processing images...');
  console.log('');
  
  // Process images in batches to avoid overwhelming the system
  // Concurrency limit balances speed with memory usage
  const CONCURRENCY_LIMIT = 3; // Process 3 images at a time
  const heroImages = [];
  let processedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < imageFiles.length; i += CONCURRENCY_LIMIT) {
    const batch = imageFiles.slice(i, i + CONCURRENCY_LIMIT);
    const batchIndex = i;
    
    console.log(`📦 Processing batch ${Math.floor(i / CONCURRENCY_LIMIT) + 1}/${Math.ceil(imageFiles.length / CONCURRENCY_LIMIT)} (${batch.length} image(s))...`);
    
    const batchPromises = batch.map((imageFile, idx) => 
      processHeroImage(imageFile, batchIndex + idx, metadata, options.force)
    );
    
    const batchResults = await Promise.all(batchPromises);
    
    for (const imageData of batchResults) {
      if (imageData) {
        heroImages.push(imageData);
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

  if (heroImages.length === 0) {
    console.error('❌ No images were successfully processed');
    process.exit(1);
  }

  // Update site.json
  console.log('📝 Updating site.json...');
  await writeSiteConfig(siteConfig, heroImages);

  console.log('');
  console.log('✅ Hero processing complete!');
  console.log(`   Images: ${heroImages.length} configured`);
  console.log(`   Config: ${CONFIG.SITE_CONFIG}`);
  console.log(`   Output: ${CONFIG.OUTPUT_DIR}`);
  console.log('');
}

main().catch(error => {
  console.error('');
  console.error('❌ Fatal error:', error);
  console.error('');
  process.exit(1);
});
