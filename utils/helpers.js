import { EXCERPT_LIMIT } from "../config/constants.js";

/**
 * Generate excerpt from content
 * @param {string} content - The full content
 * @param {number} limit - Character limit for excerpt
 * @returns {string} Truncated excerpt
 */
export function generateExcerpt(content, limit = EXCERPT_LIMIT) {
  const flat = (content || "").replace(/\s+/g, " ").trim();
  return flat.length > limit ? flat.slice(0, limit - 3) + "..." : flat;
}
