// Validate email
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate password strength
export const isValidPassword = (password) => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

// Validate required field
export const isRequired = (value) => {
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  return value !== null && value !== undefined;
};

// Validate min length
export const minLength = (value, min) => {
  if (typeof value === 'string') {
    return value.trim().length >= min;
  }
  return false;
};

// Validate max length
export const maxLength = (value, max) => {
  if (typeof value === 'string') {
    return value.trim().length <= max;
  }
  return false;
};

// Validate login form
export const validateLoginForm = (formData) => {
  const errors = {};

  if (!isRequired(formData.email)) {
    errors.email = 'Email is required';
  } else if (!isValidEmail(formData.email)) {
    errors.email = 'Invalid email format';
  }

  if (!isRequired(formData.password)) {
    errors.password = 'Password is required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

// Validate incident form
export const validateIncidentForm = (formData) => {
  const errors = {};

  if (!isRequired(formData.title)) {
    errors.title = 'Title is required';
  } else if (!minLength(formData.title, 5)) {
    errors.title = 'Title must be at least 5 characters';
  } else if (!maxLength(formData.title, 200)) {
    errors.title = 'Title must not exceed 200 characters';
  }

  if (!isRequired(formData.description)) {
    errors.description = 'Description is required';
  } else if (!minLength(formData.description, 10)) {
    errors.description = 'Description must be at least 10 characters';
  }

  if (!isRequired(formData.severity)) {
    errors.severity = 'Severity is required';
  }

  if (formData.affectedService && !isRequired(formData.affectedService)) {
    errors.affectedService = 'Affected service is required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

// Validate user form
export const validateUserForm = (formData, isEdit = false) => {
  const errors = {};

  if (!isRequired(formData.name)) {
    errors.name = 'Name is required';
  } else if (!minLength(formData.name, 2)) {
    errors.name = 'Name must be at least 2 characters';
  }

  if (!isRequired(formData.email)) {
    errors.email = 'Email is required';
  } else if (!isValidEmail(formData.email)) {
    errors.email = 'Invalid email format';
  }

  if (!isEdit) {
    if (!isRequired(formData.password)) {
      errors.password = 'Password is required';
    } else if (!isValidPassword(formData.password)) {
      errors.password =
        'Password must be at least 8 characters with uppercase, lowercase, and number';
    }
  }

  if (!isRequired(formData.role)) {
    errors.role = 'Role is required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

// Validate comment form
export const validateCommentForm = (formData) => {
  const errors = {};

  if (!isRequired(formData.content)) {
    errors.content = 'Comment is required';
  } else if (!minLength(formData.content, 1)) {
    errors.content = 'Comment must not be empty';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};