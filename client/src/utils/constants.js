// Incident Statuses
export const INCIDENT_STATUS = {
  OPEN: 'OPEN',
  ASSIGNED: 'ASSIGNED',
  INVESTIGATING: 'INVESTIGATING',
  RESOLVED: 'RESOLVED',
  CLOSED: 'CLOSED',
  REOPENED: 'REOPENED',
};

// Severity Levels
export const SEVERITY = {
  CRITICAL: 'CRITICAL',
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW',
};

// SLA Status
export const SLA_STATUS = {
  WITHIN_SLA: 'WITHIN_SLA',
  APPROACHING_BREACH: 'APPROACHING_BREACH',
  BREACHED: 'BREACHED',
};

// User Roles
export const USER_ROLES = {
  ADMIN: 'ADMIN',
  RESPONDER: 'RESPONDER',
  REPORTER: 'REPORTER',
};

// Status Colors for UI
export const STATUS_COLORS = {
  OPEN: 'status-open',
  ASSIGNED: 'status-assigned',
  INVESTIGATING: 'status-investigating',
  RESOLVED: 'status-resolved',
  CLOSED: 'status-closed',
  REOPENED: 'status-reopened',
};

// Severity Colors for UI
export const SEVERITY_COLORS = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
};

// SLA Colors for UI
export const SLA_COLORS = {
  WITHIN_SLA: 'sla-within',
  APPROACHING_BREACH: 'sla-warning',
  BREACHED: 'sla-breach',
};

// Pagination
export const DEFAULT_PAGE_SIZE = 20;
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

// Date Formats
export const DATE_FORMAT = 'MMM dd, yyyy';
export const DATETIME_FORMAT = 'MMM dd, yyyy HH:mm';
export const TIME_FORMAT = 'HH:mm';

// API Endpoints
export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Toast Messages
export const TOAST_MESSAGES = {
  LOGIN_SUCCESS: 'Login successful!',
  LOGOUT_SUCCESS: 'Logged out successfully',
  INCIDENT_CREATED: 'Incident created successfully',
  INCIDENT_UPDATED: 'Incident updated successfully',
  INCIDENT_DELETED: 'Incident deleted successfully',
  COMMENT_ADDED: 'Comment added successfully',
  ERROR_OCCURRED: 'An error occurred. Please try again.',
  UNAUTHORIZED: 'You are not authorized to perform this action',
  SESSION_EXPIRED: 'Your session has expired. Please login again.',
};

// Notification Types
export const NOTIFICATION_TYPES = {
  INCIDENT_CREATED: 'INCIDENT_CREATED',
  INCIDENT_ASSIGNED: 'INCIDENT_ASSIGNED',
  STATUS_UPDATED: 'STATUS_UPDATED',
  SLA_WARNING: 'SLA_WARNING',
  SLA_BREACH: 'SLA_BREACH',
  COMMENT_ADDED: 'COMMENT_ADDED',
  INCIDENT_RESOLVED: 'INCIDENT_RESOLVED',
};