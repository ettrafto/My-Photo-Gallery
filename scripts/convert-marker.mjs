import sharp from 'sharp';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

const svgPath = join(ROOT, 'public', 'icons', 'marker.svg');
const pngPath = join(ROOT, 'public', 'icons', 'marker.png');

try {
  // Read SVG file
  const svgBuffer = readFileSync(svgPath);
  
  // Convert SVG to PNG with high resolution (128x128 for map markers)
  // The SVG viewBox is 162.24 x 207.58, so we'll maintain aspect ratio
  // Using 128px width, height will be calculated automatically
  await sharp(svgBuffer)
    .resize(128, 128, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 } // Transparent background
    })
    .png()
    .toFile(pngPath);
  
  console.log('✅ Successfully converted marker.svg to marker.png');
  console.log(`   Output: ${pngPath}`);
} catch (error) {
  console.error('❌ Error converting marker:', error.message);
  process.exit(1);
}
