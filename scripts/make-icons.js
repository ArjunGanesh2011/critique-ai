// Generates the PWA / home-screen icons into public/ with no image dependencies.
// Draws a green "C" ring on the app's dark background and encodes PNG by hand.
// Run via: node scripts/make-icons.js

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const BG = [0x0b, 0x0f, 0x17];
const FG = [0x7c, 0xf0, 0xa1];

function crc32(buf) {
  const table = crc32.table || (crc32.table = (() => {
    const t = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c;
    }
    return t;
  })());
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

// Coverage of the "C" at a pixel, anti-aliased with a 3x3 sample grid.
function coverage(x, y, size) {
  const c = size / 2;
  const outer = size * 0.34;
  const inner = size * 0.21;
  let hits = 0;
  for (let sy = 0; sy < 3; sy++) {
    for (let sx = 0; sx < 3; sx++) {
      const dx = x + (sx + 0.5) / 3 - c;
      const dy = y + (sy + 0.5) / 3 - c;
      const r = Math.sqrt(dx * dx + dy * dy);
      if (r < inner || r > outer) continue;
      // Cut a wedge out of the right side to turn the ring into a C.
      if (Math.abs(Math.atan2(dy, dx)) < Math.PI / 5) continue;
      hits++;
    }
  }
  return hits / 9;
}

function render(size) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  let o = 0;
  for (let y = 0; y < size; y++) {
    raw[o++] = 0; // filter: none
    for (let x = 0; x < size; x++) {
      const a = coverage(x, y, size);
      for (let ch = 0; ch < 3; ch++) raw[o++] = Math.round(BG[ch] * (1 - a) + FG[ch] * a);
      raw[o++] = 255;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const outDir = path.join(__dirname, '..', 'public');
fs.mkdirSync(outDir, { recursive: true });

for (const [name, size] of [
  ['icon-512.png', 512],
  ['icon-192.png', 192],
  ['apple-touch-icon.png', 180],
  ['favicon.png', 48],
]) {
  fs.writeFileSync(path.join(outDir, name), render(size));
  console.log('wrote public/' + name);
}
