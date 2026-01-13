#!/usr/bin/env node

/**
 * Update individual album JSON files with cover data from albums.json
 * 
 * This script reads albums.json and updates the cover and coverAspectRatio
 * fields in each corresponding individual album JSON file.
 * 
 * Usage: node scripts/albumUpdate.mjs
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

async function updateAlbumFiles() {
  console.log('🔄 Updating individual album files from albums.json...\n');

  // Load albums.json
  if (!fs.existsSync(INDEX_PATH)) {
    console.error('❌ albums.json not found:', INDEX_PATH);
    process.exit(1);
  }

  let albumsIndex;
  try {
    const indexData = JSON.parse(fs.readFileSync(INDEX_PATH, 'utf-8'));
    albumsIndex = indexData.albums || [];
  } catch (err) {
    console.error('❌ Failed to parse albums.json:', err.message);
    process.exit(1);
  }

  if (albumsIndex.length === 0) {
    console.log('⚠ No albums found in albums.json');
    return;
  }

  console.log(`Found ${albumsIndex.length} album(s) in albums.json\n`);

  // Create a map of slug -> album data for quick lookup
  const albumsMap = new Map();
  albumsIndex.forEach(album => {
    albumsMap.set(album.slug, album);
  });

  // Get all album JSON files
  if (!fs.existsSync(ALBUMS_DIR)) {
    console.error('❌ Albums directory not found:', ALBUMS_DIR);
    process.exit(1);
  }

  const albumFiles = fs.readdirSync(ALBUMS_DIR)
    .filter(file => file.endsWith('.json'))
    .map(file => path.join(ALBUMS_DIR, file));

  if (albumFiles.length === 0) {
    console.log('⚠ No album JSON files found');
    return;
  }

  let updatedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const albumFile of albumFiles) {
    const filename = path.basename(albumFile);
    const slug = filename.replace('.json', '');

    try {
      // Load individual album file
      const albumData = JSON.parse(fs.readFileSync(albumFile, 'utf-8'));

      // Check if this album exists in albums.json
      const indexAlbum = albumsMap.get(slug);
      if (!indexAlbum) {
        console.log(`  ⚠ Skipping ${slug} - not found in albums.json`);
        skippedCount++;
        continue;
      }

      // Check if cover data needs updating
      const coverChanged = albumData.cover !== indexAlbum.cover;
      const aspectRatioChanged = albumData.coverAspectRatio !== indexAlbum.coverAspectRatio;

      if (!coverChanged && !aspectRatioChanged) {
        console.log(`  ✓ ${slug} - already up to date`);
        skippedCount++;
        continue;
      }

      // Store old values for logging
      const oldCover = albumData.cover;
      const oldAspectRatio = albumData.coverAspectRatio;

      // Update cover and coverAspectRatio
      albumData.cover = indexAlbum.cover;
      albumData.coverAspectRatio = indexAlbum.coverAspectRatio;

      // Write updated album file
      fs.writeFileSync(albumFile, JSON.stringify(albumData, null, 2));
      
      console.log(`  ✓ ${slug} - updated`);
      if (coverChanged) {
        console.log(`    Cover: ${oldCover} → ${indexAlbum.cover}`);
      }
      if (aspectRatioChanged) {
        console.log(`    AspectRatio: ${oldAspectRatio} → ${indexAlbum.coverAspectRatio}`);
      }
      
      updatedCount++;
    } catch (err) {
      console.error(`  ❌ Failed to update ${filename}:`, err.message);
      errorCount++;
    }
  }

  console.log(`\n✅ Update complete!`);
  console.log(`   ${updatedCount} album(s) updated`);
  console.log(`   ${skippedCount} album(s) skipped (already up to date or not in index)`);
  if (errorCount > 0) {
    console.log(`   ${errorCount} error(s)`);
  }
}

updateAlbumFiles().catch(err => {
  console.error('❌ Error updating albums:', err);
  process.exit(1);
});

