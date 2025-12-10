import axios from 'axios';
import { AuthApi } from '../api/authApi';

const axiosClient = axios.create({});

// ====== Trạng thái refresh ======
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

// Đẩy request vào hàng đợi
function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

// Khi refresh thành công → gọi lại toàn bộ request
function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

// ====== REQUEST INTERCEPTOR: add access token ======
axiosClient.interceptors.request.use(
  (config) => {
    const token = AuthApi.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      const refreshToken = AuthApi.getRefreshToken();
      if (!refreshToken) AuthApi.forceLogout();
    }
    return config;
  },
  (err) => Promise.reject(err)
);

// ====== RESPONSE INTERCEPTOR: auto refresh ======
axiosClient.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    // Nếu không phải 401 → trả về lỗi luôn
    if (error.response?.status !== 401) {
      return Promise.reject(error);
    }

    // Nếu đang refresh → chờ refreshToken xong rồi retry
    if (isRefreshing) {
      return new Promise((resolve) => {
        subscribeTokenRefresh((token: string) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          resolve(axiosClient(originalRequest));
        });
      });
    }

    // Nếu chưa refresh → bắt đầu refresh
    isRefreshing = true;

    try {
      const newToken = await AuthApi.refreshAccessToken();

      isRefreshing = false;
      onRefreshed(newToken);

      // Gắn token mới và retry
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return axiosClient(originalRequest);
    } catch (refreshErr) {
      isRefreshing = false;
      AuthApi.forceLogout();
      return Promise.reject(refreshErr);
    }
  }
);

export default axiosClient;
