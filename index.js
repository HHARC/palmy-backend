import express from "express";
import blogsHandler from "./api/blogs.js";
import cors from "cors";

const app = express();

// Enable CORS globally
app.use(cors());

// Needed for JSON requests
app.use(express.json());

// Blog route (all /api/blogs requests go to blogs.js)
app.all("/api/blogs", (req, res) => blogsHandler(req, res));
app.all("/api/blogs/:id", (req, res) => blogsHandler(req, res)); // for DELETE

// Health route
app.get("/", (req, res) => {
  res.json({ message: "Hello! Server backend is working." });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
