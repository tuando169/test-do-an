import axios from 'axios';
import { AuthApi } from '../api/authApi';

// =================================================================
// CẤU HÌNH ĐƯỜNG DẪN API (TỰ ĐỘNG CHUYỂN ĐỔI)
// =================================================================

// Link Backend thật của bạn
const PROD_URL = 'https://3d-gallery-be.vercel.app'; 

// Logic tự động kiểm tra:
// Nếu đang chạy ở máy mình (localhost) -> Dùng cổng 8000
// Nếu đang chạy trên mạng (Vercel, v.v...) -> Dùng PROD_URL
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const baseURL = isLocal ? 'http://localhost:8000' : PROD_URL;

console.log("🌏 App đang chạy ở chế độ:", isLocal ? "Local Dev" : "Production");
console.log("🔗 API Base URL:", baseURL);

const axiosClient = axios.create({
  baseURL: baseURL, 
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
         // Không làm gì hoặc xử lý tùy logic
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