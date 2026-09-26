"use client";

export type CompressionPreset = "medium" | "avatar";

export const COMPRESSION_PRESETS = {
  medium: {
    maxWidth: 1200,
    quality: 0.8,
    mimeType: "image/jpeg" as const,
    square: false,
  },
  avatar: {
    maxWidth: 400,
    quality: 0.8,
    mimeType: "image/jpeg" as const,
    square: true,
  },
} as const;

const MIN_SIZE_TO_COMPRESS = 500 * 1024;

/**
 * Nén ảnh trước khi upload (preset mặc định: medium — 1200px, quality 0.8, JPEG)
 */
export async function compressImage(
  file: File,
  preset: CompressionPreset = "medium"
): Promise<File> {
  const { maxWidth, quality, mimeType, square } = COMPRESSION_PRESETS[preset];

  if (!file.type.startsWith("image/")) {
    return file;
  }

  if (preset !== "avatar" && file.size < MIN_SIZE_TO_COMPRESS) {
    return file;
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let sourceX = 0;
        let sourceY = 0;
        const sourceSize = Math.min(img.width, img.height);
        let width = img.width;
        let height = img.height;

        if (square) {
          sourceX = (img.width - sourceSize) / 2;
          sourceY = (img.height - sourceSize) / 2;
          width = maxWidth;
          height = maxWidth;
        } else if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Không thể tạo canvas context"));
          return;
        }

        if (square) {
          ctx.drawImage(img, sourceX, sourceY, sourceSize, sourceSize, 0, 0, width, height);
        } else {
          ctx.drawImage(img, 0, 0, width, height);
        }

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const newFileName = file.name.replace(/\.[^/.]+$/, "") + "_compressed.jpg";
              const compressedFile = new File([blob], newFileName, {
                type: mimeType,
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              reject(new Error("Nén ảnh thất bại"));
            }
          },
          mimeType,
          quality
        );
      };
      img.onerror = () => reject(new Error("Không thể đọc ảnh"));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Không thể đọc file"));
    reader.readAsDataURL(file);
  });
}
