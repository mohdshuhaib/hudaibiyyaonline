export interface PixelCropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });
}

/**
 * Crops the source image to the given 1:1 pixel area, resizes to 400x400px,
 * and compresses as JPEG (~80-120KB, strictly < 500KB) for Supabase Storage.
 */
export async function getCroppedCompressedBlob(
  imageSrc: string,
  pixelCrop: PixelCropArea,
  targetSize = 400
): Promise<Blob> {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement("canvas");
  canvas.width = targetSize;
  canvas.height = targetSize;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not initialize 2D canvas context");
  }

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, targetSize, targetSize);

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    targetSize,
    targetSize
  );

  const exportBlob = (quality: number) =>
    new Promise<Blob | null>((resolve) =>
      canvas.toBlob((blob) => resolve(blob), "image/jpeg", quality)
    );

  // Start at 0.82 quality (~80-110KB for 400x400 portrait), step down if needed
  let quality = 0.82;
  let blob = await exportBlob(quality);

  while (blob && blob.size > 140 * 1024 && quality > 0.45) {
    quality -= 0.1;
    blob = await exportBlob(quality);
  }

  if (!blob) {
    throw new Error("Failed to compress cropped image");
  }

  return blob;
}
