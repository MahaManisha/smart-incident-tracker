// Format date to readable string
const formatDate = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Calculate time difference in minutes
const getTimeDifferenceInMinutes = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return Math.floor((end - start) / (1000 * 60));
};

// Format minutes to human readable format
const formatMinutesToReadable = (minutes) => {
  if (minutes < 60) {
    return `${minutes} minutes`;
  } else if (minutes < 1440) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  } else {
    const days = Math.floor(minutes / 1440);
    const hours = Math.floor((minutes % 1440) / 60);
    return `${days}d ${hours}h`;
  }
};

// Paginate results
const paginate = (page, limit) => {
  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 20;
  const skip = (pageNum - 1) * limitNum;
  
  return {
    page: pageNum,
    limit: limitNum,
    skip
  };
};

// Create pagination response
const paginationResponse = (page, limit, total) => {
  return {
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    pages: Math.ceil(total / parseInt(limit)),
    hasNext: parseInt(page) < Math.ceil(total / parseInt(limit)),
    hasPrev: parseInt(page) > 1
  };
};

// Generate random string
const generateRandomString = (length = 10) => {
  return Math.random().toString(36).substring(2, length + 2);
};

// Capitalize first letter
const capitalizeFirstLetter = (string) => {
  if (!string) return '';
  return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
};

// Clean object by removing null/undefined values
const cleanObject = (obj) => {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, v]) => v != null)
  );
};

// Group array by key
const groupBy = (array, key) => {
  return array.reduce((result, item) => {
    const group = item[key];
    if (!result[group]) {
      result[group] = [];
    }
    result[group].push(item);
    return result;
  }, {});
};

// Calculate percentage
const calculatePercentage = (value, total) => {
  if (total === 0) return 0;
  return ((value / total) * 100).toFixed(2);
};

// Sleep function for delays
const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// Generate incident number
const generateIncidentNumber = (year, sequenceNumber) => {
  return `INC-${year}-${String(sequenceNumber).padStart(4, '0')}`;
};

// Check if date is within range
const isDateInRange = (date, startDate, endDate) => {
  const d = new Date(date);
  const start = new Date(startDate);
  const end = new Date(endDate);
  return d >= start && d <= end;
};

// Get date range for period
const getDateRange = (period) => {
  const end = new Date();
  const start = new Date();
  
  switch (period) {
    case '7d':
      start.setDate(start.getDate() - 7);
      break;
    case '30d':
      start.setDate(start.getDate() - 30);
      break;
    case '90d':
      start.setDate(start.getDate() - 90);
      break;
    case 'today':
      start.setHours(0, 0, 0, 0);
      break;
    case 'yesterday':
      start.setDate(start.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      end.setDate(end.getDate() - 1);
      end.setHours(23, 59, 59, 999);
      break;
    case 'thisWeek':
      const day = start.getDay();
      const diff = start.getDate() - day + (day === 0 ? -6 : 1);
      start.setDate(diff);
      start.setHours(0, 0, 0, 0);
      break;
    case 'thisMonth':
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      break;
    default:
      start.setDate(start.getDate() - 30);
  }
  
  return { start, end };
};

// Validate and parse date
const parseDate = (dateString) => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    throw new Error('Invalid date format');
  }
  return date;
};

module.exports = {
  formatDate,
  getTimeDifferenceInMinutes,
  formatMinutesToReadable,
  paginate,
  paginationResponse,
  generateRandomString,
  capitalizeFirstLetter,
  cleanObject,
  groupBy,
  calculatePercentage,
  sleep,
  generateIncidentNumber,
  isDateInRange,
  getDateRange,
  parseDate
};