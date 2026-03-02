import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'content');
const DEST = path.join(ROOT, 'dist', 'content');

/** Deep-merge secrets into base config (secrets overwrite base values) */
function deepMerge(base, secrets) {
  const result = { ...base };
  for (const key of Object.keys(secrets)) {
    if (secrets[key] !== null && typeof secrets[key] === 'object' && !Array.isArray(secrets[key])) {
      result[key] = deepMerge(base[key] || {}, secrets[key]);
    } else {
      result[key] = secrets[key];
    }
  }
  return result;
}

function copyDir(src, dest) {
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      fs.mkdirSync(destPath, { recursive: true });
      copyDir(srcPath, destPath);
    } else if (entry.isFile()) {
      // Never copy secrets file to dist
      if (entry.name === 'site.secrets.json') continue;
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

if (fs.existsSync(SRC)) {
  fs.mkdirSync(DEST, { recursive: true });
  copyDir(SRC, DEST);

  // Merge site.secrets.json into site.json when writing to dist
  const siteJsonPath = path.join(SRC, 'site', 'site.json');
  const secretsPath = path.join(SRC, 'site', 'site.secrets.json');
  const destSiteJsonPath = path.join(DEST, 'site', 'site.json');

  if (fs.existsSync(secretsPath) && fs.existsSync(destSiteJsonPath)) {
    const siteConfig = JSON.parse(fs.readFileSync(siteJsonPath, 'utf-8'));
    const secrets = JSON.parse(fs.readFileSync(secretsPath, 'utf-8'));
    const merged = deepMerge(siteConfig, secrets);
    fs.writeFileSync(destSiteJsonPath, JSON.stringify(merged, null, 2), 'utf-8');
    console.log('✅ Copied content/ to dist/content (merged site.secrets.json)');
  } else {
    console.log('✅ Copied content/ to dist/content');
  }
} else {
  console.warn('⚠ No content directory found to copy');
}


