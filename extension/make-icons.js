/**
 * make-icons.js - draw the extension icons, so they are reproducible rather
 * than three opaque binaries nobody can change.
 *
 * Run: node extension/make-icons.js
 *
 * Pure Node, no dependencies. A PNG is a signature, an IHDR chunk, zlib-
 * deflated scanlines in IDAT and an IEND, and zlib ships with Node - so an
 * image toolchain would be three hundred megabytes to draw two ellipses.
 *
 * The mark is a footprint: a wide forefoot and a smaller heel on a rounded
 * square. It is deliberately not lettering. At 16 pixels a "42" or a "cm" is a
 * smudge, and the tab strip is where this icon actually lives.
 */
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));

// The accent from the demo and the popup, so the three surfaces read as one
// thing, and a warm off-white rather than pure white for the mark.
const BG = [232, 129, 63, 255];
const FG = [252, 250, 246, 255];

const CRC = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return (buf) => {
    let c = -1;
    for (const b of buf) c = t[(c ^ b) & 0xff] ^ (c >>> 8);
    return (c ^ -1) >>> 0;
  };
})();

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(CRC(body));
  return Buffer.concat([len, body, crc]);
}

function png(size, pixel) {
  // One filter byte (0, none) per scanline, then RGBA.
  const raw = Buffer.alloc(size * (1 + size * 4));
  let o = 0;
  for (let y = 0; y < size; y++) {
    raw[o++] = 0;
    for (let x = 0; x < size; x++) {
      const [r, g, b, a] = pixel(x, y);
      raw[o++] = r;
      raw[o++] = g;
      raw[o++] = b;
      raw[o++] = a;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // colour type: RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/** Signed distance to a rounded square, in normalised -1..1 space. */
const roundedSquare = (x, y, r) => {
  const dx = Math.max(Math.abs(x) - (1 - r), 0);
  const dy = Math.max(Math.abs(y) - (1 - r), 0);
  return Math.hypot(dx, dy) - r;
};

/** Inside an ellipse centred at (cx, cy) with radii rx, ry. */
const ellipse = (x, y, cx, cy, rx, ry) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 - 1;

/**
 * Supersampled so the curves do not stair-step at 16 pixels, which is the size
 * that actually matters. 4x4 samples per pixel is enough and costs nothing at
 * these dimensions.
 */
const SS = 4;

function draw(size) {
  return (px, py) => {
    let bg = 0;
    let fg = 0;
    for (let sy = 0; sy < SS; sy++) {
      for (let sx = 0; sx < SS; sx++) {
        const x = ((px + (sx + 0.5) / SS) / size) * 2 - 1;
        const y = ((py + (sy + 0.5) / SS) / size) * 2 - 1;
        if (roundedSquare(x, y, 0.42) > 0) continue;
        bg++;
        const forefoot = ellipse(x, y, 0, -0.3, 0.42, 0.34);
        const heel = ellipse(x, y, 0, 0.42, 0.28, 0.3);
        if (forefoot < 0 || heel < 0) fg++;
      }
    }
    const total = SS * SS;
    if (!bg) return [0, 0, 0, 0];
    // Composite the mark over the plate, then the plate over transparency.
    const markCoverage = fg / total;
    const plateCoverage = bg / total;
    const out = [0, 0, 0, 0];
    for (let i = 0; i < 3; i++) {
      out[i] = Math.round((BG[i] * (plateCoverage - markCoverage) + FG[i] * markCoverage) / plateCoverage);
    }
    out[3] = Math.round(255 * plateCoverage);
    return out;
  };
}

mkdirSync(join(HERE, 'icons'), { recursive: true });
for (const size of [16, 48, 128]) {
  const file = join(HERE, 'icons', `${size}.png`);
  writeFileSync(file, png(size, draw(size)));
  console.error(`wrote icons/${size}.png`);
}
