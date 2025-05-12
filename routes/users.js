import { Router } from 'express';
import { createUser, findUserByEmail, updateUserProfile } from '../data/users.js';
import bcrypt from 'bcryptjs';
import { loginMiddleware } from '../middleware.js';
import multer from 'multer';
import { ObjectId } from 'mongodb';
import { validateEmail, validateString } from '../helpers.js';

const router = Router();
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.get('/', (req, res) => {
  res.render('home', { 
    title: 'Health Hive - Welcome',
    showHeader: true 
  });
});

router.get('/register', (req, res) => {
  if (req.session.user) {
    return res.redirect('/profile');
  }
  res.render('register', { 
    title: 'Register - Health Hive',
    showHeader: false 
  });
});

router.post('/register', async (req, res) => {
  try {
    const { email, username, password, confirmPassword } = req.body;

    // Validate all fields exist
    if (!email || !username || !password || !confirmPassword) {
      throw new Error('All fields are required');
    }

    // Validate email format
    if (!validateEmail(email)) {
      throw new Error('Please enter a valid email address');
    }

    // Validate strings
    validateString(username, 'Username', 3);
    validateString(password, 'Password', 8);

    if (password !== confirmPassword) {
      throw new Error('Passwords do not match');
    }

    await createUser(email, username, password);
    res.redirect('/login');
  } catch (e) {
    res.status(400).render('register', {
      title: 'Register - Health Hive',
      error: e.message,
      formData: req.body,
      showHeader: false
    });
  }
});

router.get('/login', (req, res) => {
  if (req.session.user) {
    return res.redirect('/profile');
  }
  res.render('login', { 
    title: 'Login - Health Hive',
    showHeader: false 
  });
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new Error('Both email and password are required');
    }

    const user = await findUserByEmail(email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new Error('Invalid email or password');
    }

    req.session.user = {
      _id: user._id.toString(),
      username: user.username,
      email: user.email
    };

  const returnTo = req.session.returnTo || '/';
  delete req.session.returnTo;
  res.redirect(returnTo);
  } catch (e) {
    res.render('login', {
      title: 'Login - Health Hive',
      error: e.message,
      formData: req.body,
      showHeader: false
    });
  }
});

// Profile Route - GET
router.get('/profile', loginMiddleware, async (req, res) => {
  try {
    const user = await findUserByEmail(req.session.user.email);
    if (!user) {
      req.session.destroy();
      return res.redirect('/login?error=user_not_found');
    }

    res.render('profile', {
      title: 'Your Profile',
      user: {
        email: user.email,
        username: user.username,
        bio: user.bio || '',
        profilePhoto: user.profilePhoto 
          ? user.profilePhoto.toString('base64') 
          : null
      }
    });
  } catch (e) {
    console.error('Profile error:', e);
    res.redirect('/login?error=profile_error');
  }
});

router.post('/profile', loginMiddleware, upload.single('profilePhoto'), async (req, res) => {
  try {
    const { bio } = req.body;
    const profilePhoto = req.file;
    const updates = {};

    if (bio && typeof bio === 'string') updates.bio = bio.trim();
    if (profilePhoto) updates.profilePhoto = profilePhoto.buffer;

    await updateUserProfile(new ObjectId(req.session.user._id), updates);
    res.redirect('/profile');
  } catch (e) {
    console.error('Profile update error:', e);
    res.redirect('/profile?error=' + encodeURIComponent(e.message));
  }
});

router.get('/dashboard', loginMiddleware, async (req, res) => {
  try {
    const user = await findUserByEmail(req.session.user.email);
    if (!user) {
      req.session.destroy();
      return res.redirect('/login');
    }

    res.render('dashboard', {
      title: 'Dashboard',
      user: {
        username: user.username,
        email: user.email,
        joinDate: user.createdAt.toLocaleDateString()
      }
    });
  } catch (e) {
    console.error('Dashboard error:', e);
    res.redirect('/profile?error=dashboard_error');
  }
});
router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

export default router;