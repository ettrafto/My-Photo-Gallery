#!/usr/bin/env node

/**
 * Unified Photo Import Pipeline
 *
 * Usage:
 *   npm run import:photos            # Default (incremental)
 *   npm run import:photos -- --force # Reprocess all WebP variants
 *
 * What it does:
 *   1) Reads originals from photo-source/originals/<album>/
 *   2) Generates WebP variants to public/photos/<album-slug>/:
 *        -large.webp (1800px), -small.webp (800px), -blur.webp (40px)
 *   3) Builds/updates content/albums/<album>.json with:
 *        path, pathSmall, pathLarge, pathBlur + EXIF/metadata
 *   4) Refreshes content/albums.json and content/map.json
 *
 * Notes:
 *   - Rebuilds photo lists from disk; missing files are removed from JSON.
 *   - Respects optional per-album _album.json metadata in source folders.
 *   - Looks up default locations from content/album-locations.json when present.
 */

import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';
import sharp from 'sharp';
import exifr from 'exifr';
import slugify from 'slugify';
import heicConvert from 'heic-convert';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const CONFIG = {
  INPUT_DIR: 'photo-source/originals',
  OUTPUT_DIR: 'public/photos',
  CONTENT_DIR: 'content',
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
    force: false,
    inputDir: CONFIG.INPUT_DIR,
    outputDir: CONFIG.OUTPUT_DIR,
    contentDir: CONFIG.CONTENT_DIR
  };

  for (const arg of args) {
    if (arg === '--force') options.force = true;
    else if (arg.startsWith('--input=')) options.inputDir = arg.split('=')[1];
    else if (arg.startsWith('--output=')) options.outputDir = arg.split('=')[1];
    else if (arg.startsWith('--content=')) options.contentDir = arg.split('=')[1];
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

/**
 * Return a Sharp-readable input for a given image path.
 * - If Sharp can decode the source (including HEIC when supported), use the original file.
 * - If the source is HEIC/HEIF and Sharp cannot decode it, convert to JPEG in-memory.
 *
 * @param {string} imagePath
 * @returns {Promise<{ input: string | Buffer, source: 'path'|'buffer', note?: string }>}
 */
async function getSharpInput(imagePath) {
  if (!isHeicLike(imagePath)) {
    return { input: imagePath, source: 'path' };
  }

  const heicBuffer = await fsp.readFile(imagePath);

  // Try Sharp directly first (works when libvips has HEIF support)
  try {
    // Note: on some builds, `.metadata()` may not fail even if decode later fails.
    // Force a tiny decode to confirm support.
    await sharp(heicBuffer)
      .rotate()
      .resize(1, 1, { fit: 'inside', withoutEnlargement: true })
      .toBuffer();
    return { input: heicBuffer, source: 'buffer', note: 'heic:sharp-native' };
  } catch {
    // Fall back to converting HEIC/HEIF -> JPEG buffer
    const jpegBuffer = await heicConvert({
      buffer: heicBuffer,
      format: 'JPEG',
      quality: 1,
    });
    return { input: jpegBuffer, source: 'buffer', note: 'heic:converted-to-jpeg' };
  }
}

async function ensureDir(dirPath) {
  await fsp.mkdir(dirPath, { recursive: true });
}

function slugToTitle(slug) {
  return String(slug)
    .split('-')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

async function readJsonFile(filePath) {
  const raw = await fsp.readFile(filePath, 'utf-8');
  return JSON.parse(raw);
}

async function writeJsonFile(filePath, data) {
  await ensureDir(path.dirname(filePath));
  await fsp.writeFile(filePath, JSON.stringify(data, null, 2));
}

async function writeJsonFileIfMissing(filePath, data) {
  await ensureDir(path.dirname(filePath));
  try {
    await fsp.writeFile(filePath, JSON.stringify(data, null, 2), { flag: 'wx' });
    return { created: true };
  } catch (err) {
    if (err?.code === 'EEXIST') return { created: false };
    throw err;
  }
}

/**
 * Ensure album locations config exists and includes entries for albums discovered by this run.
 * - Never overwrites existing entries (preserves manually-entered coordinates).
 * - Only adds missing album slugs with null lat/lng placeholders.
 */
async function ensureAlbumLocationsConfig(contentDir, albumsList) {
  const albumLocationsPath = path.join(contentDir, 'album-locations.json');

  const desiredEntries = {};
  for (const album of albumsList) {
    const slug = album?.slug || album?.id;
    if (!slug) continue;
    desiredEntries[slug] = {
      albumSlug: slug,
      albumTitle: album?.title || slugToTitle(slug),
      defaultLocation: {
        lat: null,
        lng: null,
        accuracy: 'album-default'
      }
    };
  }

  // If the file doesn't exist, create it.
  if (!existsSync(albumLocationsPath)) {
    const { created } = await writeJsonFileIfMissing(albumLocationsPath, desiredEntries);
    if (created) {
      console.log(`\n✅ Created album-locations.json (${Object.keys(desiredEntries).length} album(s))`);
    } else {
      console.log(`\nℹ album-locations.json already exists (skipped create)`);
    }
    return;
  }

  // If it exists, merge in any missing albums (preserving existing entries).
  let existing;
  try {
    existing = await readJsonFile(albumLocationsPath);
  } catch (err) {
    console.error(`\n❌ Could not parse album-locations.json at: ${albumLocationsPath}`);
    console.error('   Fix the JSON (or move the file aside) and re-run import.');
    throw err;
  }

  if (!existing || typeof existing !== 'object' || Array.isArray(existing)) {
    console.error(`\n❌ album-locations.json must be a JSON object keyed by album slug: ${albumLocationsPath}`);
    console.error('   Fix the file shape (or move the file aside) and re-run import.');
    throw new Error('Invalid album-locations.json shape');
  }

  const merged = { ...existing };
  let added = 0;
  for (const [slug, entry] of Object.entries(desiredEntries)) {
    if (merged[slug]) continue;
    merged[slug] = entry;
    added++;
  }

  if (added > 0) {
    await writeJsonFile(albumLocationsPath, merged);
    console.log(`\n✅ Updated album-locations.json (+${added} new album(s), preserved existing)`);
  } else {
    console.log(`\n✓ album-locations.json up to date (no new albums)`);
  }
}

function getAlbumFolders(inputDir) {
  if (!existsSync(inputDir)) return [];
  return fs
    .readdirSync(inputDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);
}

function getImageFiles(albumPath) {
  if (!existsSync(albumPath)) return [];
  return fs
    .readdirSync(albumPath)
    .filter((file) => CONFIG.SUPPORTED_FORMATS.includes(path.extname(file).toLowerCase()))
    .sort();
}

async function readAlbumMetadata(albumPath, albumName) {
  const metaPath = path.join(albumPath, '_album.json');
  let metadata = {
    title: albumName,
    tags: [],
    date: null,
    cover: null,
    description: null,
    isFavorite: false
  };

  if (existsSync(metaPath)) {
    try {
      const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
      metadata = { ...metadata, ...meta };
      console.log(`  ✓ Found _album.json`);
    } catch (err) {
      console.warn(`  ⚠ Could not parse _album.json: ${err.message}`);
    }
  }

  return metadata;
}

async function processImageFile({ albumSlug, albumOutputDir, imagePath, filename, force }) {
  const baseName = path.parse(filename).name;
  const outputBase = path.join(albumOutputDir, `${baseName}`);

  const { input: sharpInput } = await getSharpInput(imagePath);

  // Gather metadata first (width/height + EXIF)
  const [sharpMeta, exif] = await Promise.all([
    sharp(sharpInput).metadata(),
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
    }).catch(() => ({}))
  ]);

  const width = sharpMeta?.width || null;
  const height = sharpMeta?.height || null;
  const aspectRatio = width && height ? width / height : 1.5;

  const gps = (() => {
    if (typeof exif?.latitude === 'number' && typeof exif?.longitude === 'number') {
      return { lat: exif.latitude, lng: exif.longitude };
    }
    if (exif?.GPSLatitude && exif?.GPSLongitude) {
      const toDecimal = (value, ref) => {
        if (Array.isArray(value)) {
          const [deg, min, sec] = value;
          let dec = deg + (min || 0) / 60 + (sec || 0) / 3600;
          if (ref === 'S' || ref === 'W') dec = -dec;
          return dec;
        }
        return null;
      };
      return {
        lat: toDecimal(exif.GPSLatitude, exif.GPSLatitudeRef),
        lng: toDecimal(exif.GPSLongitude, exif.GPSLongitudeRef)
      };
    }
    return { lat: null, lng: null };
  })();

  // Generate variants
  await ensureDir(albumOutputDir);
  for (const [variantName, cfg] of Object.entries(CONFIG.VARIANTS)) {
    const outPath = `${outputBase}${cfg.suffix}.webp`;
    if (!force && existsSync(outPath)) continue;

    try {
      await sharp(sharpInput)
        .rotate()
        .resize(cfg.maxSize, cfg.maxSize, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: cfg.quality })
        .toFile(outPath);
    } catch (err) {
      console.error(`    ❌ Failed ${variantName} for ${filename}: ${err.message}`);
    }
  }

  const webBase = `photos/${albumSlug}/${baseName}`;

  return {
    filename,
    path: toWebPath(`${webBase}-large.webp`),
    pathLarge: toWebPath(`${webBase}-large.webp`),
    pathSmall: toWebPath(`${webBase}-small.webp`),
    pathBlur: toWebPath(`${webBase}-blur.webp`),
    lat: gps.lat,
    lng: gps.lng,
    width,
    height,
    aspectRatio,
    exif: {
      camera: exif?.Make && exif?.Model ? `${exif.Make} ${exif.Model}` : null,
      lens: exif?.LensModel || null,
      aperture: exif?.FNumber ? `f/${exif.FNumber}` : null,
      shutterSpeed: exif?.ExposureTime ? formatShutterSpeed(exif.ExposureTime) : null,
      iso: exif?.ISO || null,
      focalLength: exif?.FocalLength ? `${Math.round(exif.FocalLength)}mm` : null,
      dateTaken: exif?.DateTimeOriginal || null,
      copyright: exif?.Copyright || null,
      artist: exif?.Artist || null,
      description: exif?.ImageDescription || null
    }
  };
}

function formatShutterSpeed(speed) {
  if (!speed) return null;
  if (speed >= 1) return `${speed}s`;
  const denominator = Math.round(1 / speed);
  return `1/${denominator}s`;
}

function normalizeDate(raw) {
  if (!raw) return null;
  if (raw instanceof Date) return raw.toISOString().slice(0, 10);
  const str = String(raw);
  return str.split(/[ T]/)[0].replace(/:/g, '-');
}

async function loadAlbumLocations(contentDir) {
  const albumLocationsPath = path.join(contentDir, 'album-locations.json');
  if (!existsSync(albumLocationsPath)) return {};
  try {
    return JSON.parse(fs.readFileSync(albumLocationsPath, 'utf-8'));
  } catch {
    return {};
  }
}

async function loadExistingAlbumJson(albumSlug, contentDir) {
  const albumJsonPath = path.join(contentDir, 'albums', `${albumSlug}.json`);
  if (!existsSync(albumJsonPath)) {
    return null;
  }
  
  try {
    const content = await fsp.readFile(albumJsonPath, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    console.warn(`  ⚠ Could not load existing album JSON: ${err.message}`);
    return null;
  }
}

async function processAlbum({ albumName, options, albumLocations }) {
  const albumPath = path.join(options.inputDir, albumName);
  const albumSlug = slugify(albumName, { lower: true, strict: true });
  const albumOutputDir = path.join(options.outputDir, albumSlug);

  console.log(`\n▶ Processing album: ${albumName} (${albumSlug})`);
  const metadata = await readAlbumMetadata(albumPath, albumName);
  const imageFiles = getImageFiles(albumPath);

  if (imageFiles.length === 0) {
    console.warn(`  ⚠ No images found, skipping album`);
    return null;
  }

  console.log(`  Found ${imageFiles.length} image(s)`);

  // Load existing album JSON to preserve custom data
  const existingAlbumData = await loadExistingAlbumJson(albumSlug, options.contentDir);

  const photos = [];
  for (const filename of imageFiles) {
    const photo = await processImageFile({
      albumSlug,
      albumOutputDir,
      imagePath: path.join(albumPath, filename),
      filename,
      force: options.force
    });
    photos.push(photo);
  }

  // Merge processed photos with existing photo data
  const existingPhotos = existingAlbumData?.photos || [];
  const existingPhotosByPath = new Map();
  for (const existing of existingPhotos) {
    // Match by path (pathLarge or path)
    const key = existing.pathLarge || existing.path || existing.filename;
    if (key) {
      existingPhotosByPath.set(key.toLowerCase(), existing);
    }
  }

  // Merge photos: preserve existing custom data, update paths/dimensions
  const mergedPhotos = [];
  const processedPaths = new Set();
  
  for (const photo of photos) {
    const key = (photo.pathLarge || photo.path || photo.filename)?.toLowerCase();
    const existing = key ? existingPhotosByPath.get(key) : null;
    
    if (existing) {
      // Merge: preserve existing custom data, update image paths/dimensions
      mergedPhotos.push({
        ...existing, // Preserve all existing fields (custom EXIF edits, etc.)
        path: photo.path, // Update image paths
        pathLarge: photo.pathLarge,
        pathSmall: photo.pathSmall,
        pathBlur: photo.pathBlur,
        width: photo.width, // Update dimensions
        height: photo.height,
        aspectRatio: photo.aspectRatio,
        lat: photo.lat !== null ? photo.lat : existing.lat, // Preserve existing GPS if new is null
        lng: photo.lng !== null ? photo.lng : existing.lng,
        // Only update EXIF if it's not manually edited (preserve existing if it exists)
        exif: existing.exif && Object.keys(existing.exif).length > 0 ? existing.exif : photo.exif
      });
      processedPaths.add(key);
    } else {
      // New photo - add as-is
      mergedPhotos.push(photo);
      if (key) processedPaths.add(key);
    }
  }
  
  // Preserve photos that exist in config but not in source (might have been removed from source)
  for (const existing of existingPhotos) {
    const key = (existing.pathLarge || existing.path || existing.filename)?.toLowerCase();
    if (key && !processedPaths.has(key)) {
      mergedPhotos.push(existing);
    }
  }

  // Cover - preserve existing if it exists in merged photos
  const existingCover = existingAlbumData?.cover;
  const coverPhoto = existingCover && mergedPhotos.find(p => 
    (p.pathLarge || p.path) === existingCover
  ) 
    ? mergedPhotos.find(p => (p.pathLarge || p.path) === existingCover)
    : metadata.cover
    ? mergedPhotos.find((p) => p.filename === metadata.cover) || mergedPhotos[0]
    : mergedPhotos[0];

  // Dates - preserve existing if set, otherwise calculate from photos
  const albumDate = existingAlbumData?.date || 
    (!metadata.date && mergedPhotos[0]?.exif?.dateTaken 
      ? normalizeDate(mergedPhotos[0].exif.dateTaken) 
      : metadata.date);

  const photoDates = mergedPhotos
    .map((p) => normalizeDate(p.exif?.dateTaken))
    .filter(Boolean)
    .sort();

  const startDate = existingAlbumData?.startDate || photoDates[0] || null;
  const endDate = existingAlbumData?.endDate || photoDates[photoDates.length - 1] || null;

  // Tags - merge existing with new auto-generated tags
  const autoTags = new Set();
  mergedPhotos.forEach((p) => {
    if (p.exif?.camera) {
      const brand = p.exif.camera.split(' ')[0];
      if (brand) autoTags.add(brand);
    }
  });
  const existingTags = existingAlbumData?.tags || metadata.tags || [];
  const allTags = [...new Set([...existingTags, ...Array.from(autoTags)])];

  // Location - preserve existing coordinates
  const existingPrimaryLocation = existingAlbumData?.primaryLocation;
  const locationData = albumLocations[albumSlug];
  const primaryLocation = (existingPrimaryLocation && 
      typeof existingPrimaryLocation.lat === 'number' && 
      typeof existingPrimaryLocation.lng === 'number')
    ? existingPrimaryLocation // Preserve existing coordinates
    : locationData && 
      locationData.defaultLocation && 
      locationData.defaultLocation.lat !== null && 
      locationData.defaultLocation.lng !== null
    ? {
        name: locationData.albumTitle || metadata.title,
        lat: locationData.defaultLocation.lat,
        lng: locationData.defaultLocation.lng
      }
    : {
        name: metadata.title,
        lat: null,
        lng: null
      };

  // Preserve all existing album metadata, only update what's necessary
  const albumData = {
    ...existingAlbumData, // Preserve any other custom fields
    id: albumSlug,
    slug: albumSlug,
    title: metadata.title || existingAlbumData?.title || albumSlug,
    description: metadata.description !== undefined ? metadata.description : (existingAlbumData?.description || null),
    tags: allTags,
    date: albumDate,
    startDate,
    endDate,
    cover: coverPhoto.path || coverPhoto.pathLarge || coverPhoto.path,
    coverAspectRatio: coverPhoto.aspectRatio,
    count: mergedPhotos.length,
    isFavorite: metadata.isFavorite !== undefined ? metadata.isFavorite : (existingAlbumData?.isFavorite || false),
    primaryLocation,
    photos: mergedPhotos
  };

  const albumJsonPath = path.join(options.contentDir, 'albums', `${albumSlug}.json`);
  await ensureDir(path.dirname(albumJsonPath));
  await fsp.writeFile(albumJsonPath, JSON.stringify(albumData, null, 2));
  console.log(`  ✓ Wrote album JSON: ${path.relative(ROOT, albumJsonPath)}`);

  return {
    id: albumSlug,
    slug: albumSlug,
    title: metadata.title,
    description: metadata.description,
    tags: allTags,
    date: metadata.date,
    startDate,
    endDate,
    cover: coverPhoto.path,
    coverAspectRatio: coverPhoto.aspectRatio,
    count: photos.length,
    isFavorite: metadata.isFavorite,
    primaryLocation
  };
}

async function writeAlbumsIndex(contentDir, albumsList) {
  const indexPath = path.join(contentDir, 'albums.json');
  
  // Load existing albums.json to preserve manually entered covers, geo data, and favorites
  let existingAlbums = new Map(); // Map<slug, { cover?, coverAspectRatio?, primaryLocation?, isFavorite? }>
  if (existsSync(indexPath)) {
    try {
      const existingData = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
      if (existingData.albums && Array.isArray(existingData.albums)) {
        existingData.albums.forEach(album => {
          const preserved = {};
          let hasPreservedData = false;
          
          // Preserve manual cover and coverAspectRatio if they exist
          if (album.cover && typeof album.cover === 'string' && album.cover.trim() !== '') {
            preserved.cover = album.cover;
            hasPreservedData = true;
            // Also preserve coverAspectRatio if it exists
            if (typeof album.coverAspectRatio === 'number' && !isNaN(album.coverAspectRatio)) {
              preserved.coverAspectRatio = album.coverAspectRatio;
            }
          }
          
          // Preserve geo data if valid coordinates exist (manual input)
          if (album.primaryLocation && 
              typeof album.primaryLocation.lat === 'number' && 
              typeof album.primaryLocation.lng === 'number' &&
              !isNaN(album.primaryLocation.lat) &&
              !isNaN(album.primaryLocation.lng)) {
            preserved.primaryLocation = album.primaryLocation;
            hasPreservedData = true;
          }
          
          // Preserve isFavorite if it's explicitly set (true or false)
          if (typeof album.isFavorite === 'boolean') {
            preserved.isFavorite = album.isFavorite;
            hasPreservedData = true;
          }
          
          if (hasPreservedData) {
            existingAlbums.set(album.slug, preserved);
          }
        });
      }
    } catch (err) {
      console.warn(`  ⚠ Could not read existing albums.json:`, err.message);
    }
  }
  
  // Preserve manual covers and other manual data from existing albums.json
  for (const album of albumsList) {
    const existingData = existingAlbums.get(album.slug);
    if (existingData) {
      if (existingData.cover) {
        album.cover = existingData.cover;
        if (existingData.coverAspectRatio) {
          album.coverAspectRatio = existingData.coverAspectRatio;
        }
      }
      if (existingData.primaryLocation) {
        album.primaryLocation = existingData.primaryLocation;
      }
      if (existingData.isFavorite !== undefined) {
        album.isFavorite = existingData.isFavorite;
      }
    }
  }
  
  await ensureDir(path.dirname(indexPath));
  await fsp.writeFile(indexPath, JSON.stringify({ albums: albumsList }, null, 2));
  console.log(`\n✅ Generated albums.json (${albumsList.length} album(s))`);
}

async function writeMapIndex(contentDir, albumsList) {
  const albumLocationsPath = path.join(contentDir, 'album-locations.json');
  let albumLocations = {};
  if (existsSync(albumLocationsPath)) {
    try {
      albumLocations = JSON.parse(fs.readFileSync(albumLocationsPath, 'utf-8'));
    } catch {
      albumLocations = {};
    }
  }

  const mapAlbums = [];
  let albumsWithGpsCount = 0;
  let albumsWithDefaultCount = 0;

  for (const album of albumsList) {
    const albumJsonPath = path.join(contentDir, 'albums', `${album.slug}.json`);
    if (!existsSync(albumJsonPath)) continue;

    const albumData = JSON.parse(fs.readFileSync(albumJsonPath, 'utf-8'));
    const photos = albumData.photos || [];

    // Collect all valid GPS coordinates from photos
    const validGpsPhotos = [];
    let hasDefaultLocation = false;
    let defaultLat = null;
    let defaultLng = null;

    for (const photo of photos) {
      if (typeof photo.lat === 'number' && typeof photo.lng === 'number') {
        validGpsPhotos.push({ lat: photo.lat, lng: photo.lng, dateTaken: photo.exif?.dateTaken || null });
      }
    }

    // If no GPS photos, try album default location
    if (validGpsPhotos.length === 0) {
      const locationData = albumLocations[album.slug]?.defaultLocation;
      if (
        locationData &&
        typeof locationData.lat === 'number' &&
        typeof locationData.lng === 'number'
      ) {
        defaultLat = locationData.lat;
        defaultLng = locationData.lng;
        hasDefaultLocation = true;
        albumsWithDefaultCount++;
      } else if (
        album.primaryLocation &&
        typeof album.primaryLocation.lat === 'number' &&
        typeof album.primaryLocation.lng === 'number'
      ) {
        defaultLat = album.primaryLocation.lat;
        defaultLng = album.primaryLocation.lng;
        hasDefaultLocation = true;
        albumsWithDefaultCount++;
      }
    } else {
      albumsWithGpsCount++;
    }

    // Skip album if no location data available
    if (validGpsPhotos.length === 0 && !hasDefaultLocation) {
      continue;
    }

    // Calculate average location
    let avgLat, avgLng;
    if (validGpsPhotos.length > 0) {
      avgLat = validGpsPhotos.reduce((sum, p) => sum + p.lat, 0) / validGpsPhotos.length;
      avgLng = validGpsPhotos.reduce((sum, p) => sum + p.lng, 0) / validGpsPhotos.length;
    } else {
      avgLat = defaultLat;
      avgLng = defaultLng;
    }

    // Collect date range from photos with dates
    const dates = validGpsPhotos
      .map(p => p.dateTaken)
      .filter(Boolean)
      .sort();

    const albumEntry = {
      albumSlug: album.slug,
      albumTitle: album.title,
      lat: avgLat,
      lng: avgLng,
      photoCount: validGpsPhotos.length || photos.length,
      tags: album.tags || []
    };

    // Add date range if available
    if (dates.length > 0) {
      albumEntry.dateRange = {
        start: dates[0],
        end: dates[dates.length - 1]
      };
    }

    mapAlbums.push(albumEntry);
  }

  const mapIndexPath = path.join(contentDir, 'map.json');
  await fsp.writeFile(mapIndexPath, JSON.stringify({ albums: mapAlbums }, null, 2));

  console.log(`✅ Generated map.json with ${mapAlbums.length} album(s)`);
  console.log(`   ${albumsWithGpsCount} with GPS from photos`);
  console.log(`   ${albumsWithDefaultCount} with default location`);
}

async function main() {
  const options = parseArgs();
  options.inputDir = path.resolve(ROOT, options.inputDir);
  options.outputDir = path.resolve(ROOT, options.outputDir);
  options.contentDir = path.resolve(ROOT, options.contentDir);

  console.log('📸 Unified Import Pipeline');
  console.log('━'.repeat(60));
  console.log(`Input (originals): ${options.inputDir}`);
  console.log(`Output (WebP):     ${options.outputDir}`);
  console.log(`Content:           ${options.contentDir}`);
  console.log(`Mode:              ${options.force ? 'FORCE (overwrite)' : 'Incremental'}`);

  if (!existsSync(options.inputDir)) {
    console.error(`\n❌ Input directory does not exist: ${options.inputDir}`);
    process.exit(1);
  }

  await ensureDir(options.outputDir);
  await ensureDir(path.join(options.contentDir, 'albums'));
  await ensureDir(path.join(options.contentDir, 'site'));
  await ensureDir(path.join(options.contentDir, 'trips'));

  const albumFolders = getAlbumFolders(options.inputDir);
  if (albumFolders.length === 0) {
    console.warn('\n⚠ No album folders found. Add folders to photo-source/originals/.');
    await writeAlbumsIndex(options.contentDir, []);
    await writeMapIndex(options.contentDir, []);
    return;
  }

  console.log(`\nFound ${albumFolders.length} album folder(s):`);
  albumFolders.forEach((folder) => console.log(`  - ${folder}`));

  const albumLocations = await loadAlbumLocations(options.contentDir);
  const albumsList = [];

  for (const albumName of albumFolders) {
    const summary = await processAlbum({ albumName, options, albumLocations });
    if (summary) albumsList.push(summary);
  }

  // Sort albums: newest date first, then title
  albumsList.sort((a, b) => {
    if (a.date && b.date) return b.date.localeCompare(a.date);
    if (a.date) return -1;
    if (b.date) return 1;
    return a.title.localeCompare(b.title);
  });

  // Ensure supporting config exists (preserve user edits)
  await ensureAlbumLocationsConfig(options.contentDir, albumsList);

  await writeAlbumsIndex(options.contentDir, albumsList);
  await writeMapIndex(options.contentDir, albumsList);

  console.log('\n✅ Import complete!');
}

main().catch((err) => {
  console.error('\n❌ Fatal error:', err);
  process.exit(1);
});



