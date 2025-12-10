import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'content');
const DEST = path.join(ROOT, 'dist', 'content');

function copyDir(src, dest) {
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      fs.mkdirSync(destPath, { recursive: true });
      copyDir(srcPath, destPath);
    } else if (entry.isFile()) {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

if (fs.existsSync(SRC)) {
  fs.mkdirSync(DEST, { recursive: true });
  copyDir(SRC, DEST);
  console.log('✅ Copied content/ to dist/content');
} else {
  console.warn('⚠ No content directory found to copy');
}


