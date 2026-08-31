import axios from 'axios';

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Bearer Token if available
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Extract data and handle 401 Unauthorized globally
axiosClient.interceptors.response.use(
  (response) => {
    // Return standard response body
    return response.data;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn('Unauthorized request (401). Clearing session and redirecting to login.');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      
      // Avoid infinite loop if already on login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login?session_expired=true';
      }
    }

    const customError = error.response?.data || {
      statusCode: error.response?.status || 500,
      message: error.message || 'Network error occurred',
      error: 'API Error',
    };

    return Promise.reject(customError);
  }
);

export default axiosClient;
