import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const sizes = [48, 72, 96, 128, 144, 152, 180, 192, 256, 512];
const sourceIcon = join(__dirname, '../public/juicericons/icon-1024.png');

async function generateIcons() {
  try {
    for (const size of sizes) {
      const outputPath = join(__dirname, `../public/juicericons/icon-${size}.png`);
      await sharp(sourceIcon)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .png()
        .toFile(outputPath);
      console.log(`Generated ${size}x${size} icon`);
    }
    console.log('All icons generated successfully!');
  } catch (error) {
    console.error('Error generating icons:', error);
  }
}

generateIcons(); 