document.addEventListener('DOMContentLoaded', () => {
  const registerForm = document.getElementById('register-form');
  
  if (registerForm) {
    registerForm.addEventListener('submit', handleSubmit);

    document.getElementById('email')?.addEventListener('input', validateEmail);
    document.getElementById('username')?.addEventListener('input', validateUsername);
    document.getElementById('password')?.addEventListener('input', validatePassword);
    document.getElementById('confirmPassword')?.addEventListener('input', validateConfirmPassword);
  }

  function handleSubmit(e) {
    e.preventDefault();
    clearErrors();

    const email = document.getElementById('email')?.value.trim() || '';
    const username = document.getElementById('username')?.value.trim() || '';
    const password = document.getElementById('password')?.value || '';
    const confirmPassword = document.getElementById('confirmPassword')?.value || '';

    let isValid = true;

    if (!validateEmailField(email)) {
      isValid = false;
    }
   if (!validateUsernameField(username)) {
      isValid = false;
    }

    if (!validatePasswordField(password)) {
      isValid = false;
    }

    if (!validateConfirmPasswordField(password, confirmPassword)) {
      isValid = false;
    }

    if (isValid) {
      registerForm.submit();
    }
  }

  function validateEmail() {
    const email = document.getElementById('email')?.value.trim() || '';
    validateEmailField(email);
  }

  function validateEmailField(email) {
    clearError('email');
    
    if (!email) {
      showError('email', 'Email is required');
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showError('email', 'Please enter a valid email');
      return false;
    }

    return true;
  }

  function validateUsername() {
    const username = document.getElementById('username')?.value.trim() || '';
    validateUsernameField(username);
  }

  function validateUsernameField(username) {
    clearError('username');
    
    if (!username) {
      showError('username', 'Username is required');
      return false;
    }

    if (username.length < 3) {
      showError('username', 'Username must be at least 3 characters');
      return false;
    }

    return true;
  }

  function validatePassword() {
    const password = document.getElementById('password')?.value || '';
    validatePasswordField(password);
  }

  function validatePasswordField(password) {
    clearError('password');
    
    if (!password) {
      showError('password', 'Password is required');
      return false;
    }

    if (password.length < 8) {
      showError('password', 'Password must be at least 8 characters');
      return false;
    }

    if (!/[A-Z]/.test(password)) {
      showError('password', 'Password must contain at least one uppercase letter');
      return false;
    }

    if (!/[0-9]/.test(password)) {
      showError('password', 'Password must contain at least one number');
      return false;
    }

    if (!/[^A-Za-z0-9]/.test(password)) {
      showError('password', 'Password must contain at least one special character');
      return false;
    }

    return true;
  }

  function validateConfirmPassword() {
    const password = document.getElementById('password')?.value || '';
    const confirmPassword = document.getElementById('confirmPassword')?.value || '';
    validateConfirmPasswordField(password, confirmPassword);
  }

  function validateConfirmPasswordField(password, confirmPassword) {
    clearError('confirmPassword');
    
    if (!confirmPassword) {
      showError('confirmPassword', 'Please confirm your password');
      return false;
    }

    if (password !== confirmPassword) {
      showError('confirmPassword', 'Passwords do not match');
      return false;
    }

    return true;
  }

  function showError(fieldId, message) {
    const field = document.getElementById(fieldId);
    if (!field) return;

    let errorElement = document.getElementById(`${fieldId}-error`);
    if (!errorElement) {
      errorElement = document.createElement('div');
      errorElement.id = `${fieldId}-error`;
      errorElement.className = 'error-message';
      field.parentNode.insertBefore(errorElement, field.nextSibling);
    }

    errorElement.textContent = message;
    field.classList.add('is-invalid');
  }

  function clearError(fieldId) {
    const field = document.getElementById(fieldId);
    if (!field) return;

    const errorElement = document.getElementById(`${fieldId}-error`);
    if (errorElement) {
      errorElement.textContent = '';
    }
    field.classList.remove('is-invalid');
  }

  function clearErrors() {
    document.querySelectorAll('.error-message').forEach(el => {
      el.textContent = '';
    });
    document.querySelectorAll('.is-invalid').forEach(el => {
      el.classList.remove('is-invalid');
    });
  }
});