export const validateEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email.trim());
};

export const validateString = (str, fieldName, minLength = 1) => {
  if (!str || typeof str !== 'string') {
    throw new Error(`${fieldName} must be a string`);
  }
  if (str.trim().length < minLength) {
    throw new Error(`${fieldName} must be at least ${minLength} characters`);
  }
  return str.trim();
};

export const validatePassword = (password) => {
  if (!password || typeof password !== 'string') return false;
  return password.length >= 8;
};


export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export const eq = (a, b) => {
  return a === b;
};


export default {
  formatDate,
  eq
};