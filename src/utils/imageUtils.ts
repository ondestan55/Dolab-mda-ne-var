/**
 * Utility for image file validation, resizing, and compression
 * Ensures photos stored in IndexedDB and sent to Gemini API are optimized (max 1200px, high quality, small file size)
 */

export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Yalnızca JPEG, PNG veya WebP formatında fotoğraflar kabul edilmektedir.',
    };
  }

  // 15 MB limit
  if (file.size > 15 * 1024 * 1024) {
    return {
      valid: false,
      error: 'Fotoğraf boyutu 15 MB’tan küçük olmalıdır.',
    };
  }

  return { valid: true };
}

export function processAndCompressImage(
  file: File,
  maxDimension: number = 1200,
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
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context oluşturulamadı.'));
          return;
        }

        // Draw image with crisp smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        const dataUrl = canvas.toDataURL(mimeType, quality);

        resolve({ dataUrl, mimeType });
      };

      img.onerror = () => reject(new Error('Fotoğraf yüklenemedi.'));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error('Dosya okunamadı.'));
    reader.readAsDataURL(file);
  });
}
