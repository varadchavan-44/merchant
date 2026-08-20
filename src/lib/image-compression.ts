// Browser-side image resize/re-encode, used anywhere a person uploads a
// photo (admin product galleries, customer payment screenshots). Large
// phone photos/screenshots can be 5-10MB; this typically brings them under
// ~500KB-1MB, which keeps requests well under serverless body-size limits
// and avoids slow uploads or timeouts on weak connections.

const MAX_DIMENSION = 1600; // px, longest side
const JPEG_QUALITY = 0.8;

export async function compressImage(file: File): Promise<File> {
  // Skip already-small files and non-standard image types (e.g. HEIC, SVG)
  // that <canvas> can't reliably decode — upload those as-is.
  if (file.size < 400 * 1024 || !/^image\/(jpeg|png|webp)$/.test(file.type)) {
    return file;
  }

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);

    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY)
    );
    if (!blob || blob.size >= file.size) return file; // compression didn't help, keep original

    const newName = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], newName, { type: "image/jpeg" });
  } catch {
    // If anything about compression fails, fall back to the original file
    // rather than blocking the upload entirely.
    return file;
  }
}
