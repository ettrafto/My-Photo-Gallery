#!/usr/bin/env node

/**
 * Rebuild albums.json and map.json from individual album JSON files
 * Preserves manually entered geo data from albums.json - any primaryLocation
 * with valid coordinates in the existing albums.json will be kept and not
 * overwritten by data from individual album files.
 * Also generates map.json for the Globe component with all albums that have geo data.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const CONTENT_DIR = path.join(ROOT, 'content');
const ALBUMS_DIR = path.join(CONTENT_DIR, 'albums');
const INDEX_PATH = path.join(CONTENT_DIR, 'albums.json');
const MAP_PATH = path.join(CONTENT_DIR, 'map.json');

async function rebuildAlbumsIndex() {
  console.log('🔄 Rebuilding albums.json from individual album files...\n');

  if (!fs.existsSync(ALBUMS_DIR)) {
    console.error('❌ Albums directory not found:', ALBUMS_DIR);
    process.exit(1);
  }

  // Load existing albums.json to preserve manually entered geo data
  let existingAlbums = new Map();
  if (fs.existsSync(INDEX_PATH)) {
    try {
      const existingData = JSON.parse(fs.readFileSync(INDEX_PATH, 'utf-8'));
      if (existingData.albums && Array.isArray(existingData.albums)) {
        existingData.albums.forEach(album => {
          // Only preserve albums with valid coordinates (manual input)
          if (album.primaryLocation && 
              typeof album.primaryLocation.lat === 'number' && 
              typeof album.primaryLocation.lng === 'number' &&
              !isNaN(album.primaryLocation.lat) &&
              !isNaN(album.primaryLocation.lng)) {
            existingAlbums.set(album.slug, album.primaryLocation);
            console.log(`  📍 Preserving manual geo data for: ${album.slug}`);
          }
        });
      }
    } catch (err) {
      console.warn(`  ⚠ Could not read existing albums.json:`, err.message);
    }
  }

  // Load album-locations.json as fallback source for coordinates
  const ALBUM_LOCATIONS_PATH = path.join(CONTENT_DIR, 'album-locations.json');
  let albumLocations = {};
  if (fs.existsSync(ALBUM_LOCATIONS_PATH)) {
    try {
      albumLocations = JSON.parse(fs.readFileSync(ALBUM_LOCATIONS_PATH, 'utf-8'));
      console.log(`  ✓ Loaded album-locations.json as fallback source`);
    } catch (err) {
      console.warn(`  ⚠ Could not read album-locations.json:`, err.message);
    }
  }

  // Get all album JSON files
  const albumFiles = fs.readdirSync(ALBUMS_DIR)
    .filter(file => file.endsWith('.json'))
    .map(file => path.join(ALBUMS_DIR, file));

  if (albumFiles.length === 0) {
    console.log('⚠ No album JSON files found');
    return;
  }

  console.log(`\nFound ${albumFiles.length} album file(s)`);

  const albumsList = [];
  let preservedCount = 0;
  let updatedCount = 0;
  let fromAlbumLocationsCount = 0;

  for (const albumFile of albumFiles) {
    try {
      const albumData = JSON.parse(fs.readFileSync(albumFile, 'utf-8'));
      
      // Check if we have manually entered geo data to preserve
      const existingLocation = existingAlbums.get(albumData.slug);
      let primaryLocation;
      
      if (existingLocation) {
        // Use preserved manual geo data from albums.json
        primaryLocation = existingLocation;
        preservedCount++;
      } else {
        // Use geo data from individual album file
        primaryLocation = albumData.primaryLocation || {
          name: albumData.title,
          lat: null,
          lng: null
        };
        
        // If coordinates are null, try to use album-locations.json as fallback
        if ((primaryLocation.lat === null || primaryLocation.lng === null) &&
            albumLocations[albumData.slug]?.defaultLocation) {
          const defaultLoc = albumLocations[albumData.slug].defaultLocation;
          if (typeof defaultLoc.lat === 'number' && 
              typeof defaultLoc.lng === 'number' &&
              !isNaN(defaultLoc.lat) &&
              !isNaN(defaultLoc.lng)) {
            primaryLocation = {
              name: albumLocations[albumData.slug].albumTitle || albumData.title,
              lat: defaultLoc.lat,
              lng: defaultLoc.lng
            };
            fromAlbumLocationsCount++;
            console.log(`  📍 Using coordinates from album-locations.json for: ${albumData.slug}`);
          }
        }
        
        updatedCount++;
      }
      
      // Extract only the summary fields (exclude photos array)
      const albumSummary = {
        id: albumData.id,
        slug: albumData.slug,
        title: albumData.title,
        description: albumData.description,
        tags: albumData.tags || [],
        date: albumData.date,
        startDate: albumData.startDate,
        endDate: albumData.endDate,
        cover: albumData.cover,
        coverAspectRatio: albumData.coverAspectRatio,
        count: albumData.count,
        isFavorite: albumData.isFavorite,
        primaryLocation: primaryLocation
      };

      albumsList.push(albumSummary);
      console.log(`  ✓ ${albumSummary.slug} - ${albumSummary.title}`);
    } catch (err) {
      console.warn(`  ⚠ Failed to read ${path.basename(albumFile)}:`, err.message);
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

  // Write the index
  const indexData = { albums: albumsList };
  fs.writeFileSync(INDEX_PATH, JSON.stringify(indexData, null, 2));

  const albumsWithGeo = albumsList.filter(a => 
    a.primaryLocation && 
    typeof a.primaryLocation.lat === 'number' && 
    typeof a.primaryLocation.lng === 'number' &&
    !isNaN(a.primaryLocation.lat) &&
    !isNaN(a.primaryLocation.lng)
  );

  console.log(`\n✅ Rebuilt albums.json with ${albumsList.length} album(s)`);
  if (preservedCount > 0) {
    console.log(`   ${preservedCount} with preserved manual geo data from albums.json`);
  }
  if (fromAlbumLocationsCount > 0) {
    console.log(`   ${fromAlbumLocationsCount} with coordinates from album-locations.json`);
  }
  console.log(`   ${updatedCount} updated from album files`);
  console.log(`   ${albumsWithGeo.length} total with geo location data`);
  console.log(`   ${albumsList.length - albumsWithGeo.length} without location data`);

  // Generate map.json for Globe component with albums that have geo data
  console.log('\n🌍 Generating map.json for Globe component...');
  const mapAlbums = albumsWithGeo.map(album => {
    const mapAlbum = {
      albumSlug: album.slug,
      albumTitle: album.title,
      lat: album.primaryLocation.lat,
      lng: album.primaryLocation.lng,
      photoCount: album.count || 0,
      tags: album.tags || []
    };

    // Add dateRange if we have startDate and endDate
    if (album.startDate && album.endDate) {
      // Convert YYYY-MM-DD to ISO format for dateRange
      const startDate = album.startDate.includes('T') 
        ? album.startDate 
        : `${album.startDate}T00:00:00.000Z`;
      const endDate = album.endDate.includes('T')
        ? album.endDate
        : `${album.endDate}T23:59:59.999Z`;
      
      mapAlbum.dateRange = {
        start: startDate,
        end: endDate
      };
    }

    return mapAlbum;
  });

  const mapData = { albums: mapAlbums };
  fs.writeFileSync(MAP_PATH, JSON.stringify(mapData, null, 2));
  
  console.log(`   ✅ Generated map.json with ${mapAlbums.length} album node(s) for Globe`);
}

rebuildAlbumsIndex().catch(err => {
  console.error('❌ Error rebuilding albums index:', err);
  process.exit(1);
});
