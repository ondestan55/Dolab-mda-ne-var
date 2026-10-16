import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

// Helper to encode a pure raw RGBA buffer into a valid PNG
function encodePNG(width, height, rgbaBuffer) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // 8 bits per channel
  ihdrData[9] = 6; // RGBA
  ihdrData[10] = 0; // compression deflate
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace

  function makeChunk(type, data) {
    const len = data.length;
    const buf = Buffer.alloc(12 + len);
    buf.writeUInt32BE(len, 0);
    buf.write(type, 4);
    data.copy(buf, 8);

    let crc = 0xFFFFFFFF;
    const crcBuf = Buffer.concat([Buffer.from(type), data]);
    for (let i = 0; i < crcBuf.length; i++) {
      let byte = crcBuf[i];
      for (let j = 0; j < 8; j++) {
        if ((crc ^ byte) & 1) {
          crc = (crc >>> 1) ^ 0xEDB88320;
        } else {
          crc = crc >>> 1;
        }
        byte = byte >>> 1;
      }
    }
    buf.writeInt32BE(~crc, 8 + len);
    return buf;
  }

  const ihdrChunk = makeChunk('IHDR', ihdrData);

  // Scanline data (filter byte 0 prefixing each row)
  const scanlines = Buffer.alloc(height * (1 + width * 4));
  let destOffset = 0;
  let srcOffset = 0;

  for (let y = 0; y < height; y++) {
    scanlines[destOffset++] = 0; // Filter: None
    rgbaBuffer.copy(scanlines, destOffset, srcOffset, srcOffset + width * 4);
    destOffset += width * 4;
    srcOffset += width * 4;
  }

  const compressed = zlib.deflateSync(scanlines, { level: 9 });
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Draw elegant icon with hanger & gold styling
function renderIconBuffer(size, isMaskable = false) {
  const buf = Buffer.alloc(size * size * 4);
  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.44;
  const cornerRadius = isMaskable ? 0 : size * 0.22;

  // Background colors: dark anthracite #1C1917 -> #2B2521
  const bgR = 28, bgG = 25, bgB = 23;
  const goldR = 230, goldG = 215, goldB = 195; // Warm cream gold #E6D7C3
  const accentR = 200, accentG = 175, accentB = 145;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;

      // Distance from center
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Check rounded corner bounding box for non-maskable
      let insideShape = true;
      if (!isMaskable) {
        const qx = Math.max(Math.abs(dx) - (size / 2 - cornerRadius), 0);
        const qy = Math.max(Math.abs(dy) - (size / 2 - cornerRadius), 0);
        if (Math.sqrt(qx * qx + qy * qy) > cornerRadius) {
          insideShape = false;
        }
      }

      if (!insideShape) {
        buf[idx] = 0;
        buf[idx + 1] = 0;
        buf[idx + 2] = 0;
        buf[idx + 3] = 0; // Transparent
        continue;
      }

      // Radial gradient background
      const gradFactor = Math.min(1, dist / (size * 0.7));
      const r = Math.round(bgR + (40 - bgR) * (1 - gradFactor));
      const g = Math.round(bgG + (35 - bgG) * (1 - gradFactor));
      const b = Math.round(bgB + (30 - bgB) * (1 - gradFactor));

      buf[idx] = r;
      buf[idx + 1] = g;
      buf[idx + 2] = b;
      buf[idx + 3] = 255;

      // Stylized Hanger Graphic inside safe zone (normalized coords)
      const scale = isMaskable ? 0.72 : 0.85;
      const nx = (dx / (size * 0.5)) / scale;
      const ny = (dy / (size * 0.5)) / scale;

      // Hook at top: circle around (0, -0.42), radius 0.12
      const hookDist = Math.abs(Math.sqrt(nx * nx + (ny + 0.42) * (ny + 0.42)) - 0.11);
      const isHook = hookDist < 0.028 && (nx >= -0.08 || ny < -0.42);

      // Hanger triangle lines:
      // Left arm: from (-0.6, 0.22) to (0, -0.15)
      // Right arm: from (0.6, 0.22) to (0, -0.15)
      // Bottom bar: from (-0.6, 0.22) to (0.6, 0.22)
      let isHanger = false;

      // Bottom bar
      if (Math.abs(ny - 0.22) < 0.026 && Math.abs(nx) <= 0.6) {
        isHanger = true;
      }

      // Slanted arms
      if (ny >= -0.15 && ny <= 0.22) {
        const expectedX = ((ny + 0.15) / 0.37) * 0.6;
        if (Math.abs(Math.abs(nx) - expectedX) < 0.035) {
          isHanger = true;
        }
      }

      // Center hook stem
      if (Math.abs(nx) < 0.026 && ny >= -0.32 && ny <= -0.15) {
        isHanger = true;
      }

      // AI Sparkle star at top right (0.45, -0.42)
      const spDx = Math.abs(nx - 0.42);
      const spDy = Math.abs(ny + 0.42);
      const isSparkle = (spDx < 0.022 && spDy < 0.14) || (spDy < 0.022 && spDx < 0.14);

      if (isHook || isHanger || isSparkle) {
        buf[idx] = goldR;
        buf[idx + 1] = goldG;
        buf[idx + 2] = goldB;
        buf[idx + 3] = 255;
      }
    }
  }

  return encodePNG(size, size, buf);
}

// Render clean app mockup screenshots for PWABuilder
function renderScreenshotBuffer(width, height, isMobile = false) {
  const buf = Buffer.alloc(width * height * 4);

  // Background: Warm editorial ivory #FAF8F5
  const bgR = 250, bgG = 248, bgB = 245;
  const darkR = 28, darkG = 25, darkB = 23;
  const cardR = 245, cardG = 240, cardB = 233;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;

      // Base background
      buf[idx] = bgR;
      buf[idx + 1] = bgG;
      buf[idx + 2] = bgB;
      buf[idx + 3] = 255;

      // Header Bar
      const headerHeight = Math.round(height * 0.1);
      if (y < headerHeight) {
        buf[idx] = 245;
        buf[idx + 1] = 239;
        buf[idx + 2] = 233;
        continue;
      }

      // Sidebar for desktop
      if (!isMobile && x < width * 0.22) {
        buf[idx] = 247;
        buf[idx + 1] = 244;
        buf[idx + 2] = 238;
        continue;
      }

      // Center cards mockup
      const marginX = isMobile ? width * 0.08 : width * 0.26;
      const cardW = isMobile ? width * 0.84 : width * 0.7;
      if (x >= marginX && x <= marginX + cardW && y >= height * 0.16 && y <= height * 0.88) {
        buf[idx] = cardR;
        buf[idx + 1] = cardG;
        buf[idx + 2] = cardB;
      }
    }
  }

  return encodePNG(width, height, buf);
}

// Generate all assets
const publicDir = path.resolve(process.cwd(), 'public');
const iconsDir = path.resolve(publicDir, 'icons');
const screenshotsDir = path.resolve(publicDir, 'screenshots');

fs.mkdirSync(iconsDir, { recursive: true });
fs.mkdirSync(screenshotsDir, { recursive: true });

console.log('Generating PWA Icons & Screenshots...');

fs.writeFileSync(path.resolve(iconsDir, 'icon-180.png'), renderIconBuffer(180, false));
fs.writeFileSync(path.resolve(iconsDir, 'icon-192.png'), renderIconBuffer(192, false));
fs.writeFileSync(path.resolve(iconsDir, 'icon-512.png'), renderIconBuffer(512, false));
fs.writeFileSync(path.resolve(iconsDir, 'icon-maskable-512.png'), renderIconBuffer(512, true));

// Create favicon.ico from 32x32 PNG
fs.writeFileSync(path.resolve(publicDir, 'favicon.ico'), renderIconBuffer(32, false));

// Screenshots
fs.writeFileSync(path.resolve(screenshotsDir, 'desktop.png'), renderScreenshotBuffer(1280, 720, false));
fs.writeFileSync(path.resolve(screenshotsDir, 'mobile.png'), renderScreenshotBuffer(750, 1334, true));

console.log('PWA assets generated successfully in /public!');
