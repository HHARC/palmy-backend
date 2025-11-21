import { ObjectId } from "mongodb";

export class BlogModel {
  constructor(db) {
    this.db = db;
    this.collection = db.collection("blogs");
  }

  getSchema() {
    return {
      _id: ObjectId,
      heading: { type: String, required: true },
      content: { type: String, required: true },
      excerpt: { type: String, required: true },
      imageUrl: { type: String, required: false },
      imagePublicId: { type: String, required: false },
      createdAt: { type: Date, required: true },
      updatedAt: { type: Date, required: true },
    };
  }

  async create(blogData) {
    const blog = {
      heading: blogData.heading,
      content: blogData.content,
      excerpt: blogData.excerpt,
      imageUrl: blogData.imageUrl || "",
      imagePublicId: blogData.imagePublicId || "",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await this.collection.insertOne(blog);
    return { ...blog, _id: result.insertedId };
  }

  async findAll() {
    return await this.collection.find().sort({ createdAt: -1 }).toArray();
  }

  async findById(id) {
    return await this.collection.findOne({ _id: new ObjectId(id) });
  }

   async deleteById(id) {
     const blog = await this.collection.findOne({ _id: new ObjectId(id) });
     if (!blog) return null;
     
     const result = await this.collection.deleteOne({ _id: new ObjectId(id) });
     return result.deletedCount > 0 ? blog : null;
   }

  async updateById(id, updateData) {
    const result = await this.collection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          ...updateData,
          updatedAt: new Date(),
        },
      }
    );
    return result.modifiedCount > 0;
  }
}

export default BlogModel;
