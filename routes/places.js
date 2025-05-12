import { Router } from 'express';
import { createPlace, getAllPlaces, getPlaceById, updatePlace, deletePlace } from '../data/places.js';
import { loginMiddleware } from '../middleware.js';
import { ObjectId } from 'mongodb';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const placesList = await getAllPlaces();
    res.render('places/list', {
      title: 'Browse Wellness Places',
      places: placesList,
      user: req.session.user,
      showAddButton: true,
      success: req.session.success,
      error: req.session.error
    });
    delete req.session.success;
    delete req.session.error;
  } catch (e) {
    res.status(500).render('error', { 
      error: 'Failed to load places',
      details: e.message 
    });
  }
});

router.get('/add', loginMiddleware, (req, res) => {
  res.render('places/add', {
    title: 'Add New Place',
    user: req.session.user,
    formData: {}
  });
});

router.post('/add', loginMiddleware, async (req, res) => {
  const { name, type, services, address, city, state, zip } = req.body;
  const formData = { name, type, services, address, city, state, zip };

  try {
    if (!name || !type || !services || !address || !city || !state || !zip) {
      throw new Error('All fields are required');
    }

    const newPlace = await createPlace(
      name,
      type,
      services.split(',').map(s => s.trim()),
      { address, city, state, zip },
      req.session.user._id
    );

    return res.redirect(`/places/${newPlace._id}`);
  } catch (e) {
    return res.status(400).render('places/add', {
      title: 'Add New Place',
      error: e.message,
      formData, 
      user: req.session.user
    });
  }
});

router.get('/:id', async (req, res) => {
  const placeId = req.params.id;
  try {
    if (!ObjectId.isValid(placeId)) {
      return res.status(400).render('error', {
        error: 'Invalid place ID format'
      });
    }

    const place = await getPlaceById(placeId);
    return res.render('places/detail', {
      title: place.name,
      place,
      user: req.session.user,
      success: req.session.success,
      error: req.session.error
    });
  } catch (e) {
    return res.status(404).render('error', {
      error: 'Place not found',
      details: e.message
    });
  }
});

router.get('/:id/edit', loginMiddleware, async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      throw new Error('Invalid place ID format');
    }

    const place = await getPlaceById(req.params.id);
    
    if (place.addedBy.toString() !== req.session.user._id.toString()) {
      throw new Error('You can only edit places you created');
    }

    res.render('places/edit', {
      title: `Edit ${place.name}`,
      place: {
        ...place,
        services: Array.isArray(place.services) ? place.services.join(', ') : place.services
      },
      user: req.session.user
    });
  } catch (e) {
    res.status(403).render('error', {
      error: 'Cannot edit place',
      details: e.message
    });
  }
});

router.put('/:id', loginMiddleware, async (req, res) => {
  try {
    const updatedPlace = await updatePlace(
      req.params.id,
      req.session.user._id,
      req.body
    );
    req.session.success = 'Place updated successfully';
    return res.redirect(`/places/${updatedPlace._id}`);
  } catch (e) {
    try {
      const originalPlace = await getPlaceById(req.params.id);
      return res.status(400).render('places/edit', {
        title: 'Edit Place',
        error: e.message.includes('duplicate key') 
          ? 'A place with this name already exists in this city'
          : e.message,
        place: {
          ...originalPlace,
          services: Array.isArray(originalPlace.services) 
            ? originalPlace.services.join(', ')
            : originalPlace.services,
          ...req.body
        },
        user: req.session.user
      });
    } catch (err) {
      return res.status(500).render('error', {
        error: 'Failed to process your request'
      });
    }
  }
});

router.delete('/:id', loginMiddleware, async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      throw new Error('Invalid place ID format');
    }

    await deletePlace(req.params.id, req.session.user._id);
    req.session.success = 'Place deleted successfully';
    return res.redirect('/places');
  } catch (e) {
    req.session.error = e.message;
    return res.redirect(`/places/${req.params.id}`);
  }
});

export default router;