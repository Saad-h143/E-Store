// Generates QR image files into public/:
//   ezeeparts-qr.svg / .png        -> plain QR
//   ezeeparts-qr-card.svg / .png   -> branded "Scan to shop" card
//
// Run:  node scripts/generate-qr.mjs  [optional-url]
import QRCode from "qrcode";
import sharp from "sharp";
import { writeFileSync, mkdirSync } from "node:fs";

const URL = process.argv[2] || "https://ezeeparts.online";
const BRAND_A = "EZEE";
const BRAND_B = "PARTS";
const CTA = "Scan to shop Ezee Parts";
const PRIMARY = "#7c3aed"; // purple
const DARK = "#1e1b4b"; // QR modules
const display = URL.replace(/^https?:\/\//, "").replace(/\/$/, "");

mkdirSync("public", { recursive: true });

// --- Plain QR (svg + png) ---
const plainSvg = await QRCode.toString(URL, {
  type: "svg",
  errorCorrectionLevel: "H",
  margin: 1,
  color: { dark: DARK, light: "#ffffff" },
});
writeFileSync("public/ezeeparts-qr.svg", plainSvg);
await QRCode.toFile("public/ezeeparts-qr.png", URL, {
  errorCorrectionLevel: "H",
  margin: 1,
  width: 600,
  color: { dark: DARK, light: "#ffffff" },
});

// --- Branded card ---
const qr = QRCode.create(URL, { errorCorrectionLevel: "H" });
const N = qr.modules.size;
const bits = qr.modules.data;

const W = 678;
const H = 914;
const pad = 80;
const qrTop = 200;
const usable = W - pad * 2;
const moduleSize = Math.floor(usable / N);
const qrSize = moduleSize * N;
const qrLeft = Math.round((W - qrSize) / 2);

// smartphone icon (lucide), scaled to size s, drawn at (x,y)
const phone = (x, y, s, stroke) => {
  const sc = s / 24;
  return `<g transform="translate(${x},${y}) scale(${sc})" fill="none" stroke="${stroke}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2.5"/><path d="M12 18h.01"/></g>`;
};

let rects = "";
for (let r = 0; r < N; r++) {
  for (let c = 0; c < N; c++) {
    if (bits[r * N + c]) {
      rects += `<rect x="${qrLeft + c * moduleSize}" y="${qrTop + r * moduleSize}" width="${moduleSize}" height="${moduleSize}" fill="${DARK}"/>`;
    }
  }
}

// center logo box (covers the middle; level H keeps it scannable)
const logo = moduleSize * 7;
const lx = Math.round(W / 2 - logo / 2);
const ly = Math.round(qrTop + qrSize / 2 - logo / 2);
const iconS = Math.round(logo * 0.52);

const ctaY = qrTop + qrSize + 56;

const card = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="Arial, Helvetica, sans-serif">
  <rect width="${W}" height="${H}" rx="36" fill="#ffffff" stroke="${PRIMARY}" stroke-width="6"/>
  <g transform="translate(${pad},48)">
    <rect width="56" height="56" rx="14" fill="${PRIMARY}"/>
    ${phone(14, 14, 28, "#ffffff")}
    <text x="72" y="40" font-size="38" font-weight="800" fill="#1e293b">${BRAND_A}<tspan fill="${PRIMARY}"> ${BRAND_B}</tspan></text>
  </g>
  ${rects}
  <rect x="${lx}" y="${ly}" width="${logo}" height="${logo}" rx="${Math.round(logo * 0.28)}" fill="${PRIMARY}" stroke="#ffffff" stroke-width="7"/>
  ${phone(lx + (logo - iconS) / 2, ly + (logo - iconS) / 2, iconS, "#ffffff")}
  <rect x="${pad}" y="${ctaY}" width="${W - pad * 2}" height="66" rx="16" fill="${PRIMARY}"/>
  <text x="${W / 2}" y="${ctaY + 43}" text-anchor="middle" font-size="27" font-weight="700" fill="#ffffff">${CTA}</text>
  <text x="${W / 2}" y="${ctaY + 116}" text-anchor="middle" font-size="22" fill="#64748b">${display}</text>
</svg>`;

writeFileSync("public/ezeeparts-qr-card.svg", card);
await sharp(Buffer.from(card)).png().toFile("public/ezeeparts-qr-card.png");

console.log("✓ Generated in public/:");
console.log("  ezeeparts-qr.svg / .png        (plain QR)");
console.log("  ezeeparts-qr-card.svg / .png   (branded card)");
console.log("  → encodes:", URL);
