#!/usr/bin/env node

/**
 * Photo Processing Pipeline
 * 
 * This script reads source/original photos and generates optimized WebP outputs
 * in three sizes: large (desktop), small (mobile), and blur (placeholder LQIP).
 * 
 * INPUT DIRECTORY (default):
 *   photo-source/originals/
 *     └── album-name/
 *           ├── photo1.jpg
 *           ├── photo2.jpg
 *           └── ...
 * 
 * OUTPUT DIRECTORY (default):
 *   public/photos/
 *     └── album-name/
 *           ├── photo1-large.webp   (1800px longest side, quality 80)
 *           ├── photo1-small.webp   (800px longest side, quality 80)
 *           ├── photo1-blur.webp    (40px longest side, quality 40)
 *           └── ...
 * 
 * USAGE:
 *   npm run process:photos                    # Process only missing outputs
 *   npm run process:photos -- --force         # Reprocess all (overwrite existing)
 *   npm run process:photos -- --input=path    # Custom input directory
 *   npm run process:photos -- --output=path   # Custom output directory
 * 
 * NOTES:
 *   - Safe to run repeatedly (idempotent)
 *   - Preserves folder structure from input to output
 *   - Skips existing files unless --force is used
 *   - Does NOT modify any album JSON files
 *   - Handles EXIF orientation automatically
 *
 * Pipeline note: prefer `npm run import:photos` for the unified flow that also
 * writes album JSON. This script remains for standalone processing only.
 */

import fs from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';
import sharp from 'sharp';

// ============================================================================
// Configuration
// ============================================================================

const CONFIG = {
  // Default directories
  INPUT_DIR: 'photo-source/originals',
  OUTPUT_DIR: 'public/photos',
  
  // Supported input formats
  SUPPORTED_FORMATS: ['.jpg', '.jpeg', '.png', '.heic', '.heif'],
  
  // Output variants
  VARIANTS: {
    large: {
      maxSize: 1800,
      quality: 80,
      suffix: '-large'
    },
    small: {
      maxSize: 800,
      quality: 80,
      suffix: '-small'
    },
    blur: {
      maxSize: 40,
      quality: 40,
      suffix: '-blur'
    }
  }
};

// ============================================================================
// CLI Argument Parsing
// ============================================================================

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    force: false,
    inputDir: CONFIG.INPUT_DIR,
    outputDir: CONFIG.OUTPUT_DIR
  };

  for (const arg of args) {
    if (arg === '--force') {
      options.force = true;
    } else if (arg.startsWith('--input=')) {
      options.inputDir = arg.split('=')[1];
    } else if (arg.startsWith('--output=')) {
      options.outputDir = arg.split('=')[1];
    } else if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    } else {
      console.warn(`⚠️  Unknown argument: ${arg}`);
    }
  }

  return options;
}

function printHelp() {
  console.log(`
📸 Photo Processing Pipeline

USAGE:
  npm run process:photos [OPTIONS]

OPTIONS:
  --force              Reprocess all images (overwrite existing)
  --input=<path>       Custom input directory (default: photo-source/originals)
  --output=<path>      Custom output directory (default: public/photos)
  --help, -h           Show this help message

EXAMPLES:
  npm run process:photos
  npm run process:photos -- --force
  npm run process:photos -- --input=my-photos --output=public/optimized
`);
}

// ============================================================================
// File System Utilities
// ============================================================================

/**
 * Recursively find all image files in a directory
 */
async function findImageFiles(dir, baseDir = dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      // Recursively search subdirectories
      const subFiles = await findImageFiles(fullPath, baseDir);
      files.push(...subFiles);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (CONFIG.SUPPORTED_FORMATS.includes(ext)) {
        const relativePath = path.relative(baseDir, fullPath);
        files.push({
          fullPath,
          relativePath,
          name: path.parse(entry.name).name,
          ext
        });
      }
    }
  }

  return files;
}

/**
 * Check if all output variants exist for a given source file
 */
async function checkOutputsExist(outputDir, relativePath, baseName) {
  const outputFolder = path.join(outputDir, path.dirname(relativePath));
  
  for (const [variantName, config] of Object.entries(CONFIG.VARIANTS)) {
    const outputPath = path.join(outputFolder, `${baseName}${config.suffix}.webp`);
    if (!existsSync(outputPath)) {
      return false;
    }
  }
  
  return true;
}

/**
 * Ensure output directory exists
 */
async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

// ============================================================================
// Image Processing
// ============================================================================

/**
 * Process a single image and generate all variants
 */
async function processImage(imageFile, outputDir, force = false) {
  const { fullPath, relativePath, name } = imageFile;
  const outputFolder = path.join(outputDir, path.dirname(relativePath));
  
  // Check if outputs already exist (unless force is enabled)
  if (!force && await checkOutputsExist(outputDir, relativePath, name)) {
    console.log(`  ⏭️  SKIP (exists): ${relativePath}`);
    return { status: 'skipped', file: relativePath };
  }

  // Ensure output directory exists
  await ensureDir(outputFolder);

  try {
    console.log(`  🔄 PROCESS: ${relativePath}`);
    
    // Load the source image once
    const image = sharp(fullPath);
    
    // Get metadata to preserve orientation
    const metadata = await image.metadata();
    
    // Process each variant
    const results = await Promise.all(
      Object.entries(CONFIG.VARIANTS).map(async ([variantName, config]) => {
        const outputPath = path.join(outputFolder, `${name}${config.suffix}.webp`);
        
        try {
          // Clone the image pipeline for this variant
          await sharp(fullPath)
            .rotate() // Auto-rotate based on EXIF orientation
            .resize(config.maxSize, config.maxSize, {
              fit: 'inside',
              withoutEnlargement: true
            })
            .webp({ quality: config.quality })
            .toFile(outputPath);
          
          return { variant: variantName, success: true };
        } catch (error) {
          console.error(`    ❌ Failed to create ${variantName}: ${error.message}`);
          return { variant: variantName, success: false, error };
        }
      })
    );

    // Check if all variants succeeded
    const allSucceeded = results.every(r => r.success);
    
    if (allSucceeded) {
      console.log(`    ✅ Created: ${name}-[large|small|blur].webp`);
      return { status: 'processed', file: relativePath };
    } else {
      console.warn(`    ⚠️  Partial success for ${relativePath}`);
      return { status: 'partial', file: relativePath };
    }

  } catch (error) {
    console.error(`    ❌ ERROR processing ${relativePath}: ${error.message}`);
    return { status: 'error', file: relativePath, error };
  }
}

// ============================================================================
// Main Processing Logic
// ============================================================================

async function main() {
  console.log('');
  console.log('📸 Photo Processing Pipeline');
  console.log('━'.repeat(60));
  console.log('');

  // Parse CLI arguments
  const options = parseArgs();
  
  console.log(`📁 Input:  ${options.inputDir}`);
  console.log(`📁 Output: ${options.outputDir}`);
  console.log(`🔧 Mode:   ${options.force ? 'FORCE (overwrite)' : 'Incremental (skip existing)'}`);
  console.log('');

  // Validate input directory exists
  if (!existsSync(options.inputDir)) {
    console.error(`❌ ERROR: Input directory does not exist: ${options.inputDir}`);
    console.error('');
    console.error('Please create the directory and add your source photos, or specify a different path with --input=<path>');
    process.exit(1);
  }

  // Ensure output directory exists
  await ensureDir(options.outputDir);

  // Find all image files
  console.log('🔍 Discovering images...');
  const imageFiles = await findImageFiles(options.inputDir);
  
  if (imageFiles.length === 0) {
    console.log('');
    console.log('⚠️  No images found in input directory.');
    console.log('');
    console.log(`Supported formats: ${CONFIG.SUPPORTED_FORMATS.join(', ')}`);
    process.exit(0);
  }

  console.log(`   Found ${imageFiles.length} image(s)`);
  console.log('');
  console.log('🔄 Processing images...');
  console.log('');

  // Process each image
  const results = {
    processed: 0,
    skipped: 0,
    errors: 0,
    partial: 0
  };

  for (const imageFile of imageFiles) {
    const result = await processImage(imageFile, options.outputDir, options.force);
    
    if (result.status === 'processed') {
      results.processed++;
    } else if (result.status === 'skipped') {
      results.skipped++;
    } else if (result.status === 'error') {
      results.errors++;
    } else if (result.status === 'partial') {
      results.partial++;
    }
  }

  // Print summary
  console.log('');
  console.log('━'.repeat(60));
  console.log('📊 Summary:');
  console.log('');
  console.log(`   Total images:    ${imageFiles.length}`);
  console.log(`   ✅ Processed:     ${results.processed}`);
  console.log(`   ⏭️  Skipped:       ${results.skipped}`);
  
  if (results.partial > 0) {
    console.log(`   ⚠️  Partial:       ${results.partial}`);
  }
  
  if (results.errors > 0) {
    console.log(`   ❌ Errors:        ${results.errors}`);
  }
  
  console.log('');
  
  if (results.errors > 0) {
    console.log('⚠️  Some images failed to process. Check the logs above for details.');
    console.log('');
    process.exit(1);
  } else if (results.processed === 0 && results.skipped === imageFiles.length) {
    console.log('✨ All images already processed! Use --force to reprocess.');
    console.log('');
  } else {
    console.log('✅ Processing complete!');
    console.log('');
  }
}

// ============================================================================
// Entry Point
// ============================================================================

main().catch((error) => {
  console.error('');
  console.error('❌ Fatal error:');
  console.error(error);
  console.error('');
  process.exit(1);
});


