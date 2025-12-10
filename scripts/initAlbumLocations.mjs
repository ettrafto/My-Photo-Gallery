import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import slugify from 'slugify';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = path.resolve(__dirname, '..');
const IMAGES_DIR = path.join(ROOT, 'public', 'images');
const CONTENT_DIR = path.join(ROOT, 'content');
const ALBUM_LOCATIONS_FILE = path.join(CONTENT_DIR, 'album-locations.json');

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
 * Convert slug to title by capitalizing words
 */
function slugToTitle(slug) {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Initialize or update album locations config
 */
async function initAlbumLocations() {
  console.log('🗺️  Initializing album location configuration...\n');

  // Ensure content directory exists
  fs.mkdirSync(CONTENT_DIR, { recursive: true });

  // Load existing locations if file exists
  let existingLocations = {};
  if (fs.existsSync(ALBUM_LOCATIONS_FILE)) {
    try {
      existingLocations = JSON.parse(fs.readFileSync(ALBUM_LOCATIONS_FILE, 'utf-8'));
      console.log('✓ Loaded existing album-locations.json');
    } catch (err) {
      console.warn('⚠ Could not parse existing album-locations.json. Creating new one.', err.message);
    }
  } else {
    console.log('Creating new album-locations.json...');
  }

  // Get all album folders from public/images
  const albumFolders = getDirectories(IMAGES_DIR);
  const newLocations = {};
  let newAlbumsAdded = 0;
  let existingAlbumsPreserved = 0;

  console.log(`\nFound ${albumFolders.length} album(s):`);

  for (const albumName of albumFolders) {
    const albumSlug = slugify(albumName, { lower: true, strict: true });
    const albumTitle = slugToTitle(albumSlug);

    if (existingLocations[albumSlug]) {
      // Preserve existing entry (keeps manually-entered coordinates)
      newLocations[albumSlug] = existingLocations[albumSlug];
      console.log(`  • ${albumSlug} - preserved existing entry`);
      existingAlbumsPreserved++;
    } else {
      // Add new placeholder entry
      newLocations[albumSlug] = {
        albumSlug: albumSlug,
        albumTitle: albumTitle,
        defaultLocation: {
          lat: null,
          lng: null,
          accuracy: 'album-default'
        }
      };
      console.log(`  + ${albumSlug} - added new entry`);
      newAlbumsAdded++;
    }
  }

  // Write updated locations file
  fs.writeFileSync(ALBUM_LOCATIONS_FILE, JSON.stringify(newLocations, null, 2));

  console.log(`\n✅ Album locations config updated:`);
  console.log(`   ${newAlbumsAdded} new album(s) added`);
  console.log(`   ${existingAlbumsPreserved} existing album(s) preserved`);
  console.log(`\n📝 Edit ${ALBUM_LOCATIONS_FILE} to add coordinates.`);
  console.log('   Set lat/lng for albums without GPS EXIF data.');
}

// Run the initialization
initAlbumLocations().catch(err => {
  console.error('❌ Error during album location initialization:', err);
  process.exit(1);
});

