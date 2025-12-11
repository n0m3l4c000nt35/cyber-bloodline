import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (username, email, password) =>
    api.post('/auth/register', { username, email, password }),

  login: (username, password) =>
    api.post('/auth/login', { username, password }),

  getProfile: () =>
    api.get('/auth/profile'),
};

export const postsAPI = {
  createPost: (content) =>
    api.post('/posts', { content }),

  getFeed: (limit = 20, offset = 0) =>
    api.get('/posts', { params: { limit, offset } }),

  getPost: (id) =>
    api.get(`/posts/${id}`),

  deletePost: (id) =>
    api.delete(`/posts/${id}`),
};

export const followsAPI = {
  followUser: (username) =>
    api.post(`/follows/${username}`),

  unfollowUser: (username) =>
    api.delete(`/follows/${username}`),

  getFollowing: () =>
    api.get('/follows/list/following'),

  getFollowers: () =>
    api.get('/follows/list/followers'),

  getFollowingFeed: (limit = 20, offset = 0) =>
    api.get('/follows/feed', { params: { limit, offset } }),

  checkFollowing: (username) =>
    api.get(`/follows/check/${username}`),
};

export const usersAPI = {
  searchUsers: (query) =>
    api.get('/users/search', { params: { query } }),

  getUserProfile: (username) =>
    api.get(`/users/${username}`),

  getUserPosts: (username, limit = 20, offset = 0) =>
    api.get(`/users/${username}/posts`, { params: { limit, offset } }),

  getAllUsers: (limit = 20, offset = 0) =>
    api.get('/users/list', { params: { limit, offset } }),
};

export default api;