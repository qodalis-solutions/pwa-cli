// Generates every icon and splash image from the SVGs in resources/:
//   icon.svg             the full icon: a >_ prompt on the brand gradient
//   icon-foreground.svg  the prompt alone, on the 108dp adaptive icon canvas
//   icon-background.svg  the gradient alone, on the same canvas
// Outputs:
//   public/icons/*, public/favicon.ico   PWA icons (any + maskable), apple-touch-icon
//   android/app/src/main/res             launcher icons (legacy, round, adaptive) and splash
//   fastlane/.../icon.png                Google Play listing icon (512x512)
// Run with `npm run assets` after changing an SVG.
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import sharp from 'sharp';

const ICON = 'resources/icon.svg';
const FOREGROUND = 'resources/icon-foreground.svg';
const BACKGROUND = 'resources/icon-background.svg';
const SPLASH_BG = { r: 20, g: 34, b: 49, alpha: 1 }; // #142231, the brand navy
const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 };
const RES = 'android/app/src/main/res';

/** An SVG rendered to a `size` square PNG. */
function render(svg, size) {
  return sharp(svg, { density: Math.max(72, Math.ceil((72 * size) / 512) * 2) }).resize(size, size).png().toBuffer();
}

/** Keeps only the pixels inside `shape` (an SVG element on a `size` square). */
async function mask(png, size, shape) {
  const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">${shape}</svg>`);
  return sharp(png).composite([{ input: svg, blend: 'dest-in' }]).png().toBuffer();
}

const circle = (size) => `<circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}"/>`;
const squircle = (size) => `<rect width="${size}" height="${size}" rx="${size * 0.22}"/>`;

/** The icon as a rounded square or circle of `inner` px, centred on a transparent `size` square. */
async function shaped(size, inner, shape) {
  const icon = await mask(await render(ICON, inner), inner, shape(inner));
  return sharp({ create: { width: size, height: size, channels: 4, background: TRANSPARENT } })
    .composite([{ input: icon, gravity: 'center' }]).png().toBuffer();
}

/** A .ico holding PNG images (supported by every current browser). */
function ico(pngs) {
  const header = Buffer.alloc(6 + 16 * pngs.length);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(pngs.length, 4);
  let offset = header.length;
  pngs.forEach(({ size, data }, i) => {
    const entry = 6 + 16 * i;
    header.writeUInt8(size % 256, entry);
    header.writeUInt8(size % 256, entry + 1);
    header.writeUInt16LE(1, entry + 4);
    header.writeUInt16LE(32, entry + 6);
    header.writeUInt32LE(data.length, entry + 8);
    header.writeUInt32LE(offset, entry + 12);
    offset += data.length;
  });
  return Buffer.concat([header, ...pngs.map((p) => p.data)]);
}

async function save(path, buffer) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, buffer);
  console.log('wrote', path);
}

// PWA: "any" icons are a rounded square; maskable icons are the full-bleed tile
// (the prompt already sits inside the 80% safe zone). iOS rounds the corners itself.
for (const size of [48, 72, 96, 128, 144, 192, 256, 384, 512]) {
  await save(`public/icons/icon-${size}.png`, await shaped(size, size, squircle));
}
for (const size of [192, 512]) {
  await save(`public/icons/maskable-${size}.png`, await render(ICON, size));
}
await save('public/icons/apple-touch-icon.png', await render(ICON, 180));
await save('public/favicon.ico', ico(await Promise.all([16, 32, 48].map(async (size) =>
  ({ size, data: await shaped(size, size, squircle) })))));

// Android launcher icons per density (48dp base; adaptive layers are 108dp).
const densities = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };
for (const [name, scale] of Object.entries(densities)) {
  const legacy = Math.round(48 * scale);
  const adaptive = Math.round(108 * scale);
  await save(join(RES, `mipmap-${name}/ic_launcher.png`), await shaped(legacy, Math.round(legacy * 0.92), squircle));
  await save(join(RES, `mipmap-${name}/ic_launcher_round.png`), await shaped(legacy, Math.round(legacy * 0.92), circle));
  await save(join(RES, `mipmap-${name}/ic_launcher_foreground.png`), await render(FOREGROUND, adaptive));
  await save(join(RES, `mipmap-${name}/ic_launcher_background.png`), await render(BACKGROUND, adaptive));
  // Android 12+ splash icon: 240dp canvas, only the central 160dp circle shows.
  const splash = Math.round(240 * scale);
  await save(join(RES, `drawable-${name}/splash_icon.png`), await shaped(splash, Math.round(150 * scale), circle));
}

// Older Android versions draw this image as the launch screen: the icon small in
// the middle of the brand navy, on a square that survives portrait cropping.
const legacySplash = await shaped(360, 360, squircle);
await save(join(RES, 'drawable/splash.png'), await sharp({ create: { width: 1080, height: 1080, channels: 4, background: SPLASH_BG } })
  .composite([{ input: legacySplash, gravity: 'center' }]).png().toBuffer());

// Play Console listing icon: 512x512, full bleed, no transparency (Play applies its own mask).
await save('fastlane/metadata/android/en-US/images/icon.png', await sharp(await render(ICON, 512)).flatten({ background: SPLASH_BG }).png().toBuffer());
