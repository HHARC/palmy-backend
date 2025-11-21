// server.js
import express from 'express';
import cors from 'cors';
import { MongoClient, ObjectId } from 'mongodb';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

// ------------------ CONFIG ------------------
const PORT = 4000;
const MONGO_URI = 'mongodb+srv://hharc123_db_user:biqrUSR19hTNjV1a@blogs.5k9mhsx.mongodb.net/blogDB?retryWrites=true&w=majority';

// Ensure uploads folder exists
const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);

// ------------------ MONGODB ------------------
let cachedClient = null;
async function getDb() {
  if (cachedClient) return cachedClient.db('blogDB');
  const client = await MongoClient.connect(MONGO_URI);
  cachedClient = client;
  return client.db('blogDB');
}

// ------------------ HELPERS ------------------
function generateExcerpt(content, limit = 160) {
  const flat = (content || '').replace(/\s+/g, ' ').trim();
  return flat.length > limit ? flat.slice(0, limit - 3) + '...' : flat;
}

// ------------------ SERVER ------------------
const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

// Serve uploaded images
app.use('/uploads', express.static(UPLOAD_DIR));

// ------------------ ROUTES ------------------

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

// POST blog with image upload
app.post('/api/blogs', (req, res) => {
  const form = formidable({ multiples: false, uploadDir: UPLOAD_DIR, keepExtensions: true });

  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(500).json({ error: err.message });

    try {
      const { heading, content, imageUrl } = fields;

      if (!heading || !content) {
        return res.status(400).json({ error: 'heading and content required' });
      }

      // Handle uploaded file
      let finalImage = imageUrl || '';
      if (files.imageFile) {
        const file = files.imageFile;
        finalImage = `/uploads/${path.basename(file.filepath)}`;
      }

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
      console.error(error);
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
