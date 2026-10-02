/**
 * Image optimization utility for employee photos
 * Resizes large images (including 5MB-20MB mobile camera photos) to optimized dimensions (max 600x600)
 * and compresses them to lightweight JPEG/WebP data URLs (~25-50KB)
 * so hundreds of employee photos can be saved reliably without hitting browser storage quotas.
 */
export async function optimizeImageFile(file: File, maxWidth = 600, maxHeight = 600, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    // Check if valid image
    if (!file.type.startsWith('image/')) {
      reject(new Error('กรุณาเลือกไฟล์รูปภาพที่ถูกต้อง (JPG, PNG, WebP)'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('ไม่สามารถอ่านไฟล์รูปภาพได้'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('ไม่สามารถประมวลผลรูปภาพได้'));
      img.onload = () => {
        try {
          let { width, height } = img;

          // Calculate aspect ratio preserving dimensions
          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(e.target?.result as string);
            return;
          }

          // Enhance image rendering quality
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          // Output compressed JPEG
          const optimizedDataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(optimizedDataUrl);
        } catch (err) {
          console.warn('Image optimization canvas failed, falling back to raw data URL', err);
          resolve(e.target?.result as string);
        }
      };

      if (typeof e.target?.result === 'string') {
        img.src = e.target.result;
      } else {
        reject(new Error('Invalid image result'));
      }
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Signature optimization utility:
 * - Trims large camera/scanner photos of signatures (up to 600x300)
 * - Automatically isolates pen strokes and removes white/gray paper background (makes transparent)
 * - Boosts contrast and optionally converts ink to official government dark blue (#0f2b82) or black
 * - Outputs lightweight PNG data URL with transparent background
 */
export interface SignatureOptimizeOptions {
  maxWidth?: number;
  maxHeight?: number;
  removeBackground?: boolean;
  inkColor?: 'blue' | 'black' | 'original';
  threshold?: number; // 0-255 brightness threshold for background (default 200)
}

export async function optimizeSignatureImage(
  fileOrDataUrl: File | string,
  options: SignatureOptimizeOptions = {}
): Promise<string> {
  const {
    maxWidth = 500,
    maxHeight = 220,
    removeBackground = true,
    inkColor = 'blue',
    threshold = 205
  } = options;

  return new Promise((resolve, reject) => {
    const processImage = (srcUrl: string) => {
      const img = new Image();
      img.onerror = () => reject(new Error('ไม่สามารถประมวลผลรูปลายเซ็นได้'));
      img.onload = () => {
        try {
          let { width, height } = img;

          // Scale preserving aspect ratio
          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(srcUrl);
            return;
          }

          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          if (removeBackground) {
            const imageData = ctx.getImageData(0, 0, width, height);
            const data = imageData.data;

            // Analyze pixels
            for (let i = 0; i < data.length; i += 4) {
              const r = data[i];
              const g = data[i + 1];
              const b = data[i + 2];
              const a = data[i + 3];

              if (a === 0) continue;

              // Perceived brightness (luminance)
              const brightness = 0.299 * r + 0.587 * g + 0.114 * b;

              if (brightness > threshold) {
                // If light/white paper pixel, make transparent
                data[i + 3] = 0;
              } else {
                // Ink pixel: calculate ink intensity
                const darkness = 1 - (brightness / threshold);
                const alpha = Math.min(255, Math.max(30, Math.round(darkness * 255 * 1.3)));

                if (inkColor === 'blue') {
                  // Official Government Blue ink (#0f2b82)
                  data[i] = 15;     // R
                  data[i + 1] = 43;  // G
                  data[i + 2] = 130; // B
                  data[i + 3] = alpha;
                } else if (inkColor === 'black') {
                  // Deep black ink (#111827)
                  data[i] = 17;
                  data[i + 1] = 24;
                  data[i + 2] = 39;
                  data[i + 3] = alpha;
                } else {
                  // Keep original color but increase contrast
                  data[i + 3] = alpha;
                }
              }
            }

            ctx.putImageData(imageData, 0, 0);
          }

          const pngDataUrl = canvas.toDataURL('image/png');
          resolve(pngDataUrl);
        } catch (err) {
          console.warn('Signature optimization failed, using original source', err);
          resolve(srcUrl);
        }
      };

      img.src = srcUrl;
    };

    if (typeof fileOrDataUrl === 'string') {
      processImage(fileOrDataUrl);
    } else {
      if (!fileOrDataUrl.type.startsWith('image/')) {
        reject(new Error('กรุณาเลือกไฟล์รูปภาพที่ถูกต้อง (PNG, JPG, WebP)'));
        return;
      }
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('ไม่สามารถอ่านไฟล์รูปภาพได้'));
      reader.onload = (e) => {
        if (typeof e.target?.result === 'string') {
          processImage(e.target.result);
        } else {
          reject(new Error('Invalid signature file'));
        }
      };
      reader.readAsDataURL(fileOrDataUrl);
    }
  });
}

/**
 * Storage safety wrapper for saving data to localStorage
 */
export function safeLocalStorageSet(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.warn(`localStorage quota exceeded or write error for key "${key}":`, error);
    // If quota exceeded, try to clear old temporary cache items
    try {
      localStorage.removeItem('temp_cache');
      localStorage.setItem(key, value);
      return true;
    } catch (e2) {
      console.error('Failed to write even after cache cleanup', e2);
      return false;
    }
  }
}
