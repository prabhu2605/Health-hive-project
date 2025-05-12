import { places } from '../config/mongoCollections.js';
import { ObjectId } from 'mongodb';


export const createPlace = async (name, type, services, location, addedBy) => {
  if (!ObjectId.isValid(addedBy)) {
    throw new Error(`Invalid user ID format: ${addedBy}`);
  }

  const placesCollection = await places();
  const placeToInsert = {
    name: name.trim(),
    type: type.trim(),
    services: services.map(s => s.trim()),
    location: {
      address: location.address.trim(),
      city: location.city.trim(),
      state: location.state.trim(),
      zip: location.zip.trim()
    },
    addedBy: new ObjectId(addedBy),
    averageRating: 0,
    reviewCount: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const result = await placesCollection.insertOne(placeToInsert);
  if (!result.acknowledged) {
    throw new Error('Database did not acknowledge the insertion');
  }

  const foundPlace = await placesCollection.findOne({ _id: result.insertedId });
  if (!foundPlace) {
    throw new Error('Place was not found after creation');
  }

  return foundPlace;
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

  const existingPlace = await placesCollection.findOne({ _id: placeObjId });
  if (!existingPlace) throw new Error('Place not found');
  if (!existingPlace.addedBy.equals(userObjId)) {
    throw new Error('You are not the owner');
  }

  const updateDoc = {
    $set: {
      name: updateData.name.trim(),
      type: updateData.type.trim(),
      services: Array.isArray(updateData.services) 
        ? updateData.services.map(s => s.trim())
        : updateData.services.split(',').map(s => s.trim()),
      location: {
        address: updateData.address.trim(),
        city: updateData.city.trim(),
        state: updateData.state.trim(),
        zip: updateData.zip.trim()
      },
      updatedAt: new Date()
    }
  };

  const result = await placesCollection.updateOne(
    { _id: placeObjId, addedBy: userObjId },
    updateDoc
  );

  if (result.modifiedCount === 0 && result.matchedCount === 0) {
    throw new Error('Update operation failed - no documents matched');
  }

  const updatedPlace = await placesCollection.findOne({ _id: placeObjId });
  return updatedPlace;
};

export const deletePlace = async (placeId, userId) => {
  if (!ObjectId.isValid(placeId)) throw new Error('Invalid place ID');
  if (!ObjectId.isValid(userId)) throw new Error('Invalid user ID');

  const placesCollection = await places();
  const placeObjId = new ObjectId(placeId);
  const userObjId = new ObjectId(userId);

  const place = await placesCollection.findOne({ _id: placeObjId });
  if (!place) throw new Error('Place not found');
  if (!place.addedBy.equals(userObjId)) {
    throw new Error('You can only delete places you created');
  }

  const result = await placesCollection.deleteOne({ 
    _id: placeObjId,
    addedBy: userObjId 
  });

  if (result.deletedCount === 0) {
    throw new Error('Delete operation failed - no documents deleted');
  }

  return { success: true };
};