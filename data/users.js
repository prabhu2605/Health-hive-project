import { users } from '../config/mongoCollections.js';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';

const saltRounds = 12;

export const createUser = async (email, username, password) => {

  if (!email || typeof email !== 'string') throw new Error('Email must be a valid string');
  if (!username || typeof username !== 'string') throw new Error('Username must be a valid string');
  if (!password || typeof password !== 'string') throw new Error('Password must be a valid string');

  email = email.trim().toLowerCase();
  username = username.trim();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) throw new Error('Invalid email format');

  if (username.length < 3) throw new Error('Username must be at least 3 characters');

  if (password.length < 8) throw new Error('Password must be at least 8 characters');

  const userCollection = await users();
  const existingUser = await userCollection.findOne({ email });

  if (existingUser) throw new Error('Email already registered');

  const hashedPassword = await bcrypt.hash(password, saltRounds);

  const newUser = {
    email,
    username,
    password: hashedPassword,
    createdAt: new Date(),
    role: 'user',
    bio: '',
    profilePhoto: null
  };

  const insertInfo = await userCollection.insertOne(newUser);
  if (!insertInfo.acknowledged || !insertInfo.insertedId) {
    throw new Error('Could not create user');
  }

  const createdUser = await userCollection.findOne({ _id: insertInfo.insertedId });
  if (!createdUser) throw new Error('Failed to retrieve created user');

  return createdUser;
};

export const findUserByEmail = async (email) => {
  if (!email || typeof email !== 'string') throw new Error('Valid email required');
  
  email = email.trim().toLowerCase();
  const userCollection = await users();
  return await userCollection.findOne({ email });
};

export const updateUserProfile = async (userId, updates) => {
  if (!userId || !ObjectId.isValid(userId)) throw new Error('Invalid user ID');
  if (!updates || typeof updates !== 'object') throw new Error('Invalid updates');

  const userCollection = await users();
  const result = await userCollection.findOneAndUpdate(
    { _id: new ObjectId(userId) },
    { $set: updates },
    { returnDocument: 'after' }
  );

  if (!result.value) throw new Error('User not found');
  return result.value;
};


