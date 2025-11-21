import cloudinary from "../config/cloudinary.js";
import { Readable } from "stream";

/**
 * Upload file buffer to Cloudinary
 * @param {Buffer} buffer - File buffer from memory
 * @param {string} originalName - Original filename
 * @returns {Promise<{url: string, publicId: string}>} Cloudinary URL and public ID
 */
export async function uploadToCloudinary(buffer, originalName) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "auto",
        public_id: `blog-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      },
      (error, result) => {
        if (error) {
          reject(new Error(`Cloudinary upload failed: ${error.message}`));
        } else {
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
          });
        }
      }
    );

    const readableStream = Readable.from(buffer);
    readableStream.pipe(stream);
  });
}

/**
 * Delete file from Cloudinary by public ID
 * @param {string} publicId - Cloudinary public ID
 * @returns {Promise<boolean>} True if deleted successfully
 */
export async function deleteFromCloudinary(publicId) {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result.result === "ok";
  } catch (error) {
    console.error(`Cloudinary delete failed for ${publicId}:`, error.message);
    return false;
  }
}

/**
 * Extract public ID from Cloudinary URL
 * @param {string} url - Cloudinary URL
 * @returns {string} Public ID
 */
export function extractPublicId(url) {
  if (!url) return null;
  const match = url.match(/\/([^/]+)\/upload\/(?:v\d+\/)?(.+?)(?:\.\w+)?$/);
  return match ? match[2] : null;
}
