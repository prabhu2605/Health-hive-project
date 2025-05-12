import { places } from '../config/mongoCollections.js';
import { ObjectId } from 'mongodb';
import xss from 'xss';

export const createPlace = async (name, type, services, location, addedBy) => {


  
  if (!ObjectId.isValid(addedBy)) {
    throw new Error(`Invalid user ID format: ${addedBy}`);
  }

  const placesCollection = await places();
  const placeToInsert = {
    name: xss(name.trim()),
    type: xss(type.trim()),
    services: services.map(s => xss(s.trim())),
    location: {
      address: xss(location.address.trim()),
      city: xss(location.city.trim()),
      state: xss(location.state.trim()),
      zip: xss(location.zip.trim())
    },
    addedBy: new ObjectId(addedBy),
    averageRating: 0,
    reviewCount: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  console.log('Place to insert:', placeToInsert);

  try {
    const result = await placesCollection.insertOne(placeToInsert);
    console.log('Insert result:', result);

    if (!result.acknowledged) {
      throw new Error('Database did not acknowledge the insertion');
    }

    const foundPlace = await placesCollection.findOne({ _id: result.insertedId });
    console.log('Found place after insertion:', foundPlace);

    if (!foundPlace) {
      throw new Error('Place was not found after creation');
    }

    return foundPlace;
  } catch (e) {
    console.error('Database operation failed:', e);
    throw e;
  }
};



export const getAllPlaces = async () => {
  const placesCollection = await places();
  return await placesCollection.find({}).toArray();
};

export const getPlaceById = async (id) => {
  if (!ObjectId.isValid(id)) throw new Error('Invalid ID');
  
  const placesCollection = await places();
  const place = await placesCollection.findOne({ _id: new ObjectId(id) });
  
  if (!place) throw new Error('Place not found');
  return place;
};

export const updatePlace = async (placeId, userId, updateData) => {
  if (!ObjectId.isValid(placeId)) throw new Error('Invalid place ID');
  if (!ObjectId.isValid(userId)) throw new Error('Invalid user ID');

  const placesCollection = await places();
  const placeObjId = new ObjectId(placeId);
  const userObjId = new ObjectId(userId);
  console.log('Updating place:', placeObjId, 'for user:', userObjId);

  const existingPlace = await placesCollection.findOne({ _id: placeObjId });
  if (!existingPlace) {
    console.log('Place not found in DB');
    throw new Error('Place not found');
  }

  console.log('Place owner:', existingPlace.addedBy, 'Current user:', userObjId);
  
  if (!existingPlace.addedBy.equals(userObjId)) {
    console.log('Ownership mismatch');
    throw new Error('You are not the owner');
  }

  const { name, type, services, address, city, state, zip } = updateData;
  
  const updateDoc = {
    $set: {
      name: xss(name.trim()),
      type: xss(type.trim()),
      services: Array.isArray(services) ? 
        services.map(s => xss(s.trim())) : 
        services.split(',').map(s => xss(s.trim())),
      location: {
        address: xss(address.trim()),
        city: xss(city.trim()),
        state: xss(state.trim()),
        zip: xss(zip.trim())
      },
      updatedAt: new Date()
    }
  };

  const result = await placesCollection.findOneAndUpdate(
    { 
      _id: new ObjectId(placeId),
      addedBy: new ObjectId(userId)
    },
    updateDoc,
    { 
      returnDocument: 'after',
      projection: { _id: 1, name: 1, type: 1, services: 1, location: 1, addedBy: 1 }
    }
    );

  if (!result.value) {
    console.log('No document was updated - likely ownership mismatch');
    throw new Error('Place not found or you are not the owner');
  }

  return result.value;
};