// routes/index.js

import userRoutes from './users.js';

const constructorMethod = (app) => {
  app.use('/', userRoutes);

  // Use regex route for catch-all (new Express versions)
  app.use(/(.*)/, (req, res) => {
    res.status(404).render('error', { error: 'Page not found' });
  });
};

export default constructorMethod;


