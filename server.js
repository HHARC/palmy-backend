import express from "express";
import cors from "cors";
import morgan from "morgan";

import { PORT } from "./config/constants.js";
import blogsRouter from "./routes/blogs.js";
import errorHandler from "./middleware/errorHandler.js";

const app = express();

app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(morgan("combined"));

/**
 * @route GET /health
 * @description Health check endpoint
 * @returns {Object} Status and current time
 */
app.get("/health", (req, res) =>
  res.json({ status: "ok", time: new Date().toISOString() })
);

app.use("/api/blogs", blogsRouter);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
