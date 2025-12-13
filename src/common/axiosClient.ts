import axios from 'axios';
import { AuthApi } from '../api/authApi';

const axiosClient = axios.create({
  baseURL: 'http://localhost:8000', 
  headers: {
    'Content-Type': 'application/json',
  },
});

// ====== Trạng thái refresh ======
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

// Đẩy request vào hàng đợi khi đang refresh token
function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

// Khi refresh thành công → gọi lại toàn bộ request đang chờ
function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

// ====== REQUEST INTERCEPTOR: Gắn access token vào header ======
axiosClient.interceptors.request.use(
  (config) => {
    const token = AuthApi.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      // Nếu không có token thì thử lấy refresh token để check đăng nhập
      const refreshToken = AuthApi.getRefreshToken();
      if (!refreshToken) {
         // Không làm gì hoặc xử lý tùy logic, ở đây giữ nguyên code cũ của bạn
         // AuthApi.forceLogout(); 
      }
    }
    return config;
  },
  (err) => Promise.reject(err)
);

// ====== RESPONSE INTERCEPTOR: Tự động refresh token khi gặp lỗi 401 ======
axiosClient.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    // Nếu lỗi không phải 401 (Unauthorized) → trả về lỗi luôn
    if (error.response?.status !== 401) {
      return Promise.reject(error);
    }

    // Nếu đang trong quá trình refresh → xếp hàng chờ token mới
    if (isRefreshing) {
      return new Promise((resolve) => {
        subscribeTokenRefresh((token: string) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          resolve(axiosClient(originalRequest));
        });
      });
    }

    // Nếu chưa refresh → bắt đầu gọi API refresh
    isRefreshing = true;

    try {
      // Gọi API lấy token mới
      const newToken = await AuthApi.refreshAccessToken();

      isRefreshing = false;
      onRefreshed(newToken); // Báo cho các request đang chờ biết token mới

      // Gắn token mới vào request hiện tại và gọi lại
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return axiosClient(originalRequest);
    } catch (refreshErr) {
      // Nếu refresh cũng lỗi (token hết hạn hẳn) → Đăng xuất
      isRefreshing = false;
      AuthApi.forceLogout();
      return Promise.reject(refreshErr);
    }
  }
);

export default axiosClient;