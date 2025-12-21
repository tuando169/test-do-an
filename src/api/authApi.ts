import axiosClient from '../common/axiosClient';
import { apiEndpoints } from '../common/constants';
import { setCookie, getCookie, deleteAllCookies } from '../common/cookies';

export interface SignupResponse {
  success: boolean;
  message?: string;
  data?: any;
}

export interface SignupPayload {
  name: string;
  role: string; // 'client' | 'designer' | 'admin' ...
  email: string;
  password: string;
}

export interface LoginResponse {
  user: any;
  session: {
    user: any;
    access_token: string;
    refresh_token: string;
  };
}

export interface RefreshResponse {
  session: {
    access_token: string;
  };
}

let currentUser: any = null;
let hasLoggedOut = false;
let isRefreshing = false;
let refreshPromise: Promise<string> | null = null;

export const AuthApi = {
  async signup(payload: FormData): Promise<void> {
    try {
      console.log(payload);

      await axiosClient.post(apiEndpoints.auth.signup, payload);

      return Promise.resolve();
    } catch (err: any) {
      if (err.status == 422)
        return Promise.reject(
          'Email đã được sử dụng, vui lòng nhập email khác'
        );
      if (err.status == 444)
        return Promise.reject(
          'Avatar không hợp lệ, vui lòng thử lại với ảnh khác'
        );
      return Promise.reject('Đăng ký thất bại, vui lòng thử lại');
    }
  },

  async fetchUserInfoAfterLogin(userId: string) {
    try {
      const res = await axiosClient.get(apiEndpoints.user.getById(userId));
      currentUser = res.data;
      return currentUser;
    } catch (err) {
      console.error('Không lấy được thông tin user:', err);
      return null;
    }
  },

  // --- [MỚI] Hàm lấy Profile dùng cho Pricing.jsx ---
  // Tự động lấy User ID từ localStorage và gọi API
  async getProfile() {
    const userId = localStorage.getItem('user');
    if (!userId) return null;

    // Tận dụng lại hàm fetchUserInfoAfterLogin để lấy dữ liệu mới nhất (bao gồm license)
    return AuthApi.fetchUserInfoAfterLogin(userId);
  },

  async login(email: string, password: string): Promise<any> {
    const res = await axiosClient.post(apiEndpoints.auth.login, {
      email,
      password,
    });
    const data: LoginResponse = res.data;

    const userId = data?.session?.user?.id;
    const accessToken = data?.session?.access_token;
    const refreshToken = data?.session?.refresh_token;

    // Lưu userId để initCurrentUser biết phải fetch ai
    localStorage.setItem('user', userId);

    // Lưu token
    setCookie('access_token', accessToken, 1);
    setCookie('refresh_token', refreshToken, 7);

    hasLoggedOut = false;

    //GỌI API LẤY THÔNG TIN ROLE
    const user = await AuthApi.fetchUserInfoAfterLogin(userId);

    // Lưu role vào cookie nếu cần
    if (user && user.role) {
      setCookie('role', user.role, 1);
    }

    return user; // Trả về luôn role, name,...
  },

  /** ------------------ GET TOKEN ----------------------- */
  getAccessToken(): string | null {
    return getCookie('access_token');
  },

  getRefreshToken(): string | null {
    return getCookie('refresh_token');
  },

  getUserRole(): any {
    return getCookie('role');
  },

  getUserInfo(): any {
    return currentUser;
  },

  /** ------------------ REFRESH TOKEN ------------------- */
  async refreshAccessToken(): Promise<string> {
    const refreshToken = AuthApi.getRefreshToken();
    if (!refreshToken) {
      AuthApi.forceLogout();
      throw new Error('Không có refresh token — cần đăng nhập lại');
    }

    if (isRefreshing && refreshPromise) return refreshPromise;

    isRefreshing = true;
    refreshPromise = (async () => {
      try {
        console.log(apiEndpoints.auth.refreshToken);

        const res = await axiosClient.post(apiEndpoints.auth.refreshToken, {
          refresh_token: refreshToken,
        });
        const data: RefreshResponse = res.data;

        const newToken = data?.session?.access_token;
        setCookie('access_token', newToken, 1);

        return newToken;
      } catch (err) {
        AuthApi.forceLogout();
        throw err;
      } finally {
        isRefreshing = false;
        refreshPromise = null;
      }
    })();

    return refreshPromise;
  },

  /** ---------------- FETCH WITH AUTH ------------------- */
  async fetchWithAuth(url: string, options: any = {}) {
    let token = AuthApi.getAccessToken();
    if (!token) {
      AuthApi.forceLogout();
      throw new Error('Không có access token — cần đăng nhập lại');
    }

    try {
      const res = await axiosClient({
        url,
        method: options.method || 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          ...(options.headers || {}),
        },
        data: options.data || options.body,
      });

      return res;
    } catch (error: any) {
      if (error.response?.status === 401) {
        try {
          const newToken = await AuthApi.refreshAccessToken();

          return await axiosClient({
            url,
            method: options.method || 'GET',
            headers: {
              Authorization: `Bearer ${newToken}`,
              ...(options.headers || {}),
            },
            data: options.data || options.body,
          });
        } catch {
          AuthApi.forceLogout();
          throw new Error(
            'Phiên đăng nhập đã hết hạn — vui lòng đăng nhập lại.'
          );
        }
      }

      throw error;
    }
  },

  /** ------------------ INIT CURRENT USER --------------- */
  async initCurrentUser(): Promise<any> {
    try {
      // Logic cũ của bạn lấy ID rỗng? Mình giữ nguyên để tránh break app
      // Nhưng khuyên dùng getProfile() thay thế
      const res = await axiosClient.get(apiEndpoints.user.getById(''));
      currentUser = res.data || null;
      return currentUser;
    } catch {
      AuthApi.forceLogout();
      return null;
    }
  },

  /** --------------------- LOGOUT ------------------------ */
  async logout() {
    try {
      const token = AuthApi.getAccessToken();
      if (token) {
        await axiosClient.post(apiEndpoints.auth.logout);
      }
    } finally {
      AuthApi.forceLogout();
    }
  },

  /** ------------------ FORCE LOGOUT -------------------- */
  forceLogout() {
    if (hasLoggedOut) return;
    hasLoggedOut = true;
    localStorage.removeItem('user');
    currentUser = null;
    deleteAllCookies();
    console.warn('Token không hợp lệ — đã xóa toàn bộ cookie');
  },
};
