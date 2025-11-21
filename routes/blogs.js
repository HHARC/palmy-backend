import express from "express";
import { getDb } from "../config/database.js";
import { BlogModel } from "../models/Blog.js";
import { upload } from "../middleware/upload.js";
import { generateExcerpt } from "../utils/helpers.js";
import {
  uploadToCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinaryUpload.js";

const router = express.Router();

/**
 * @route GET /api/blogs
 * @description Retrieve all blogs sorted by newest first
 * @returns {Array<Object>} Array of blog objects
 * @example
 * // Request
 * GET /api/blogs
 *
 * // Response
 * [
 *   {
 *     _id: "65a3f4d2c1234567890abcd1",
 *     heading: "First Blog",
 *     content: "Content here...",
 *     excerpt: "Content here...",
 *     imageUrl: "/uploads/image.jpg",
 *     createdAt: "2024-01-15T10:30:00Z",
 *     updatedAt: "2024-01-15T10:30:00Z"
 *   }
 * ]
 */
router.get("/", async (req, res, next) => {
  try {
    const db = await getDb();
    const blogModel = new BlogModel(db);
    const blogs = await blogModel.findAll();
    res.json(blogs);
  } catch (err) {
    next(err);
  }
});

/**
 * @route POST /api/blogs
 * @description Create a new blog with optional image upload to Cloudinary
 * @param {string} heading - Blog heading (required)
 * @param {string} content - Blog content (required)
 * @param {File} imageFile - Image file upload (optional, multipart/form-data)
 * @returns {Object} Created blog object with _id and Cloudinary imageUrl
 * @description Transaction: If DB insert fails, image is deleted from Cloudinary automatically
 * @example
 * // Request (multipart/form-data)
 * POST /api/blogs
 * Content-Type: multipart/form-data
 * heading: "My Blog Title"
 * content: "This is the blog content..."
 * imageFile: <image-file>
 *
 * // Response
 * {
 *   _id: "65a3f4d2c1234567890abcd1",
 *   heading: "My Blog Title",
 *   content: "This is the blog content...",
 *   excerpt: "This is the blog content...",
 *   imageUrl: "https://res.cloudinary.com/dzxxfgrsh/image/upload/v123/blog-xyz.jpg",
 *   imagePublicId: "blog-xyz",
 *   createdAt: "2024-01-15T10:30:00Z",
 *   updatedAt: "2024-01-15T10:30:00Z"
 * }
 */
router.post("/", upload.single("imageFile"), async (req, res, next) => {
  try {
    const { heading, content } = req.body;

    if (!heading || !content) {
      return res
        .status(400)
        .json({ error: "heading and content are required" });
    }

    let imageUrl = "";
    let imagePublicId = "";

    if (req.file) {
      const cloudinaryResult = await uploadToCloudinary(
        req.file.buffer,
        req.file.originalname
      );
      imageUrl = cloudinaryResult.url;
      imagePublicId = cloudinaryResult.publicId;
    }

    const db = await getDb();
    const blogModel = new BlogModel(db);
    const blogData = {
      heading: heading.trim(),
      content: content.trim(),
      excerpt: generateExcerpt(content),
      imageUrl,
      imagePublicId,
    };

    let blog;
    try {
      blog = await blogModel.create(blogData);
    } catch (dbError) {
      if (imagePublicId) {
        console.error("DB insert failed, rolling back image upload...");
        await deleteFromCloudinary(imagePublicId);
      }
      throw dbError;
    }

    res.status(201).json(blog);
  } catch (err) {
    next(err);
  }
});

/**
  * @route DELETE /api/blogs/:id
  * @description Delete a blog by ID and remove associated image from Cloudinary
  * @param {string} id - MongoDB blog ID
  * @returns {Object} Success message
  * @description Transaction: If DB delete fails, image remains in Cloudinary. If image delete fails, DB record is already deleted.
  * @example
  * // Request
  * DELETE /api/blogs/65a3f4d2c1234567890abcd1
  *
  * // Response (Success)
  * { "success": true }
  *
  * // Response (Not Found)
  * { "error": "Blog not found" }
  */
router.delete("/:id", async (req, res, next) => {
  try {
    const db = await getDb();
    const blogModel = new BlogModel(db);
    const blog = await blogModel.deleteById(req.params.id);

    if (!blog) {
      return res.status(404).json({ error: "Blog not found" });
    }

    if (blog.imagePublicId) {
      await deleteFromCloudinary(blog.imagePublicId);
    }

    res.json({ success: true });
  } catch (err) {
    if (err.message.includes("invalid ObjectId")) {
      return res.status(400).json({ error: "Invalid blog ID" });
    }
    next(err);
  }
});

/**
 * @route GET /api/blogs/:id
 * @description Retrieve a single blog by ID
 * @param {string} id - MongoDB blog ID
 * @returns {Object} Blog object
 * @example
 * // Request
 * GET /api/blogs/65a3f4d2c1234567890abcd1
 *
 * // Response
 * {
 *   _id: "65a3f4d2c1234567890abcd1",
 *   heading: "Blog Title",
 *   content: "Blog content...",
 *   excerpt: "Blog content...",
 *   imageUrl: "/uploads/image.jpg",
 *   createdAt: "2024-01-15T10:30:00Z",
 *   updatedAt: "2024-01-15T10:30:00Z"
 * }
 */
router.get("/:id", async (req, res, next) => {
  try {
    const db = await getDb();
    const blogModel = new BlogModel(db);
    const blog = await blogModel.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({ error: "Blog not found" });
    }

    res.json(blog);
  } catch (err) {
    if (err.message.includes("invalid ObjectId")) {
      return res.status(400).json({ error: "Invalid blog ID" });
    }
    next(err);
  }
});

export default router;
