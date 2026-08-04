// One-off / re-runnable generator for placeholder PWA icons.
// Run with: node scripts/generate-pwa-icons.mjs
//
// These are simple rounded-square, brand-colored placeholders (a wrench
// glyph on the primary blue) so the app is installable out of the box.
// Swap in real logo-based icons before a real launch — see README.

import { PNG } from "pngjs";
import { writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "..", "public", "icons");

const PRIMARY = [37, 99, 235]; // #2563EB
const WHITE = [255, 255, 255];

function generateIcon(size) {
  const png = new PNG({ width: size, height: size });
  const radius = size * 0.22;
  const cx = size / 2;
  const cy = size / 2;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (size * y + x) << 2;
      const inRoundedSquare = isInsideRoundedSquare(x, y, size, radius);

      if (!inRoundedSquare) {
        png.data[idx] = 0;
        png.data[idx + 1] = 0;
        png.data[idx + 2] = 0;
        png.data[idx + 3] = 0; // transparent outside the rounded square
        continue;
      }

      // Simple wrench-like mark: a diagonal bar with two circular "jaws" at
      // each end, all in white on the primary blue background.
      const onMark = isOnWrenchMark(x, y, size, cx, cy);
      const color = onMark ? WHITE : PRIMARY;

      png.data[idx] = color[0];
      png.data[idx + 1] = color[1];
      png.data[idx + 2] = color[2];
      png.data[idx + 3] = 255;
    }
  }

  return png;
}

function isInsideRoundedSquare(x, y, size, radius) {
  const corners = [
    [radius, radius],
    [size - radius, radius],
    [radius, size - radius],
    [size - radius, size - radius],
  ];

  if (x >= radius && x <= size - radius) return true;
  if (y >= radius && y <= size - radius) return true;

  for (const [cx, cy] of corners) {
    const dx = x - cx;
    const dy = y - cy;
    if (dx * dx + dy * dy <= radius * radius) return true;
  }
  return false;
}

function isOnWrenchMark(x, y, size, cx, cy) {
  const barWidth = size * 0.11;
  // Rotate coordinates -45deg around center to draw a horizontal bar,
  // which then reads as a diagonal wrench shape.
  const angle = -Math.PI / 4;
  const dx = x - cx;
  const dy = y - cy;
  const rx = dx * Math.cos(angle) - dy * Math.sin(angle);
  const ry = dx * Math.sin(angle) + dy * Math.cos(angle);

  const barHalfLen = size * 0.28;
  const onBar = Math.abs(ry) <= barWidth / 2 && Math.abs(rx) <= barHalfLen;

  const jawRadius = size * 0.1;
  const jaw1 = distance(rx, ry, -barHalfLen, 0) <= jawRadius;
  const jaw2 = distance(rx, ry, barHalfLen, 0) <= jawRadius;
  const jawHole1 = distance(rx, ry, -barHalfLen, 0) <= jawRadius * 0.45;
  const jawHole2 = distance(rx, ry, barHalfLen, 0) <= jawRadius * 0.45;

  if (jawHole1 || jawHole2) return false; // punch a hole through each jaw
  return onBar || jaw1 || jaw2;
}

function distance(x1, y1, x2, y2) {
  return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
}

for (const size of [192, 512]) {
  const png = generateIcon(size);
  const buffer = PNG.sync.write(png);
  writeFileSync(join(OUT_DIR, `icon-${size}.png`), buffer);
  console.log(`Generated icon-${size}.png`);
}
