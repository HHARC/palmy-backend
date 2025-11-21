// server.js
import 'dotenv/config'; // Automatically loads environment variables
import express from 'express';
import cors from 'cors';
import { MongoClient, ObjectId } from 'mongodb';
import { v2 as cloudinary } from 'cloudinary';
import formidable from 'formidable';

// Config
const PORT = process.env.PORT || 4000;

// MongoDB
const MONGO_URI = process.env.MONGO_URI;
let cachedClient = null;

async function getDb() {
  if (cachedClient) return cachedClient.db('blogDB');
  const client = await MongoClient.connect(MONGO_URI);
  cachedClient = client;
  return client.db('blogDB');
}

// Cloudinary
cloudinary.config({
  cloudinary_url: process.env.CLOUDINARY_URL
});

// Helpers
function generateExcerpt(content, limit = 160) {
  const flat = (content || '').replace(/\s+/g, ' ').trim();
  return flat.length > limit ? flat.slice(0, limit - 3) + '...' : flat;
}

const app = express();

// ✅ Allow all origins
app.use(cors({ origin: '*' }));
app.use(express.json());

// Routes

// GET all blogs
app.get('/api/blogs', async (_req, res) => {
  try {
    const db = await getDb();
    const blogs = await db.collection('blogs').find().sort({ createdAt: -1 }).toArray();
    res.json(blogs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET blog by ID
app.get('/api/blogs/:id', async (req, res) => {
  try {
    const db = await getDb();
    const blog = await db.collection('blogs').findOne({ _id: new ObjectId(req.params.id) });
    if (!blog) return res.status(404).json({ error: 'Not found' });
    res.json(blog);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST blog (with image upload)
app.post('/api/blogs', (req, res) => {
  const form = new formidable.IncomingForm();
  form.parse(req, async (err, fields, files) => {
    console.log('fields:', fields);
    console.log('files:', files);

    if (err) return res.status(500).json({ error: err.message });

    try {
      const { heading, content, imageUrl } = fields;
      let finalImage = imageUrl || '';

      if (files.imageFile) {
        console.log('Uploading image to Cloudinary...');
        const uploaded = await cloudinary.uploader.upload(files.imageFile.filepath, { folder: 'blogs' });
        console.log('Cloudinary upload result:', uploaded);
        finalImage = uploaded.secure_url;
      }

      if (!heading || !content) return res.status(400).json({ error: 'heading and content required' });
      if (!finalImage) return res.status(400).json({ error: 'Provide imageUrl or upload imageFile' });

      const db = await getDb();
      const blog = {
        heading,
        content,
        excerpt: generateExcerpt(content),
        imageUrl: finalImage,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await db.collection('blogs').insertOne(blog);
      res.status(201).json({ ...blog, id: result.insertedId });
    } catch (error) {
      console.error('POST /api/blogs error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
});


// DELETE blog
app.delete('/api/blogs/:id', async (req, res) => {
  try {
    const db = await getDb();
    const result = await db.collection('blogs').deleteOne({ _id: new ObjectId(req.params.id) });
    if (result.deletedCount === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// Start server
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
