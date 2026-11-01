// Generates the PNG app icons (no dependencies). Run: node tools/make-icons.js
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
};

function png(size, pixel) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      const [r, g, b] = pixel(x + 0.5, y + 0.5, size);
      const o = y * (size * 4 + 1) + 1 + x * 4;
      raw[o] = r; raw[o + 1] = g; raw[o + 2] = b; raw[o + 3] = 255;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// Distance from point to segment
function segDist(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}
const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));

// Full-bleed green tile (iOS rounds corners itself) with a bag outline and a tick.
function pixel(x, y, s) {
  const u = x / s, v = y / s;
  let col = mix([62, 140, 100], [34, 96, 66], v); // top -> bottom gradient
  const aa = 1.2 / s;
  const stroke = 0.055;

  // shopping bag body
  const bx0 = 0.27, bx1 = 0.73, by0 = 0.36, by1 = 0.80, r = 0.06;
  const qx = Math.max(bx0 + r - u, 0, u - (bx1 - r));
  const qy = Math.max(by0 + r - v, 0, v - (by1 - r));
  const boxD = Math.hypot(qx, qy) - r; // <0 inside rounded rect
  let ink = Math.max(0, Math.min(1, (aa - Math.abs(boxD) + stroke / 2) / aa));

  // handle: arc above the bag
  const hx = 0.5, hy = 0.36, hr = 0.12;
  if (v <= hy) {
    const d = Math.abs(Math.hypot(u - hx, v - hy) - hr);
    ink = Math.max(ink, Math.max(0, Math.min(1, (aa - d + stroke / 2) / aa)));
  }

  // tick inside the bag
  const d = Math.min(segDist(u, v, 0.38, 0.585, 0.47, 0.675), segDist(u, v, 0.47, 0.675, 0.63, 0.495));
  ink = Math.max(ink, Math.max(0, Math.min(1, (aa - d + stroke / 2) / aa)));

  return mix(col, [255, 255, 255], ink);
}

const out = path.join(__dirname, '..', 'icons');
fs.mkdirSync(out, { recursive: true });
for (const [name, size] of [['apple-touch-icon.png', 180], ['icon-192.png', 192], ['icon-512.png', 512]]) {
  fs.writeFileSync(path.join(out, name), png(size, pixel));
  console.log('wrote', name);
}
