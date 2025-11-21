# Palmy Blog API Documentation

## Overview
This is a RESTful Blog API built with Express.js and MongoDB. It provides endpoints for creating, reading, and deleting blog posts with support for image uploads via Multer.

## Base URL
```
http://localhost:4040
```

## Middleware
- **CORS**: Allows requests from any origin
- **JSON Parser**: Parses incoming JSON requests (5MB limit)
- **Morgan**: Logs all HTTP requests in combined format
- **Multer**: Handles multipart/form-data for file uploads
  - Max file size: 5MB
  - Allowed formats: JPEG, PNG, GIF, WebP

---

## Endpoints

### 1. Health Check

**GET** `/health`

Health check endpoint to verify server is running.

**Response (200 OK):**
```json
{
  "status": "ok",
  "time": "2024-01-15T10:30:00.000Z"
}
```

---

### 2. Get All Blogs

**GET** `/api/blogs`

Retrieve all blogs sorted by creation date (newest first).

**Response (200 OK):**
```json
[
  {
    "_id": "65a3f4d2c1234567890abcd1",
    "heading": "First Blog Post",
    "content": "This is the full blog content...",
    "excerpt": "This is the full blog content...",
    "imageUrl": "/uploads/1234567890-123456789.jpg",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
]
```

---

### 3. Get Single Blog

**GET** `/api/blogs/:id`

Retrieve a specific blog by MongoDB ObjectId.

**Parameters:**
- `id` (string, required): MongoDB blog ID

**Response (200 OK):**
```json
{
  "_id": "65a3f4d2c1234567890abcd1",
  "heading": "First Blog Post",
  "content": "This is the full blog content...",
  "excerpt": "This is the full blog content...",
  "imageUrl": "/uploads/1234567890-123456789.jpg",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

**Error Responses:**
- `400 Bad Request`: Invalid blog ID format
- `404 Not Found`: Blog not found

---

### 4. Create Blog Post

**POST** `/api/blogs`

Create a new blog post with optional image upload.

**Content-Type:** `multipart/form-data`

**Parameters:**
- `heading` (string, required): Blog title
- `content` (string, required): Blog content
- `imageFile` (file, optional): Image file (multipart)
  - Supported formats: JPEG, PNG, GIF, WebP
  - Max size: 5MB

**Example Request (cURL):**
```bash
curl -X POST http://localhost:4040/api/blogs \
  -F "heading=My First Blog" \
  -F "content=This is my blog content" \
  -F "imageFile=@./image.jpg"
```

**Example Request (JavaScript Fetch):**
```javascript
const formData = new FormData();
formData.append('heading', 'My First Blog');
formData.append('content', 'This is my blog content');
formData.append('imageFile', imageFileInput.files[0]);

const response = await fetch('http://localhost:4040/api/blogs', {
  method: 'POST',
  body: formData
});

const blog = await response.json();
console.log(blog);
```

**Response (201 Created):**
```json
{
  "_id": "65a3f4d2c1234567890abcd1",
  "heading": "My First Blog",
  "content": "This is my blog content",
  "excerpt": "This is my blog content",
  "imageUrl": "/uploads/1234567890-123456789.jpg",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

**Error Responses:**
- `400 Bad Request`: Missing required fields or invalid file type
  ```json
  {
    "error": "heading and content are required"
  }
  ```
- `400 Bad Request`: File exceeds size limit
  ```json
  {
    "error": "File size exceeds 5MB limit"
  }
  ```
- `400 Bad Request`: Invalid file type
  ```json
  {
    "error": "Only image files are allowed"
  }
  ```

---

### 5. Delete Blog Post

**DELETE** `/api/blogs/:id`

Delete a blog post by MongoDB ObjectId.

**Parameters:**
- `id` (string, required): MongoDB blog ID

**Example Request (cURL):**
```bash
curl -X DELETE http://localhost:4040/api/blogs/65a3f4d2c1234567890abcd1
```

**Example Request (JavaScript Fetch):**
```javascript
const response = await fetch('http://localhost:4040/api/blogs/65a3f4d2c1234567890abcd1', {
  method: 'DELETE'
});

const result = await response.json();
console.log(result);
```

**Response (200 OK):**
```json
{
  "success": true
}
```

**Error Responses:**
- `400 Bad Request`: Invalid blog ID format
  ```json
  {
    "error": "Invalid blog ID"
  }
  ```
- `404 Not Found`: Blog not found
  ```json
  {
    "error": "Blog not found"
  }
  ```

---

## Blog Schema

```javascript
{
  _id: ObjectId,                    // MongoDB auto-generated ID
  heading: String,                  // Blog title (required)
  content: String,                  // Blog content (required)
  excerpt: String,                  // Auto-generated excerpt (160 chars)
  imageUrl: String,                 // URL to uploaded image
  createdAt: Date,                  // Auto-set on creation
  updatedAt: Date                   // Auto-set on creation/update
}
```

---

## Error Handling

The API uses standard HTTP status codes and returns error messages in JSON format:

```json
{
  "error": "Error description"
}
```

### Status Codes
- `200 OK`: Successful GET/DELETE request
- `201 Created`: Successful POST request
- `400 Bad Request`: Invalid input or validation error
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server-side error

---

## Request Logging

All requests are logged using Morgan in combined format. Logs will appear in the console with format:
```
METHOD URL HTTP_VERSION RESPONSE_CODE RESPONSE_TIME
```

Example:
```
POST /api/blogs HTTP/1.1 201 45ms
GET /api/blogs HTTP/1.1 200 12ms
DELETE /api/blogs/65a3f4d2c1234567890abcd1 HTTP/1.1 200 8ms
```

---

## Project Structure

```
palmy-backend/
├── config/
│   ├── database.js           # MongoDB connection logic
│   └── constants.js          # App configuration constants
├── middleware/
│   ├── upload.js             # Multer configuration
│   └── errorHandler.js       # Express error handler
├── models/
│   └── Blog.js               # Blog model with CRUD methods
├── routes/
│   └── blogs.js              # Blog API endpoints
├── utils/
│   └── helpers.js            # Helper functions (excerpt generation)
├── uploads/                  # Uploaded image files (auto-created)
├── server.js                 # Main Express server entry point
├── package.json              # Dependencies
└── API_DOCS.md               # This file
```

---

## Technologies Used

- **Express.js**: Web framework
- **MongoDB**: Database
- **Multer**: File upload handling
- **Morgan**: HTTP request logging
- **CORS**: Cross-origin resource sharing
- **Node.js**: Runtime environment

---

## Setup Instructions

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the server:**
   ```bash
   node server.js
   ```

3. **Access the API:**
   - API Base URL: `http://localhost:4040`
   - Health Check: `http://localhost:4040/health`

---

## Notes

- The excerpt is automatically generated from the first 160 characters of the content
- Uploaded images are stored in `/uploads` directory
- Images are served statically via `/uploads` route
- All timestamps are stored in UTC (ISO 8601 format)
- MongoDB caching is implemented for database connections
