// api/blogs.js
const { MongoClient, ObjectId } = require("mongodb");
const cloudinary = require("cloudinary").v2;
const formidable = require("formidable");

// Config
const MONGO_URI = process.env.MONGO_URI;
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;

// Cloudinary setup
cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET
});

// MongoDB setup
let cachedClient = null;
async function getDb() {
  if (cachedClient) return cachedClient.db("blogDB");
  const client = await MongoClient.connect(MONGO_URI);
  cachedClient = client;
  return client.db("blogDB");
}

// Helper
function generateExcerpt(content, limit = 160) {
  const flat = (content || "").replace(/\s+/g, " ").trim();
  return flat.length > limit ? flat.slice(0, limit - 3) + "..." : flat;
}

// Handler
module.exports = async (req, res) => {
  const db = await getDb();
  const blogs = db.collection("blogs");

  if (req.method === "GET") {
    const allBlogs = await blogs.find().sort({ createdAt: -1 }).toArray();
    return res.status(200).json(allBlogs);
  }

  if (req.method === "POST") {
    const form = new formidable.IncomingForm();
    form.parse(req, async (err, fields, files) => {
      if (err) return res.status(500).json({ error: err.message });

      const { heading, content, imageUrl } = fields;
      if (!heading || !content) return res.status(400).json({ error: "heading and content required" });

      let finalImage = imageUrl || "";
      if (files.imageFile) {
        const uploaded = await cloudinary.uploader.upload(files.imageFile.filepath, {
          folder: "blogs"
        });
        finalImage = uploaded.secure_url;
      }
      if (!finalImage) return res.status(400).json({ error: "Provide imageUrl or upload imageFile" });

      const blog = {
        heading,
        content,
        excerpt: generateExcerpt(content),
        imageUrl: finalImage,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = await blogs.insertOne(blog);
      return res.status(201).json({ ...blog, id: result.insertedId });
    });
    return;
  }

  return res.status(405).json({ error: "Method not allowed" });
};
