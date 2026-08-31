import axiosClient from './axiosClient';

export const authApi = {
  login: async (credentials) => {
    // POST /auth/login
    // Expected response: { statusCode: 200, message: "Success", data: { accessToken: "...", user: { ... } } }
    return await axiosClient.post('/auth/login', credentials);
  },

  register: async (userData) => {
    // POST /auth/register
    return await axiosClient.post('/auth/register', userData);
  },

  getProfile: async () => {
    // GET /auth/profile
    return await axiosClient.get('/auth/profile');
  },

  logout: async () => {
    // POST /auth/logout
    return await axiosClient.post('/auth/logout');
  },
};

export default authApi;
