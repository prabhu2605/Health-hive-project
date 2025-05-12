import { Router } from 'express';
import { createPlace, getAllPlaces, getPlaceById, updatePlace } from '../data/places.js';
import { loginMiddleware } from '../middleware.js';
import { ObjectId } from 'mongodb';

const router = Router();

// GET /places/ - List all places
router.get('/', async (req, res) => {
  try {
    const placesList = await getAllPlaces();
    res.render('places/list', {
      title: 'Browse Wellness Places',
      places: placesList,
      user: req.session.user,
      showAddButton: true 
    });
  } catch (e) {
    console.error('Error fetching places:', e);
    res.status(500).render('error', { 
      error: 'Failed to load places',
      details: e.message 
    });
  }
});

// GET /places/add - Show add place form (MUST come before :id route)
router.get('/add', loginMiddleware, (req, res) => {
  try {
    res.render('places/add', {
      title: 'Add New Place',
      user: req.session.user,
      formData: {}
    });
  } catch (e) {
    console.error('Error rendering add form:', e);
    res.status(500).render('error', { 
      error: 'Failed to load form',
      details: e.message 
    });
  }
});

// POST /places/add - Handle form submission
router.post('/add', loginMiddleware, async (req, res) => {
  console.log('\n=== FORM SUBMISSION STARTED ===');
  console.log('Session user:', req.session.user);
  console.log('Form data:', req.body);

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

    console.log('Successfully created place:', newPlace);
    return res.redirect(`/places/${newPlace._id}`);
  } catch (e) {
    console.error('Place creation failed:', e);
    return res.status(400).render('places/add', {
      title: 'Add New Place',
      error: e.message,
      formData, 
      user: req.session.user
    });
  }
});

// GET /places/:id - Show place details
router.get('/:id', async (req, res) => {
  const placeId = req.params.id;
  console.log('\n=== VIEWING PLACE DETAILS ===');
  console.log('Requested place ID:', placeId);

  try {
    if (!ObjectId.isValid(placeId)) {
      console.log('Invalid ID format:', placeId);
      return res.status(400).render('error', {
        error: 'Invalid place ID format',
        details: 'The provided ID is not valid'
      });
    }

    const place = await getPlaceById(placeId);
    if (!place) {
      throw new Error('Place not found in database');
    }

    console.log('Found place:', place.name);
    return res.render('places/detail', {
      title: place.name,
      place,
      user: req.session.user
    });
  } catch (e) {
    console.error('Error retrieving place:', e);
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
    
    // Verify ownership
    if (place.addedBy.toString() !== req.session.user._id.toString()) {
      throw new Error('You can only edit places you created');
    }

    res.render('places/edit', {
      title: `Edit ${place.name}`,
      place,
      user: req.session.user
    });
  } catch (e) {
    res.status(403).render('error', {
      error: 'Cannot edit place',
      details: e.message
    });
  }
});

// PUT /places/:id - Handle edit submission
router.put('/:id', loginMiddleware, async (req, res) => {
  console.log('Update request body:', req.body);
  try {
    const { name, type, services, address, city, state, zip } = req.body;
    
    const updatedPlace = await updatePlace(
      req.params.id,
      req.session.user._id,
      { name, type, services, address, city, state, zip }
    );

    res.redirect(`/places/${updatedPlace._id}`);
  } catch (e) {
    console.error('Update failed:', e);
  try {
    const place = await getPlaceById(req.params.id);
    res.status(403).render('places/edit', {
      title: 'Edit Place',
      error: e.message,
      place: {
        ...place,
        services: place.services.join(', '), 
        ...req.body
      },
      user: req.session.user
    });
  } catch (err) {
    console.error('Failed to load place for error display:', err);
    res.status(500).render('error', { 
      error: 'Failed to process your request' 
    });
  }
}
})
export default router;