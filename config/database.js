import { MongoClient } from "mongodb";

const MONGO_URI =
  "mongodb+srv://hharc123_db_user:biqrUSR19hTNjV1a@blogs.5k9mhsx.mongodb.net/blogDB?retryWrites=true&w=majority";

let cachedClient = null;

/**
 * Get MongoDB database connection
 * @returns {Promise<Object>} MongoDB database instance
 */
export async function getDb() {
  if (cachedClient) {
    return cachedClient.db("blogDB");
  }

  const client = await MongoClient.connect(MONGO_URI);
  cachedClient = client;
  return client.db("blogDB");
}

export default getDb;
