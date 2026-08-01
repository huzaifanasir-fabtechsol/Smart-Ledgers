import { API_BASE_URL } from './config';

export const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  
  const headers = {
    ...options.headers,
  };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Token ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.reload();
  }

  return response;
};

export const getErrorMessage = async (response) => {
  try {
    const errorData = await response.json();
    if (errorData.error) return errorData.error;
    if (errorData.detail) return errorData.detail;
    if (errorData.message) return errorData.message;
    
    // Handle field-specific errors
    const fieldErrors = [];
    for (const [field, messages] of Object.entries(errorData)) {
      if (Array.isArray(messages)) {
        fieldErrors.push(`${field}: ${messages.join(', ')}`);
      } else if (typeof messages === 'string') {
        fieldErrors.push(`${field}: ${messages}`);
      }
    }
    
    if (fieldErrors.length > 0) return fieldErrors.join('; ');
    return 'An error occurred';
  } catch {
    return 'An error occurred';
  }
};
