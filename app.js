import express from 'express';
import exphbs from 'express-handlebars';
import session from 'express-session';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectToDb } from './config/mongoConnection.js';
import configRoutes from './routes/index.js';
import placeRoutes from './routes/places.js';
import dotenv from 'dotenv';
import methodOverride from 'method-override';
import { initCollections } from './config/initCollections.js';

dotenv.config();


const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const startServer = async () => {
  try {

    const db = await connectToDb();
    await initCollections(); 


    app.use(methodOverride('_method'));
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use('/public', express.static(path.join(__dirname, 'public')));


    app.use(session({
      name: 'HealthHiveSession',
      secret: process.env.SESSION_SECRET || 'your-secret-key',
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      }
    }));


    const hbs = exphbs.create({
  helpers: {
    eq: (a, b) => a === b,
    toString: (obj) => obj.toString(),
    formatDate: (date) => new Date(date).toLocaleDateString()
  },
  defaultLayout: 'main'
});

    

    app.engine('handlebars', hbs.engine);
    app.set('view engine', 'handlebars');
    app.set('views', path.join(__dirname, 'views'));


    app.use('/places', placeRoutes);
    configRoutes(app);


    app.use((req, res) => {
      res.status(404).render('error', {
        title: 'Page Not Found',
        error: 'The page you requested could not be found'
      });
    });

 
    app.use((err, req, res, next) => {
      console.error(err.stack);
      res.status(500).render('error', {
        title: 'Server Error',
        error: 'Something went wrong on our end'
      });
    });

  
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};


startServer();