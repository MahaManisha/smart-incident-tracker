// Email validation
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Password strength validation
const isStrongPassword = (password) => {
  // At least 6 characters, 1 uppercase, 1 lowercase, 1 number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;
  return passwordRegex.test(password);
};

// MongoDB ObjectId validation
const isValidObjectId = (id) => {
  const objectIdRegex = /^[0-9a-fA-F]{24}$/;
  return objectIdRegex.test(id);
};

// Sanitize string input
const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  return str.trim().replace(/[<>]/g, '');
};

// Validate date format
const isValidDate = (dateString) => {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
};

// Validate severity level
const isValidSeverity = (severity) => {
  const validSeverities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
  return validSeverities.includes(severity);
};

// Validate status
const isValidStatus = (status) => {
  const validStatuses = ['OPEN', 'ASSIGNED', 'INVESTIGATING', 'RESOLVED', 'CLOSED', 'REOPENED'];
  return validStatuses.includes(status);
};

// Validate role
const isValidRole = (role) => {
  const validRoles = ['ADMIN', 'RESPONDER', 'REPORTER'];
  return validRoles.includes(role);
};

module.exports = {
  isValidEmail,
  isStrongPassword,
  isValidObjectId,
  sanitizeString,
  isValidDate,
  isValidSeverity,
  isValidStatus,
  isValidRole
};