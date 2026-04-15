import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/';

const api = axios.create({
  baseURL: API_BASE_URL,
});

let isRefreshing = false;
let refreshSubscribers = [];

const addRefreshSubscriber = (callback) => {
  refreshSubscribers.push(callback);
};

const notifyRefreshSubscribers = (nextToken) => {
  refreshSubscribers.forEach((callback) => callback(nextToken));
  refreshSubscribers = [];
};

const clearAuthStorage = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
};

const unwrapApiEnvelope = (payload) => {
  if (payload && payload.status === 'success' && typeof payload === 'object' && 'data' in payload) {
    return payload.data;
  }
  return payload;
};

// Request Interceptor: Attach JWT Token automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Generic Response Interceptor
api.interceptors.response.use(
  (response) => {
    // Unpack backend standardized JSON format seamlessly
    response.data = unwrapApiEnvelope(response.data);
    return response;
  },
  (error) => {
    const originalRequest = error.config;

    if (!error.response || error.response.status !== 401 || !originalRequest) {
      return Promise.reject(error);
    }

    const requestUrl = originalRequest.url || '';
    const isAuthEndpoint = requestUrl.includes('auth/login/') || requestUrl.includes('auth/refresh/');

    if (isAuthEndpoint) {
      return Promise.reject(error);
    }

    if (originalRequest._retry) {
      clearAuthStorage();
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }

    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      clearAuthStorage();
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        addRefreshSubscriber((nextToken) => {
          if (!nextToken) {
            reject(error);
            return;
          }

          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${nextToken}`;
          resolve(api(originalRequest));
        });
      });
    }

    isRefreshing = true;
    originalRequest._retry = true;

    return axios
      .post(`${API_BASE_URL}auth/refresh/`, { refresh: refreshToken })
      .then((response) => {
        const refreshPayload = unwrapApiEnvelope(response.data);
        const nextAccess = refreshPayload?.access;
        const nextRefresh = refreshPayload?.refresh;

        if (!nextAccess) {
          throw new Error('Token refresh did not return access token.');
        }

        localStorage.setItem('access_token', nextAccess);
        if (nextRefresh) {
          localStorage.setItem('refresh_token', nextRefresh);
        }

        notifyRefreshSubscribers(nextAccess);

        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${nextAccess}`;
        return api(originalRequest);
      })
      .catch((refreshError) => {
        notifyRefreshSubscribers(null);
        clearAuthStorage();
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      })
      .finally(() => {
        isRefreshing = false;
      });
  }
);

export default api;
