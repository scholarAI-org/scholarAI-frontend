// Regenerates the app icons from the brand logo. Run with:
//   node scripts/generate-icons.mjs
// The source is the only logo asset in the repo; the wordmark at its foot is
// cropped away because it is unreadable below ~64px, so every icon shows the
// symbol alone on a square canvas.
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = fileURLToPath(new URL('..', import.meta.url));
const SOURCE = path.join(root, 'public/images/logo-icon.png');
// Opaque bounds of the symbol alone. The "Ps Scolar" wordmark sits below it,
// past the blank band at y≈275, and is cropped away.
const SYMBOL = { left: 30, top: 9, width: 283, height: 264 };
const PADDING_RATIO = 0.08;
// Brand green sampled from the logo: opaque backgrounds (iOS, PWA) need a colour.
const BACKGROUND = '#ffffff';

async function symbolOnSquare(size, { background = { r: 0, g: 0, b: 0, alpha: 0 } } = {}) {
  const trimmed = await sharp(SOURCE).extract(SYMBOL).toBuffer();
  const inner = Math.round(size * (1 - PADDING_RATIO * 2));
  const symbol = await sharp(trimmed)
    .resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();
  return sharp({
    create: { width: size, height: size, channels: 4, background },
  })
    .composite([{ input: symbol, gravity: 'center' }])
    .png()
    .toBuffer();
}

const targets = [
  { file: 'src/app/icon.png', size: 32 },
  { file: 'src/app/apple-icon.png', size: 180, background: BACKGROUND },
  { file: 'public/icon-192.png', size: 192 },
  { file: 'public/icon-512.png', size: 512 },
  // Source for favicon.ico; the .ico itself is assembled below.
  { file: null, size: 48 },
];

mkdirSync(path.join(root, 'public'), { recursive: true });

for (const { file, size, background } of targets) {
  if (!file) continue;
  const png = await symbolOnSquare(size, background ? { background } : undefined);
  await sharp(png).toFile(path.join(root, file));
  console.log(`${file} (${size}x${size})`);
}

// favicon.ico: 16/32/48 in one file, built by hand so no extra dependency is needed.
const sizes = [16, 32, 48];
const images = await Promise.all(sizes.map((size) => symbolOnSquare(size)));
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(sizes.length, 4);
let offset = 6 + 16 * sizes.length;
const entries = [];
for (const [index, size] of sizes.entries()) {
  const entry = Buffer.alloc(16);
  entry.writeUInt8(size === 256 ? 0 : size, 0);
  entry.writeUInt8(size === 256 ? 0 : size, 1);
  entry.writeUInt8(0, 2);
  entry.writeUInt8(0, 3);
  entry.writeUInt16LE(1, 4);
  entry.writeUInt16LE(32, 6);
  entry.writeUInt32LE(images[index].length, 8);
  entry.writeUInt32LE(offset, 12);
  offset += images[index].length;
  entries.push(entry);
}
const ico = Buffer.concat([header, ...entries, ...images]);
const { writeFileSync } = await import('node:fs');
writeFileSync(path.join(root, 'src/app/favicon.ico'), ico);
console.log(`src/app/favicon.ico (${sizes.join('/')})`);
