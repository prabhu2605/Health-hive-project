// config/mongoConnection.js

import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

let mongoClient;
let db;

export async function connectToDb() {
  if (!mongoClient) {
    mongoClient = new MongoClient(process.env.MONGO_URI);
    await mongoClient.connect();
    db = mongoClient.db(process.env.DB_NAME);
    console.log('Connected to MongoDB');
  }
  return db;
}

async function createIndexes() {
  try {
    // Places collection indexes
    await db.collection('places').createIndex(
      { name: 1, 'location.city': 1 }, 
      { unique: true, name: 'unique_place_city' }
    );
    await db.collection('places').createIndex(
      { type: 1 }, 
      { name: 'place_type_index' }
    );
    await db.collection('places').createIndex(
      { 'location.city': 1 }, 
      { name: 'city_index' }
    );
    
    console.log('Successfully created indexes for places collection');
  } catch (e) {
    console.error('Error creating indexes:', e);
 
  }
}
export async function closeConnection() {
  if (mongoClient) {
    await mongoClient.close();
    mongoClient = null;
    db = null;
    console.log('MongoDB connection closed');
  }
}

