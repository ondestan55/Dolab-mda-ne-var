/**
 * Utility for image file validation, resizing, compression and background removal
 * Optimized for Safari/iOS WebKit, Apple cameras, and all modern mobile/desktop browsers.
 */

export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const isImageMime = file.type.startsWith('image/') || file.type === '';
  const fileName = (file.name || '').toLowerCase();
  const validExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif', '.bmp', '.tiff', '.avif'];
  const hasValidExt = validExtensions.some((ext) => fileName.endsWith(ext));

  if (!isImageMime && !hasValidExt) {
    return {
      valid: false,
      error: 'Lütfen geçerli bir görsel dosyası seçin (JPEG, PNG, HEIC, WebP vb.).',
    };
  }

  // 35 MB limit
  if (file.size > 35 * 1024 * 1024) {
    return {
      valid: false,
      error: 'Fotoğraf boyutu 35 MB’tan küçük olmalıdır.',
    };
  }

  return { valid: true };
}

/**
 * Robust image downsampling for client storage & Gemini API payload.
 * Keeps dimensions optimal (~900px) so AI vision operates in milliseconds without memory leaks.
 */
export function processAndCompressImage(
  file: File,
  maxDimension: number = 900,
  quality: number = 0.85
): Promise<{ dataUrl: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Görsel işleme motoru başlatılamadı.'));
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        const mimeType = 'image/jpeg';
        const dataUrl = canvas.toDataURL(mimeType, quality);
        resolve({ dataUrl, mimeType });
      };

      img.onerror = () => {
        // If Safari has issues with HEIC or specific metadata, fallback to raw reader
        if (typeof e.target?.result === 'string') {
          resolve({ dataUrl: e.target.result, mimeType: 'image/jpeg' });
        } else {
          reject(new Error('Fotoğraf açılamadı. Lütfen görseli tekrar seçin.'));
        }
      };
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error('Dosya okunamadı.'));
    reader.readAsDataURL(file);
  });
}

/**
 * Intelligent Multi-Zone Background Removal
 * Eliminates bedsheets, hardwood floors, carpets, and hanger backgrounds.
 * Extracts the central clothing item with clean edges on an editorial studio canvas.
 */
export function removeClothingBackground(
  dataUrl: string,
  mode: 'transparent' | 'studio' = 'studio'
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const width = img.width;
        const height = img.height;

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          resolve(dataUrl);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const imgData = ctx.getImageData(0, 0, width, height);
        const data = imgData.data;

        // Collect background samples from 8 perimeter clusters (corners and mid-edges)
        const sampleColors: [number, number, number][] = [];
        const marginX = Math.max(10, Math.floor(width * 0.08));
        const marginY = Math.max(10, Math.floor(height * 0.08));

        const sampleClusters = [
          // 4 corners
          [0, 0],
          [width - marginX, 0],
          [0, height - marginY],
          [width - marginX, height - marginY],
          // 4 edges
          [Math.floor(width / 2), 0],
          [Math.floor(width / 2), height - marginY],
          [0, Math.floor(height / 2)],
          [width - marginX, Math.floor(height / 2)],
        ];

        for (const [cx, cy] of sampleClusters) {
          for (let dy = 0; dy < marginY; dy += 4) {
            for (let dx = 0; dx < marginX; dx += 4) {
              const px = Math.min(width - 1, cx + dx);
              const py = Math.min(height - 1, cy + dy);
              const idx = (py * width + px) * 4;
              sampleColors.push([data[idx], data[idx + 1], data[idx + 2]]);
            }
          }
        }

        // Compute average background color
        let sumR = 0, sumG = 0, sumB = 0;
        for (const [r, g, b] of sampleColors) {
          sumR += r;
          sumG += g;
          sumB += b;
        }
        const avgR = sumR / sampleColors.length;
        const avgG = sumG / sampleColors.length;
        const avgB = sumB / sampleColors.length;

        // Dynamic thresholding
        const bgLuminance = 0.299 * avgR + 0.587 * avgG + 0.114 * avgB;
        const threshold = bgLuminance > 210 ? 38 : bgLuminance < 40 ? 40 : 34;

        // Color distance calculation
        const getDistance = (r: number, g: number, b: number) => {
          const dr = r - avgR;
          const dg = g - avgG;
          const db = b - avgB;
          return Math.sqrt(dr * dr * 0.299 + dg * dg * 0.587 + db * db * 0.114);
        };

        const centerX = width / 2;
        const centerY = height / 2;
        const maxDistCenter = Math.sqrt(centerX * centerX + centerY * centerY);

        // Process pixel alpha with center saliency protection
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];

            const colorDist = getDistance(r, g, b);

            // Normalized distance from center (0 at center, 1 at corner)
            const dx = x - centerX;
            const dy = y - centerY;
            const distFromCenter = Math.sqrt(dx * dx + dy * dy) / maxDistCenter;

            // Center priority: clothes are centered, bed/floor borders are further out
            const effectiveThreshold = threshold * (1 - distFromCenter * 0.25);

            if (colorDist < effectiveThreshold) {
              if (colorDist < effectiveThreshold * 0.65) {
                data[idx + 3] = 0; // Transparent
              } else {
                const alphaFactor = (colorDist - effectiveThreshold * 0.65) / (effectiveThreshold * 0.35);
                data[idx + 3] = Math.round(alphaFactor * 255);
              }
            }
          }
        }

        ctx.putImageData(imgData, 0, 0);

        if (mode === 'studio') {
          // Render on crisp editorial warm studio surface with soft ambient lighting
          const studioCanvas = document.createElement('canvas');
          studioCanvas.width = width;
          studioCanvas.height = height;
          const studioCtx = studioCanvas.getContext('2d');

          if (studioCtx) {
            // Subtle radial luxury studio background (#F9F8F6 to #EDE8E2)
            const gradient = studioCtx.createRadialGradient(
              centerX, centerY * 0.9, width * 0.2,
              centerX, centerY, width * 0.8
            );
            gradient.addColorStop(0, '#FAF9F6');
            gradient.addColorStop(1, '#EDE8E1');
            studioCtx.fillStyle = gradient;
            studioCtx.fillRect(0, 0, width, height);

            // Soft contact shadow under garment
            studioCtx.save();
            studioCtx.shadowColor = 'rgba(28, 25, 23, 0.12)';
            studioCtx.shadowBlur = 18;
            studioCtx.shadowOffsetY = 8;
            studioCtx.drawImage(canvas, 0, 0);
            studioCtx.restore();

            resolve(studioCanvas.toDataURL('image/jpeg', 0.9));
            return;
          }
        }

        // Return clean PNG
        resolve(canvas.toDataURL('image/png'));
      } catch (err) {
        console.warn('Background removal error, falling back:', err);
        resolve(dataUrl);
      }
    };

    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}
