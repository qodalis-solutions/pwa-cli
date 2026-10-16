// Generates every icon and splash image from resources/logo.png:
//   public/icons/*            PWA icons (any + maskable), apple-touch-icon
//   android/app/src/main/res  launcher icons (legacy, round, adaptive) and splash
//   fastlane/.../icon.png     Google Play listing icon (512x512)
// Run with `npm run assets` after changing the logo.
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import sharp from 'sharp';

const LOGO = 'resources/logo.png';
const BG = { r: 20, g: 34, b: 49, alpha: 1 }; // logo background, #142231
const BG_HEX = '#142231';
const RES = 'android/app/src/main/res';

/** The logo scaled to `logoSize`, centred on a `size` square of background. */
async function tile(size, logoSize, { round = false } = {}) {
  const logo = await sharp(LOGO).resize(logoSize, logoSize, { fit: 'contain', background: BG }).toBuffer();
  let img = sharp({ create: { width: size, height: size, channels: 4, background: BG } })
    .composite([{ input: logo, gravity: 'center' }]);
  if (round) {
    const mask = Buffer.from(`<svg width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}"/></svg>`);
    img = sharp(await img.png().toBuffer()).composite([{ input: mask, blend: 'dest-in' }]);
  }
  return img.png().toBuffer();
}

async function save(path, buffer) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, buffer);
  console.log('wrote', path);
}

// PWA: "any" icons fill most of the square; maskable icons keep the logo in
// the 80% safe zone.
for (const size of [48, 72, 96, 128, 144, 192, 256, 384, 512]) {
  await save(`public/icons/icon-${size}.png`, await tile(size, Math.round(size * 0.86)));
}
for (const size of [192, 512]) {
  await save(`public/icons/maskable-${size}.png`, await tile(size, Math.round(size * 0.62)));
}
await save('public/icons/apple-touch-icon.png', await tile(180, 150));

// Android launcher icons per density (48dp base; adaptive layers are 108dp).
const densities = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };
for (const [name, scale] of Object.entries(densities)) {
  const legacy = Math.round(48 * scale);
  const adaptive = Math.round(108 * scale);
  await save(join(RES, `mipmap-${name}/ic_launcher.png`), await tile(legacy, Math.round(legacy * 0.84)));
  await save(join(RES, `mipmap-${name}/ic_launcher_round.png`), await tile(legacy, Math.round(legacy * 0.72), { round: true }));
  // Adaptive foreground: logo within the central 66dp safe zone, transparent around it.
  const logo = await sharp(LOGO).resize(Math.round(66 * scale)).toBuffer();
  const fg = await sharp({ create: { width: adaptive, height: adaptive, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: logo, gravity: 'center' }]).png().toBuffer();
  await save(join(RES, `mipmap-${name}/ic_launcher_foreground.png`), fg);
}
await save(join(RES, 'values/ic_launcher_background.xml'),
  Buffer.from(`<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">${BG_HEX}</color>\n</resources>\n`));

// Android 12+ shows the launcher icon as the splash; older versions use this
// image, so keep the logo small in the middle of a portrait-safe square.
await save(join(RES, 'drawable/splash.png'), await tile(1080, 360));

// Play Console listing icon: 512x512, no transparency.
await save('fastlane/metadata/android/en-US/images/icon.png', await sharp(await tile(512, 440)).flatten({ background: BG }).png().toBuffer());
