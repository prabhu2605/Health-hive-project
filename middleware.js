// middleware.js

export const loginMiddleware = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }

  // Set cache-control headers to prevent browser from caching protected pages
  res.set('Cache-Control', 'no-store');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');

  next();
};
