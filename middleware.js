export const loginMiddleware = (req, res, next) => {
  if (!req.session.user) {
    req.session.returnTo = req.originalUrl;
    return res.redirect('/login');
  }
  
  // Set cache-control headers
  res.set('Cache-Control', 'no-store');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');

  next();
};