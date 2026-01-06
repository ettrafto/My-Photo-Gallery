#!/usr/bin/env node

/**
 * Hero Photo Processing Script
 * 
 * Processes hero photos specified in content/site/site.json and generates
 * optimized WebP variants in public/hero/ following the same efficiency
 * protocols as regular photos (large, small, blur variants).
 * 
 * USAGE:
 *   npm run process:hero                    # Process hero photos
 *   npm run process:hero -- --force         # Reprocess all (overwrite existing)
 * 
 * CONFIGURATION:
 *   Hero photos are configured in content/site/site.json under hero.images
 *   Each item should have a "src" field pointing to the source photo.
 *   Source photos can be:
 *     - Paths in photo-source/originals (e.g., "Cascades/IMG_9437.JPG")
 *     - Paths in public/photos (e.g., "photos/cascades/IMG_9437-large.webp")
 *     - Absolute paths to original files
 * 
 * OUTPUT:
 *   - Processes photos to public/hero/ using the configured src base name:
 *       {base}-large.webp, {base}-small.webp, {base}-blur.webp
 *     Where {base} is derived from the configured src filename (without extension),
 *     with any trailing "-large/-small/-blur" stripped.
 *   - Keeps site.json minimal (src, alt, caption only). Does not rewrite src.
 * 
 * NOTES:
 *   - Safe to run repeatedly (idempotent)
 *   - Preserves existing hero.images configuration
 *   - Only processes photos that are referenced in site.json
 */

import fs from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import sharp from 'sharp';
import heicConvert from 'heic-convert';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

// ============================================================================
// Configuration
// ============================================================================

const CONFIG = {
  SITE_CONFIG_PATH: 'content/site/site.json',
  OUTPUT_DIR: 'public/hero',
  ORIGINALS_DIR: 'photo-source/originals',
  PROCESSED_DIR: 'public/photos',
  
  // Supported input formats
  SUPPORTED_FORMATS: ['.jpg', '.jpeg', '.png', '.heic', '.heif', '.webp'],
  
  // Output variants (matching processPhotos.mjs)
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
    force: false
  };

  for (const arg of args) {
    if (arg === '--force') {
      options.force = true;
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
📸 Hero Photo Processing Script

USAGE:
  npm run process:hero [OPTIONS]

OPTIONS:
  --force              Reprocess all images (overwrite existing)
  --help, -h           Show this help message

EXAMPLES:
  npm run process:hero
  npm run process:hero -- --force
`);
}

// ============================================================================
// File System Utilities
// ============================================================================

/**
 * Find source photo file from various possible locations
 */
async function findSourcePhoto(srcPath) {
  const normalizedSrcPath = typeof srcPath === 'string' ? srcPath.trim() : '';
  const srcNoLeadingSlash = normalizedSrcPath.replace(/^\/+/, '');

  // Extract base filename for searching
  const filename = path.basename(normalizedSrcPath);
  const baseName = path.parse(filename).name;
  const baseNameStripped = baseName.replace(/-(large|small|blur)$/i, '');
  const ext = path.extname(filename).toLowerCase();
  
  // Try multiple possible locations
  const searchPaths = [
    // Direct path in originals (e.g., "Cascades/IMG_9437.JPG")
    path.join(ROOT, CONFIG.ORIGINALS_DIR, srcNoLeadingSlash),
    // Path relative to originals root (just filename)
    path.join(ROOT, CONFIG.ORIGINALS_DIR, filename),
    // Vite public URL mappings
    // - "/hero/..." -> "public/hero/..."
    // - "/photos/..." -> "public/photos/..."
    // - "/images/..." -> "public/images/..."
    path.join(ROOT, 'public', srcNoLeadingSlash),
    // Absolute path
    normalizedSrcPath,
    // Relative to root
    path.join(ROOT, srcNoLeadingSlash)
  ];

  // If srcPath looks like a processed photo path (photos/album/photo-large.webp),
  // try to find the original
  if (normalizedSrcPath.includes('/photos/')) {
    const parts = normalizedSrcPath.split('/');
    const albumSlug = parts[1];
    const processedFilename = parts[2];
    const processedBaseName = processedFilename.replace(/-(large|small|blur)\.webp$/, '');
    
    // Try to find original in originals by album slug
    const originalsPath = path.join(ROOT, CONFIG.ORIGINALS_DIR);
    if (existsSync(originalsPath)) {
      const albumDirs = await fs.readdir(originalsPath, { withFileTypes: true }).catch(() => []);
      for (const entry of albumDirs) {
        if (entry.isDirectory()) {
          // Try common extensions
          for (const ext of ['.JPG', '.jpg', '.JPEG', '.jpeg', '.PNG', '.png']) {
            const possiblePath = path.join(originalsPath, entry.name, processedBaseName + ext);
            if (existsSync(possiblePath)) {
              searchPaths.unshift(possiblePath);
            }
          }
        }
      }
    }
  }

  // Search for the file
  for (const searchPath of searchPaths) {
    if (existsSync(searchPath) && (await fs.stat(searchPath)).isFile()) {
      const ext = path.extname(searchPath).toLowerCase();
      if (CONFIG.SUPPORTED_FORMATS.includes(ext) || ext === '.webp') {
        return searchPath;
      }
    }
  }

  // If we're pointing at a derived hero webp that doesn't exist (e.g. /hero/hero-2-large.webp),
  // fall back to the corresponding original asset in public/hero (hero-2.JPG/png/heic/etc).
  if (normalizedSrcPath.startsWith('/hero/') && baseNameStripped !== baseName) {
    const candidates = [];
    for (const ext of ['.JPG', '.jpg', '.JPEG', '.jpeg', '.PNG', '.png', '.HEIC', '.heic', '.HEIF', '.heif', '.webp']) {
      candidates.push(path.join(ROOT, 'public', 'hero', `${baseNameStripped}${ext}`));
    }
    for (const c of candidates) {
      if (existsSync(c) && (await fs.stat(c)).isFile()) return c;
    }
  }

  // If not found, try searching recursively in originals
  try {
    const originalsPath = path.join(ROOT, CONFIG.ORIGINALS_DIR);
    if (existsSync(originalsPath)) {
      const filename = path.basename(srcPath);
      const baseName = path.parse(filename).name;
      const baseNameStripped = baseName.replace(/-(large|small|blur)$/i, '');
      
      // Search recursively
      const found = await findFileRecursive(originalsPath, baseName);
      if (found) {
        return found;
      }
      // Try again with the stripped base name (handles references to *-large.webp etc)
      if (baseNameStripped !== baseName) {
        const found2 = await findFileRecursive(originalsPath, baseNameStripped);
        if (found2) return found2;
      }
    }
  } catch (err) {
    // Ignore errors
  }

  return null;
}

/**
 * Recursively search for a file by base name
 */
async function findFileRecursive(dir, baseName) {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        const found = await findFileRecursive(fullPath, baseName);
        if (found) return found;
      } else if (entry.isFile()) {
        const entryBaseName = path.parse(entry.name).name;
        const ext = path.extname(entry.name).toLowerCase();
        
        if (entryBaseName.toLowerCase() === baseName.toLowerCase() && 
            CONFIG.SUPPORTED_FORMATS.includes(ext)) {
          return fullPath;
        }
      }
    }
  } catch (err) {
    // Ignore errors
  }
  
  return null;
}

/**
 * Ensure output directory exists
 */
async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

function isHeicLike(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return ext === '.heic' || ext === '.heif';
}

/**
 * Return a Sharp-readable input for a given source path.
 * - If Sharp can decode HEIC/HEIF on this system, it will use the original buffer.
 * - Otherwise, converts HEIC/HEIF -> JPEG buffer in-memory.
 *
 * @param {string} sourcePath
 * @returns {Promise<string|Buffer>}
 */
async function getSharpInput(sourcePath) {
  // If the source is already a webp file, read it as a buffer so we can safely
  // overwrite the same filepath during processing (Sharp disallows input==output
  // when both are file paths).
  if (path.extname(sourcePath).toLowerCase() === '.webp') {
    return await fs.readFile(sourcePath);
  }

  if (!isHeicLike(sourcePath)) return sourcePath;

  const heicBuffer = await fs.readFile(sourcePath);
  try {
    // Force a tiny decode to confirm Sharp can actually decode HEIC/HEIF on this system.
    await sharp(heicBuffer)
      .rotate()
      .resize(1, 1, { fit: 'inside', withoutEnlargement: true })
      .toBuffer();
    return heicBuffer;
  } catch {
    return await heicConvert({ buffer: heicBuffer, format: 'JPEG', quality: 1 });
  }
}

// ============================================================================
// Image Processing
// ============================================================================

/**
 * Process a single hero photo and generate all variants
 */
async function processHeroPhoto(sourcePath, outputBaseName, outputDir, force = false) {
  // Check if outputs already exist (unless force is enabled)
  if (!force) {
    const allExist = Object.values(CONFIG.VARIANTS).every(variant => {
      const outputPath = path.join(outputDir, `${outputBaseName}${variant.suffix}.webp`);
      return existsSync(outputPath);
    });
    
    if (allExist) {
      console.log(`  ⏭️  SKIP (exists): ${path.basename(sourcePath)}`);
      return { status: 'skipped' };
    }
  }

  try {
    console.log(`  🔄 PROCESS: ${path.basename(sourcePath)}`);
    
    // If source is already a webp, we can use it directly or convert from it
    const sourceExt = path.extname(sourcePath).toLowerCase();

    // Prepare a Sharp-readable input (handles HEIC/HEIF fallback conversion and safe overwrite for webp).
    const sharpInput = await getSharpInput(sourcePath);
    
    // Process each variant
    const results = await Promise.all(
      Object.entries(CONFIG.VARIANTS).map(async ([variantName, config]) => {
        const outputPath = path.join(outputDir, `${outputBaseName}${config.suffix}.webp`);
        
        try {
          let image = sharp(sharpInput);
          
          // If source is already webp and we want a different size, we need to resize
          // Otherwise, sharp will handle the conversion
          await image
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
      console.log(`    ✅ Created: ${outputBaseName}-[large|small|blur].webp`);
      return { status: 'processed' };
    } else {
      console.warn(`    ⚠️  Partial success for ${path.basename(sourcePath)}`);
      return { status: 'partial' };
    }

  } catch (error) {
    console.error(`    ❌ ERROR processing ${path.basename(sourcePath)}: ${error.message}`);
    return { status: 'error', error };
  }
}

function deriveOutputBaseNameFromSrc(srcPath) {
  const normalizedSrcPath = typeof srcPath === 'string' ? srcPath.trim() : '';
  const filename = path.basename(normalizedSrcPath);
  const baseName = path.parse(filename).name;
  return baseName.replace(/-(large|small|blur)$/i, '');
}

// ============================================================================
// Site Config Processing
// ============================================================================

/**
 * Load site config
 */
async function loadSiteConfig() {
  const configPath = path.join(ROOT, CONFIG.SITE_CONFIG_PATH);
  
  if (!existsSync(configPath)) {
    throw new Error(`Site config not found: ${configPath}`);
  }
  
  const content = await fs.readFile(configPath, 'utf-8');
  return JSON.parse(content);
}

/**
 * Save site config
 */
async function saveSiteConfig(config) {
  const configPath = path.join(ROOT, CONFIG.SITE_CONFIG_PATH);
  await fs.writeFile(configPath, JSON.stringify(config, null, 2) + '\n', 'utf-8');
}

// ============================================================================
// Main Processing Logic
// ============================================================================

async function main() {
  console.log('');
  console.log('📸 Hero Photo Processing');
  console.log('━'.repeat(60));
  console.log('');

  // Parse CLI arguments
  const options = parseArgs();
  
  console.log(`📁 Output: ${CONFIG.OUTPUT_DIR}`);
  console.log(`🔧 Mode:   ${options.force ? 'FORCE (overwrite)' : 'Incremental (skip existing)'}`);
  console.log('');

  // Load site config
  let siteConfig;
  try {
    siteConfig = await loadSiteConfig();
  } catch (error) {
    console.error(`❌ ERROR: Failed to load site config: ${error.message}`);
    process.exit(1);
  }

  // Check if hero images exist
  if (!siteConfig.hero || !siteConfig.hero.images) {
    console.log('⚠️  No hero images found in site.json');
    console.log('   Add items to hero.images to process hero photos');
    console.log('');
    process.exit(0);
  }

  const heroItems = siteConfig.hero.images;
  
  if (heroItems.length === 0) {
    console.log('⚠️  hero.images array is empty');
    console.log('');
    process.exit(0);
  }

  console.log(`🔍 Found ${heroItems.length} hero image(s)`);
  console.log('');

  // Ensure output directory exists
  await ensureDir(path.join(ROOT, CONFIG.OUTPUT_DIR));

  // Process each hero item
  console.log('🔄 Processing hero photos...');
  console.log('');

  const results = {
    processed: 0,
    skipped: 0,
    errors: 0,
    partial: 0
  };

  const updatedItems = [];

  for (let i = 0; i < heroItems.length; i++) {
    const item = heroItems[i];
    const srcPath = item.src;
    
    if (!srcPath) {
      console.warn(`  ⚠️  Item ${i + 1} has no src, skipping`);
      updatedItems.push(item);
      continue;
    }

    console.log(`Processing item ${i + 1}/${heroItems.length}: ${srcPath}`);

    // Find source photo
    const sourcePhoto = await findSourcePhoto(srcPath);
    
    if (!sourcePhoto) {
      console.error(`  ❌ Could not find source photo for: ${srcPath}`);
      console.error(`     Searched in: ${CONFIG.ORIGINALS_DIR}, ${CONFIG.PROCESSED_DIR}, public/`);
      console.error('     Tip: Set hero.images[].src to the ORIGINAL file you placed in public/hero (e.g. "/hero/IMG_9416.JPG" or "/hero/IMG_4212.HEIC").');
      updatedItems.push(item); // Keep original item
      results.errors++;
      continue;
    }

    console.log(`  ✓ Found source: ${path.relative(ROOT, sourcePhoto)}`);

    // Generate output base name from the configured src filename
    // e.g. "/hero/IMG_9416.JPG" -> "IMG_9416"
    // e.g. "/hero/hero-2-large.webp" -> "hero-2"
    const outputBaseName = deriveOutputBaseNameFromSrc(srcPath);
    const outputDir = path.join(ROOT, CONFIG.OUTPUT_DIR);

    // Process the photo
    const result = await processHeroPhoto(sourcePhoto, outputBaseName, outputDir, options.force);
    
    if (result.status === 'processed') {
      results.processed++;
    } else if (result.status === 'skipped') {
      results.skipped++;
    } else if (result.status === 'error') {
      results.errors++;
    } else if (result.status === 'partial') {
      results.partial++;
    }

    // Update item with processed paths
    // Keep site.json minimal: only src, alt, caption. Do not rewrite src.
    const updatedItem = {
      src: item.src,
      alt: item.alt || '',
      caption: item.caption || null,
    };

    updatedItems.push(updatedItem);
    console.log('');
  }

  // Update site config with processed paths
  siteConfig.hero.images = updatedItems;
  
  try {
    await saveSiteConfig(siteConfig);
    console.log(`✓ Updated ${CONFIG.SITE_CONFIG_PATH}`);
  } catch (error) {
    console.error(`❌ Failed to save site config: ${error.message}`);
    results.errors++;
  }

  // Print summary
  console.log('');
  console.log('━'.repeat(60));
  console.log('📊 Summary:');
  console.log('');
  console.log(`   Total items:     ${heroItems.length}`);
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
    console.log('⚠️  Some hero photos failed to process. Check the logs above for details.');
    console.log('');
    process.exit(1);
  } else if (results.processed === 0 && results.skipped === heroItems.length) {
    console.log('✨ All hero photos already processed! Use --force to reprocess.');
    console.log('');
  } else {
    console.log('✅ Hero photo processing complete!');
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

