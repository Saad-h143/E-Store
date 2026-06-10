// Builds a transparent-background logo (monogram only, no square bg) from
// public/logo.jpg, and writes the navbar icon + favicons.
//
// Run:  node scripts/generate-logo.mjs
import sharp from "sharp";

// Square crop of the monogram on the 819x1024 source.
const crop = { left: 157, top: 245, width: 520, height: 520 };

// 1. Get luminance of the cropped logo.
const { data, info } = await sharp("public/logo.jpg")
  .extract(crop)
  .greyscale()
  .raw()
  .toBuffer({ resolveWithObject: true });

// 2. Build RGBA: keep the dark monogram, make the light background transparent.
const px = info.width * info.height;
const rgba = Buffer.alloc(px * 4);
for (let i = 0; i < px; i++) {
  const lum = data[i];
  let a;
  if (lum <= 110) a = 255;       // dark monogram -> opaque
  else if (lum >= 185) a = 0;    // light background -> transparent
  else a = Math.round((255 * (185 - lum)) / (185 - 110)); // smooth edge
  rgba[i * 4] = 17;      // near-black monogram (#111)
  rgba[i * 4 + 1] = 17;
  rgba[i * 4 + 2] = 17;
  rgba[i * 4 + 3] = a;
}

// 3. Trim transparent border, pad slightly, output as transparent PNGs.
const cut = await sharp(rgba, { raw: { width: info.width, height: info.height, channels: 4 } })
  .png()
  .trim()
  .toBuffer();

// White background behind the monogram so it's visible on dark browser tabs
// and in Google's (circular) favicon.
const make = () =>
  sharp(cut)
    .resize(400, 400, { fit: "contain", background: "#ffffff" })
    .extend({ top: 56, bottom: 56, left: 56, right: 56, background: "#ffffff" })
    .flatten({ background: "#ffffff" })
    .png();

await make().toFile("public/logo-icon.png");
await make().toFile("src/app/icon.png");
await make().toFile("src/app/apple-icon.png");

console.log("✓ Transparent logo written: public/logo-icon.png, src/app/icon.png, src/app/apple-icon.png");
