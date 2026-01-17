import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import exifr from 'exifr';
import slugify from 'slugify';

// NOTE: This script is retained for legacy use. Prefer `npm run import:photos`
// which processes originals, generates WebP variants, and writes album JSON in
// one step.

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = path.resolve(__dirname, '..');
const IMAGES_DIR = path.join(ROOT, 'public', 'images');
const CONTENT_DIR = path.join(ROOT, 'content');

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.heic', '.heif'];

/**
 * Check if a file is an image based on extension
 */
function isImageFile(filename) {
  const ext = path.extname(filename).toLowerCase();
  return IMAGE_EXTENSIONS.includes(ext);
}

/**
 * Get all subdirectories in a directory
 */
function getDirectories(dirPath) {
  if (!fs.existsSync(dirPath)) {
    return [];
  }
  return fs.readdirSync(dirPath, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);
}

/**
 * Get all image files in a directory
 */
function getImageFiles(dirPath) {
  if (!fs.existsSync(dirPath)) {
    return [];
  }
  return fs.readdirSync(dirPath)
    .filter(file => isImageFile(file))
    .sort();
}

/**
 * Extract EXIF data from an image
 */
async function extractExif(imagePath) {
  try {
    const exif = await exifr.parse(imagePath, {
      pick: [
        'Make', 'Model', 'LensModel', 'FNumber', 'ExposureTime', 
        'ISO', 'DateTimeOriginal', 'FocalLength', 'Copyright',
        'Artist', 'ImageDescription',
        'latitude', 'longitude', 'GPSLatitude', 'GPSLongitude',
        'GPSLatitudeRef', 'GPSLongitudeRef'
      ]
    });
    return exif || {};
  } catch (err) {
    console.warn(`Could not extract EXIF from ${imagePath}:`, err.message);
    return {};
  }
}

/**
 * Get image dimensions and calculate aspect ratio
 */
async function getImageDimensions(imagePath) {
  try {
    const basic = await exifr.parse(imagePath, { pick: ['ImageWidth', 'ImageHeight'] });
    if (basic && basic.ImageWidth && basic.ImageHeight) {
      return {
        width: basic.ImageWidth,
        height: basic.ImageHeight,
        aspectRatio: basic.ImageWidth / basic.ImageHeight
      };
    }
  } catch (err) {
    // Ignore errors
  }
  return { width: null, height: null, aspectRatio: 1.5 }; // default aspect ratio
}

/**
 * Process a single image file
 */
async function processImage(albumPath, filename, albumSlug) {
  const imagePath = path.join(albumPath, filename);
  // Use the actual folder name from albumPath (preserves case)
  const albumFolder = path.basename(albumPath);
  const relativePath = `images/${albumFolder}/${filename}`.replace(/\\/g, '/');
  
  const [exif, dimensions] = await Promise.all([
    extractExif(imagePath),
    getImageDimensions(imagePath)
  ]);

  // Convert GPS data to decimal coordinates
  let lat = null;
  let lng = null;

  if (typeof exif.latitude === 'number' && typeof exif.longitude === 'number') {
    // Already in decimal format
    lat = exif.latitude;
    lng = exif.longitude;
  } else if (exif.GPSLatitude && exif.GPSLongitude) {
    // Convert from DMS (degrees, minutes, seconds) array to decimal
    const toDecimal = (value, ref) => {
      if (Array.isArray(value)) {
        const [deg, min, sec] = value;
        let dec = deg + (min || 0) / 60 + (sec || 0) / 3600;
        if (ref === 'S' || ref === 'W') dec = -dec;
        return dec;
      }
      return null;
    };
    
    lat = toDecimal(exif.GPSLatitude, exif.GPSLatitudeRef);
    lng = toDecimal(exif.GPSLongitude, exif.GPSLongitudeRef);
  }

  return {
    filename,
    path: relativePath,
    lat,
    lng,
    ...dimensions,
    exif: {
      camera: exif.Make && exif.Model ? `${exif.Make} ${exif.Model}` : null,
      lens: exif.LensModel || null,
      aperture: exif.FNumber ? `f/${exif.FNumber}` : null,
      shutterSpeed: exif.ExposureTime ? formatShutterSpeed(exif.ExposureTime) : null,
      iso: exif.ISO || null,
      focalLength: exif.FocalLength ? `${Math.round(exif.FocalLength)}mm` : null,
      dateTaken: exif.DateTimeOriginal || null,
      copyright: exif.Copyright || null,
      artist: exif.Artist || null,
      description: exif.ImageDescription || null
    }
  };
}

/**
 * Format shutter speed from decimal to fraction
 */
function formatShutterSpeed(speed) {
  if (speed >= 1) {
    return `${speed}s`;
  }
  const denominator = Math.round(1 / speed);
  return `1/${denominator}s`;
}

/**
 * Process a single album folder
 */
async function processAlbum(albumName) {
  const albumPath = path.join(IMAGES_DIR, albumName);
  const albumSlug = slugify(albumName, { lower: true, strict: true });
  
  console.log(`\nProcessing album: ${albumName} (${albumSlug})`);

  // Check for optional _album.json metadata
  const metaPath = path.join(albumPath, '_album.json');
  let metadata = {
    title: albumName,
    tags: [],
    date: null,
    cover: null,
    description: null,
    isFavorite: false
  };

  if (fs.existsSync(metaPath)) {
    try {
      const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
      metadata = { ...metadata, ...meta };
      console.log(`  ✓ Found metadata file`);
    } catch (err) {
      console.warn(`  ⚠ Could not parse _album.json:`, err.message);
    }
  }

  // Get all image files
  const imageFiles = getImageFiles(albumPath).filter(f => f !== '_album.json');
  
  if (imageFiles.length === 0) {
    console.log(`  ⚠ No images found, skipping`);
    return null;
  }

  console.log(`  Found ${imageFiles.length} images`);

  // Process all images
  const photos = [];
  for (const filename of imageFiles) {
    const photo = await processImage(albumPath, filename, albumSlug);
    photos.push(photo);
  }

  // Determine cover image
  const coverPhoto = metadata.cover 
    ? photos.find(p => p.filename === metadata.cover) || photos[0]
    : photos[0];

  // Auto-detect date from first photo if not set
  if (!metadata.date && photos[0]?.exif?.dateTaken) {
    const rawDate = photos[0].exif.dateTaken;
    let dateStr;

    if (rawDate instanceof Date) {
      // Format Date object as YYYY-MM-DD
      dateStr = rawDate.toISOString().slice(0, 10);
    } else {
      // Fallback: treat as string, split on space or 'T',
      // and normalize "YYYY:MM:DD" to "YYYY-MM-DD"
      const str = String(rawDate);
      dateStr = str.split(/[ T]/)[0].replace(/:/g, '-');
    }

    metadata.date = dateStr;
  }

  // Compute startDate and endDate from photo EXIF dates
  let startDate = null;
  let endDate = null;
  const photoDates = photos
    .map(p => p.exif?.dateTaken)
    .filter(Boolean)
    .map(d => {
      if (d instanceof Date) {
        return d.toISOString().slice(0, 10);
      } else {
        const str = String(d);
        return str.split(/[ T]/)[0].replace(/:/g, '-');
      }
    })
    .filter(d => d && d.match(/^\d{4}-\d{2}-\d{2}$/));

  if (photoDates.length > 0) {
    photoDates.sort();
    startDate = photoDates[0];
    endDate = photoDates[photoDates.length - 1];
  }

  // Aggregate tags: manual tags + auto-tags from camera/lens
  const autoTags = new Set();
  photos.forEach(photo => {
    if (photo.exif?.camera) {
      // Extract camera brand
      const cameraParts = photo.exif.camera.split(' ');
      if (cameraParts[0]) autoTags.add(cameraParts[0]);
    }
  });
  const allTags = [...new Set([...metadata.tags, ...Array.from(autoTags)])];

  // Load album locations for primaryLocation
  const albumLocationsPath = path.join(CONTENT_DIR, 'album-locations.json');
  let primaryLocation = {
    name: metadata.title,
    lat: null,
    lng: null
  };
  
  if (fs.existsSync(albumLocationsPath)) {
    try {
      const albumLocations = JSON.parse(fs.readFileSync(albumLocationsPath, 'utf-8'));
      const locationData = albumLocations[albumSlug];
      if (locationData?.defaultLocation) {
        primaryLocation = {
          name: locationData.albumTitle || metadata.title,
          lat: locationData.defaultLocation.lat,
          lng: locationData.defaultLocation.lng
        };
      }
    } catch (err) {
      // Silently continue if album-locations.json can't be read
    }
  }

  const albumData = {
    id: albumSlug,
    slug: albumSlug,
    title: metadata.title,
    description: metadata.description,
    tags: allTags,
    date: metadata.date,
    startDate: startDate,
    endDate: endDate,
    cover: coverPhoto.path,
    coverAspectRatio: coverPhoto.aspectRatio,
    count: photos.length,
    isFavorite: metadata.isFavorite,
    primaryLocation: primaryLocation,
    photos
  };

  // Write individual album manifest
  const albumJsonPath = path.join(CONTENT_DIR, 'albums', `${albumSlug}.json`);
  fs.mkdirSync(path.dirname(albumJsonPath), { recursive: true });
  fs.writeFileSync(albumJsonPath, JSON.stringify(albumData, null, 2));
  
  console.log(`  ✓ Generated ${albumSlug}.json`);

  return {
    id: albumSlug,
    slug: albumSlug,
    title: metadata.title,
    description: metadata.description,
    tags: allTags,
    date: metadata.date,
    startDate: startDate,
    endDate: endDate,
    cover: coverPhoto.path,
    coverAspectRatio: coverPhoto.aspectRatio,
    count: photos.length,
    isFavorite: metadata.isFavorite,
    primaryLocation: primaryLocation
  };
}

/**
 * Main scan function
 */
async function scan() {
  console.log('🔍 Scanning images directory...\n');
  console.log(`Images: ${IMAGES_DIR}`);
  console.log(`Output: ${CONTENT_DIR}`);

  // Ensure content directory exists
  fs.mkdirSync(CONTENT_DIR, { recursive: true });

  // Load existing albums.json to preserve manually entered covers, geo data, and favorites
  const indexPath = path.join(CONTENT_DIR, 'albums.json');
  let existingAlbums = new Map(); // Map<slug, { cover?, coverAspectRatio?, primaryLocation?, isFavorite? }>
  if (fs.existsSync(indexPath)) {
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
            const preservedItems = [];
            if (preserved.cover) preservedItems.push('cover');
            if (preserved.primaryLocation) preservedItems.push('geo data');
            if (preserved.isFavorite !== undefined) preservedItems.push('favorite status');
            console.log(`  💾 Will preserve ${preservedItems.join(' and ')} for: ${album.slug}`);
          }
        });
      }
    } catch (err) {
      console.warn(`  ⚠ Could not read existing albums.json:`, err.message);
    }
  }

  // Get all album folders
  const albumFolders = getDirectories(IMAGES_DIR);
  
  if (albumFolders.length === 0) {
    console.log('\n⚠ No album folders found in public/images/');
    console.log('Create folders with images to get started!\n');
    
    // Create empty albums.json
    fs.writeFileSync(
      path.join(CONTENT_DIR, 'albums.json'),
      JSON.stringify({ albums: [] }, null, 2)
    );
    return;
  }

  console.log(`\nFound ${albumFolders.length} album folder(s):`);
  albumFolders.forEach(folder => console.log(`  - ${folder}`));

  // Process all albums
  const albumsList = [];
  for (const albumName of albumFolders) {
    const albumSummary = await processAlbum(albumName);
    if (albumSummary) {
      // Preserve manual cover and other manual data from existing albums.json
      const existingData = existingAlbums.get(albumSummary.slug);
      if (existingData) {
        if (existingData.cover) {
          albumSummary.cover = existingData.cover;
          if (existingData.coverAspectRatio) {
            albumSummary.coverAspectRatio = existingData.coverAspectRatio;
          }
        }
        if (existingData.primaryLocation) {
          albumSummary.primaryLocation = existingData.primaryLocation;
        }
        if (existingData.isFavorite !== undefined) {
          albumSummary.isFavorite = existingData.isFavorite;
        }
      }
      albumsList.push(albumSummary);
    }
  }

  // Sort albums by date (newest first), then by title
  albumsList.sort((a, b) => {
    if (a.date && b.date) {
      return b.date.localeCompare(a.date);
    }
    if (a.date) return -1;
    if (b.date) return 1;
    return a.title.localeCompare(b.title);
  });

  // Write master albums index
  fs.writeFileSync(indexPath, JSON.stringify({ albums: albumsList }, null, 2));

  console.log(`\n✅ Generated albums.json with ${albumsList.length} album(s)`);

  // Load album locations config for fallback coordinates
  const albumLocationsPath = path.join(CONTENT_DIR, 'album-locations.json');
  let albumLocations = {};
  if (fs.existsSync(albumLocationsPath)) {
    try {
      albumLocations = JSON.parse(fs.readFileSync(albumLocationsPath, 'utf-8'));
      console.log('✓ Loaded album-locations.json');
    } catch (err) {
      console.warn('⚠ Could not parse album-locations.json:', err.message);
    }
  } else {
    console.warn('⚠ album-locations.json not found. Run "npm run init-locations" to create it.');
  }

  // Build map index with geotagged photos
  console.log('\n📍 Building map index with location fallbacks...');
  const geoPhotos = [];
  let exifGpsCount = 0;
  let albumDefaultCount = 0;
  let skippedCount = 0;

  for (const album of albumsList) {
    const albumJsonPath = path.join(CONTENT_DIR, 'albums', `${album.slug}.json`);
    try {
      const albumData = JSON.parse(fs.readFileSync(albumJsonPath, 'utf-8'));
      const photos = albumData.photos || [];
      
      for (const photo of photos) {
        let lat = photo.lat;
        let lng = photo.lng;
        let accuracy = null;

        // Step 1: Try EXIF GPS data
        if (typeof lat === 'number' && typeof lng === 'number') {
          accuracy = 'exif';
          exifGpsCount++;
        }
        // Step 2: Fallback to album default location
        else if (albumLocations[album.slug]?.defaultLocation?.lat !== null && 
                 albumLocations[album.slug]?.defaultLocation?.lng !== null) {
          lat = albumLocations[album.slug].defaultLocation.lat;
          lng = albumLocations[album.slug].defaultLocation.lng;
          accuracy = 'album-default';
          albumDefaultCount++;
        }
        // Step 3: Skip photo if no GPS data available
        else {
          skippedCount++;
          continue;
        }

        geoPhotos.push({
          albumSlug: album.slug,
          albumTitle: album.title,
          filename: photo.filename,
          path: photo.path,
          lat: lat,
          lng: lng,
          accuracy: accuracy,
          dateTaken: photo.exif?.dateTaken || null,
          tags: album.tags || []
        });
      }
    } catch (err) {
      console.warn(`⚠ Could not read album JSON for geo index (${album.slug}):`, err.message);
    }
  }

  const mapIndexPath = path.join(CONTENT_DIR, 'map.json');
  fs.writeFileSync(mapIndexPath, JSON.stringify({ photos: geoPhotos }, null, 2));

  console.log(`\n✅ Generated map.json with ${geoPhotos.length} geotagged photo(s):`);
  console.log(`   ${exifGpsCount} from EXIF GPS`);
  console.log(`   ${albumDefaultCount} from album default location`);
  console.log(`   ${skippedCount} photo(s) skipped (no GPS, no album location)`);
  console.log(`\nDone! Run "npm run dev" to see your gallery.\n`);
}

// Run the scan
scan().catch(err => {
  console.error('❌ Error during scan:', err);
  process.exit(1);
});


