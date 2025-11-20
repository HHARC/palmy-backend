// Minimal easy backend (CommonJS) - run with: node server.js
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const { nanoid } = require("nanoid");

// CONFIG
const PORT = process.env.PORT || 4000;
const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "store.json"); // use store.json per your request
const UPLOAD_DIR = path.join(process.cwd(), "uploads");

// ensure folders & file
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify({ blogs: [] }, null, 2));
}
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// helpers
function readStore() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
  } catch (e) {
    return { blogs: [] };
  }
}
function writeStore(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}
function generateExcerpt(content, limit = 160) {
  const flat = (content || "").replace(/\s+/g, " ").trim();
  return flat.length > limit ? flat.slice(0, limit - 3) + "..." : flat;
}

// multer config (optional - you can ignore file uploads and send imageUrl instead)
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || "";
    cb(null, Date.now() + "-" + nanoid(6) + ext);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only images allowed"));
    }
    cb(null, true);
  }
});

const app = express();
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(UPLOAD_DIR));

// ROUTES

// GET /api/blogs  (list newest first)
app.get("/api/blogs", (_req, res) => {
  const { blogs } = readStore();
  const sorted = blogs.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(sorted);
});

// GET /api/blogs/:id
app.get("/api/blogs/:id", (req, res) => {
  const { blogs } = readStore();
  const blog = blogs.find(b => b.id === req.params.id);
  if (!blog) return res.status(404).json({ error: "Not found" });
  res.json(blog);
});

// POST /api/blogs  (multipart/form-data with imageFile OR JSON with imageUrl)
app.post("/api/blogs", upload.single("imageFile"), (req, res) => {
  const { heading, content, imageUrl } = req.body;
  if (!heading || !content) return res.status(400).json({ error: "heading and content required" });

  let finalImage = imageUrl || "";
  if (req.file) finalImage = "/uploads/" + req.file.filename;
  if (!finalImage) return res.status(400).json({ error: "Provide imageUrl or upload imageFile" });

  const now = new Date().toISOString();
  const blog = {
    id: nanoid(12),
    heading,
    content,
    excerpt: generateExcerpt(content),
    imageUrl: finalImage,
    createdAt: now,
    updatedAt: now
  };

  const store = readStore();
  store.blogs.push(blog);
  writeStore(store);

  res.status(201).json(blog);
});

// PUT /api/blogs/:id  (multipart/form-data with imageFile OR JSON with imageUrl)
app.put("/api/blogs/:id", upload.single("imageFile"), (req, res) => {
  const store = readStore();
  const idx = store.blogs.findIndex(b => b.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Not found" });

  const { heading, content, imageUrl } = req.body;
  let img = imageUrl || store.blogs[idx].imageUrl;
  if (req.file) img = "/uploads/" + req.file.filename;

  const newContent = content || store.blogs[idx].content;

  store.blogs[idx] = {
    ...store.blogs[idx],
    heading: heading || store.blogs[idx].heading,
    content: newContent,
    excerpt: generateExcerpt(newContent),
    imageUrl: img,
    updatedAt: new Date().toISOString()
  };

  writeStore(store);
  res.json(store.blogs[idx]);
});

// DELETE /api/blogs/:id
app.delete("/api/blogs/:id", (req, res) => {
  const store = readStore();
  const before = store.blogs.length;
  store.blogs = store.blogs.filter(b => b.id !== req.params.id);
  if (store.blogs.length === before) return res.status(404).json({ error: "Not found" });
  writeStore(store);
  res.json({ success: true });
});

// health
app.get("/health", (_req, res) => res.json({ status: "ok", time: new Date().toISOString() }));

// start
app.listen(PORT, () => console.log(`Easy backend running on http://localhost:${PORT}`));