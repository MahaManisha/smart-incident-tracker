import { format, formatDistanceToNow, parseISO } from 'date-fns';

// Format date
export const formatDate = (date, dateFormat = 'MMM dd, yyyy') => {
  if (!date) return '-';
  try {
    const parsedDate = typeof date === 'string' ? parseISO(date) : date;
    return format(parsedDate, dateFormat);
  } catch (error) {
    return '-';
  }
};

// Format date and time
export const formatDateTime = (date) => {
  return formatDate(date, 'MMM dd, yyyy HH:mm');
};

// Format time
export const formatTime = (date) => {
  return formatDate(date, 'HH:mm');
};

// Format relative time (e.g., "2 hours ago")
export const formatRelativeTime = (date) => {
  if (!date) return '-';
  try {
    const parsedDate = typeof date === 'string' ? parseISO(date) : date;
    return formatDistanceToNow(parsedDate, { addSuffix: true });
  } catch (error) {
    return '-';
  }
};

// Format status for display
export const formatStatus = (status) => {
  if (!status) return '-';
  return status
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

// Format severity for display
export const formatSeverity = (severity) => {
  if (!severity) return '-';
  return severity.charAt(0).toUpperCase() + severity.slice(1).toLowerCase();
};

// Format incident number
export const formatIncidentNumber = (number) => {
  return number || '-';
};

// Calculate time remaining
export const calculateTimeRemaining = (deadline) => {
  if (!deadline) return null;

  const now = new Date();
  const deadlineDate = typeof deadline === 'string' ? parseISO(deadline) : deadline;
  const diff = deadlineDate - now;

  if (diff < 0) {
    return { text: 'Overdue', isOverdue: true };
  }

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return { text: `${days}d ${hours % 24}h remaining`, isOverdue: false };
  } else if (hours > 0) {
    return { text: `${hours}h ${minutes}m remaining`, isOverdue: false };
  } else {
    return { text: `${minutes}m remaining`, isOverdue: false };
  }
};

// Format user name
export const formatUserName = (user) => {
  if (!user) return 'Unknown';
  return user.name || user.email || 'Unknown';
};

// Format role
export const formatRole = (role) => {
  if (!role) return '-';
  return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
};

// Truncate text
export const truncateText = (text, maxLength = 100) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// Format number with commas
export const formatNumber = (num) => {
  if (num === null || num === undefined) return '0';
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};