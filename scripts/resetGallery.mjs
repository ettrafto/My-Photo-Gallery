#!/usr/bin/env node
/**
 * Reset Gallery (albums + photos) WITHOUT touching other metadata.
 *
 * What it deletes (derived/generated):
 *  - content/albums/           (per-album manifests)
 *  - content/albums.json       (albums index)
 *  - content/map.json          (map index)
 *  - public/photos/            (processed WebP outputs from import:photos / process:photos)
 *  - public/images/            (legacy source images used by scan.mjs)
 *
 * What it does NOT touch:
 *  - photo-source/originals/   (your originals)
 *  - content/site/, content/trips/, content/album-locations.json, content/favorites.json, etc.
 *
 * Usage:
 *  - npm run reset:gallery
 *  - npm run reset:gallery -- --dry-run
 *  - npm run reset:gallery -- --keep-public-images
 *  - npm run reset:gallery -- --keep-public-photos
 */

import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {
    dryRun: false,
    keepPublicImages: false,
    keepPublicPhotos: false,
  };

  for (const arg of args) {
    if (arg === '--dry-run') opts.dryRun = true;
    else if (arg === '--keep-public-images') opts.keepPublicImages = true;
    else if (arg === '--keep-public-photos') opts.keepPublicPhotos = true;
    else if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    } else {
      console.warn(`⚠ Unknown arg: ${arg}`);
    }
  }

  return opts;
}

function printHelp() {
  console.log(`
Reset Gallery (albums + photos)

Deletes derived/generated:
  - content/albums/
  - content/albums.json
  - content/map.json
  - public/photos/
  - public/images/

Preserves:
  - photo-source/originals/ (your originals)
  - all other content/* metadata (site, trips, album-locations, favorites, etc.)

Usage:
  npm run reset:gallery
  npm run reset:gallery -- --dry-run
  npm run reset:gallery -- --keep-public-images
  npm run reset:gallery -- --keep-public-photos
`);
}

function isPathInsideRoot(absPath) {
  const rel = path.relative(ROOT, absPath);
  return rel && !rel.startsWith('..') && !path.isAbsolute(rel);
}

async function safeRm(relPath, { dryRun } = {}) {
  const absPath = path.resolve(ROOT, relPath);

  if (!isPathInsideRoot(absPath)) {
    throw new Error(`Refusing to delete outside project root: ${absPath}`);
  }

  if (!existsSync(absPath)) {
    console.log(`- (missing) ${relPath}`);
    return;
  }

  if (dryRun) {
    console.log(`- (dry-run) delete ${relPath}`);
    return;
  }

  await fs.rm(absPath, { recursive: true, force: true });
  console.log(`- deleted ${relPath}`);
}

async function writeJson(relPath, data, { dryRun } = {}) {
  const absPath = path.resolve(ROOT, relPath);
  if (!isPathInsideRoot(absPath)) {
    throw new Error(`Refusing to write outside project root: ${absPath}`);
  }

  if (dryRun) {
    console.log(`- (dry-run) write ${relPath}`);
    return;
  }

  await fs.mkdir(path.dirname(absPath), { recursive: true });
  await fs.writeFile(absPath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
  console.log(`- wrote ${relPath}`);
}

async function main() {
  const opts = parseArgs();

  console.log('🧹 Reset Gallery (albums + photos)');
  console.log('━'.repeat(60));
  console.log(`Root:   ${ROOT}`);
  console.log(`Mode:   ${opts.dryRun ? 'DRY RUN' : 'DELETE'}`);
  console.log(`Keep:   public/images = ${opts.keepPublicImages ? 'YES' : 'NO'}`);
  console.log(`Keep:   public/photos = ${opts.keepPublicPhotos ? 'YES' : 'NO'}`);
  console.log('');

  // Derived content
  await safeRm('content/albums', { dryRun: opts.dryRun });
  await safeRm('content/albums.json', { dryRun: opts.dryRun });
  await safeRm('content/map.json', { dryRun: opts.dryRun });

  // Derived photos
  if (!opts.keepPublicPhotos) {
    await safeRm('public/photos', { dryRun: opts.dryRun });
  } else {
    console.log('- (kept) public/photos');
  }

  if (!opts.keepPublicImages) {
    await safeRm('public/images', { dryRun: opts.dryRun });
  } else {
    console.log('- (kept) public/images');
  }

  // Recreate empty indexes so the app boots without fetch errors.
  await writeJson('content/albums.json', { albums: [] }, { dryRun: opts.dryRun });
  await writeJson('content/map.json', { photos: [] }, { dryRun: opts.dryRun });

  console.log('');
  console.log('✅ Done.');
  console.log('');
  console.log('Next steps:');
  console.log('- Rebuild from originals: npm run import:photos');
  console.log('- Or (legacy): add images to public/images/ and run npm run scan');
}

main().catch((err) => {
  console.error('\n❌ Reset failed:\n', err);
  process.exit(1);
});


