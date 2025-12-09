#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = path.resolve(__dirname, '..');
const IMAGES_DIR = path.join(ROOT, 'public', 'images');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function createAlbum() {
  console.log('\n📸 Create New Album\n');

  const folderName = await ask('Album folder name: ');
  if (!folderName) {
    console.log('❌ Folder name is required');
    rl.close();
    return;
  }

  const albumPath = path.join(IMAGES_DIR, folderName);

  if (fs.existsSync(albumPath)) {
    console.log(`❌ Album "${folderName}" already exists`);
    rl.close();
    return;
  }

  const title = await ask('Album title (optional, press Enter to skip): ') || folderName;
  const description = await ask('Description (optional): ');
  const tags = await ask('Tags (comma-separated, optional): ');
  const date = await ask('Date (YYYY-MM-DD, optional): ');

  // Create folder
  fs.mkdirSync(albumPath, { recursive: true });

  // Create metadata file
  const metadata = {
    title,
    ...(description && { description }),
    ...(tags && { tags: tags.split(',').map(t => t.trim()).filter(Boolean) }),
    ...(date && { date })
  };

  fs.writeFileSync(
    path.join(albumPath, '_album.json'),
    JSON.stringify(metadata, null, 2)
  );

  console.log(`\n✅ Created album: ${folderName}`);
  console.log(`📁 Location: ${albumPath}`);
  console.log('\nNext steps:');
  console.log(`1. Add images to: public/images/${folderName}/`);
  console.log('2. Run: npm run scan');
  console.log('3. Run: npm run dev\n');

  rl.close();
}

createAlbum().catch(err => {
  console.error('❌ Error:', err.message);
  rl.close();
  process.exit(1);
});





