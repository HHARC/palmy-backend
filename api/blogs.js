import { MongoClient, ObjectId } from "mongodb";
import formidable from "formidable";
import cloudinary from "cloudinary";

// Mongo
const MONGO_URI = process.env.MONGO_URI;
let cachedClient = null;
async function getDb() {
  if (cachedClient) return cachedClient.db("blogDB");
  const client = await MongoClient.connect(MONGO_URI);
  cachedClient = client;
  return client.db("blogDB");
}

// Cloudinary
cloudinary.v2.config({
  cloudinary_url: process.env.CLOUDINARY_URL
});

// Helpers
function generateExcerpt(content, limit = 160) {
  const flat = (content || "").replace(/\s+/g, " ").trim();
  return flat.length > limit ? flat.slice(0, limit - 3) + "..." : flat;
}

// Vercel API handler
export default async function handler(req, res) {
  const db = await getDb();

  if (req.method === "GET") {
    const blogs = await db.collection("blogs").find().sort({ createdAt: -1 }).toArray();
    return res.status(200).json(blogs);
  }

  if (req.method === "POST") {
    const form = new formidable.IncomingForm();
    form.parse(req, async (err, fields, files) => {
      if (err) return res.status(500).json({ error: err.message });

      const { heading, content, imageUrl } = fields;
      if (!heading || !content) return res.status(400).json({ error: "heading and content required" });

      let finalImage = imageUrl || "";
      if (files.imageFile) {
        const uploaded = await cloudinary.v2.uploader.upload(files.imageFile.filepath, { folder: "blogs" });
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

      const result = await db.collection("blogs").insertOne(blog);
      return res.status(201).json({ ...blog, id: result.insertedId });
    });
    return;
  }

  if (req.method === "DELETE") {
    const { id } = req.query;
    const result = await db.collection("blogs").deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) return res.status(404).json({ error: "Not found" });
    return res.status(200).json({ success: true });
  }

  res.setHeader("Allow", ["GET", "POST", "DELETE"]);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
