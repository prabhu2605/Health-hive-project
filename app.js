// app.js
import express from 'express';
import exphbs from 'express-handlebars';
import session from 'express-session';
import path from 'path';
import { fileURLToPath } from 'url';
import configRoutes from './routes/index.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware setup
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use('/public', express.static(path.join(__dirname, 'public')));

// Session setup
app.use(
  session({
    name: 'AuthCookie',
    secret: 'someSuperSecretKey',
    resave: false,
    saveUninitialized: true
  })
);

// Cache-control middleware (⚡️NEW important middleware)
app.use((req, res, next) => {
  res.header('Cache-Control', 'no-store');
  next();
});

// View engine setup
app.engine('handlebars', exphbs.engine({ defaultLayout: 'main' }));
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

// Load all routes
configRoutes(app);

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Health Hive server running on http://localhost:${port}`);
});
