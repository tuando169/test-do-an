import { setCookie, getCookie, deleteAllCookies } from "./Cookies";

const BASE_URL = "https://nsumwobjesbawigigfwy.functions.supabase.co";

let currentUser = null;
let hasLoggedOut = false;

// Refresh lock
let isRefreshing = false;
let refreshPromise = null;

/**
 * Đọc user từ localStorage trước để UI phản hồi nhanh
 */
export function loadCachedUser() {
  try {
    const cached = localStorage.getItem("cached_user");
    currentUser = cached ? JSON.parse(cached) : null;
    return currentUser;
  } catch {
    return null;
  }
}

/**
 * Lưu user cache
 */
function cacheUser(user) {
  currentUser = user;
  if (user) localStorage.setItem("cached_user", JSON.stringify(user));
  else localStorage.removeItem("cached_user");
}

/**
 * SIGNUP
 */
export async function signup(email, password) {
  const res = await fetch(`${BASE_URL}/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || "Đăng ký thất bại");
  return data;
}

/**
 * LOGIN
 */
export async function login(email, password) {
  const res = await fetch(`${BASE_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || "Đăng nhập thất bại");

  const accessToken = data?.data?.access_token;
  const refreshToken = data?.data?.refresh_token;
  const profile = data?.data?.profile;

  // Giải mã role
  const jwt = decodeJwt(accessToken);
  const role = jwt?.user_role || "user";

  // Lưu role vào cookie (hoặc localStorage)
  setCookie("user_role", role, 7);

  // Lưu token
  setCookie("access_token", accessToken, 1);
  setCookie("refresh_token", refreshToken, 7);

  // Không gọi initCurrentUser nữa — backend đã trả profile
  cacheUser(profile);
  hasLoggedOut = false;

  return { accessToken, refreshToken, currentUser: profile };
}

/**
 * GET TOKEN
 */
export const getAccessToken = () => getCookie("access_token");
export const getRefreshToken = () => getCookie("refresh_token");
export const getUserInfo = () => currentUser;
export const getUserRole = () => getCookie("user_role");

/**
 * REFRESH ACCESS TOKEN (LOCKED)
 */
export async function refreshAccessToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) throw new Error("No refresh token");

  if (isRefreshing && refreshPromise) return refreshPromise;

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const res = await fetch(`${BASE_URL}/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      const data = await res.json();

      // Refresh token invalid → thực sự logout
      if (!res.ok || !data.success) {
        throw new Error("Invalid refresh token");
      }

      const newToken = data?.data?.session?.access_token;
      setCookie("access_token", newToken, 1);

      return newToken;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/**
 * FETCH WITH AUTH + AUTO REFRESH
 */
export async function fetchWithAuth(url, options = {}) {
  let token = getAccessToken();

  const headers = {
    Authorization: `Bearer ${token}`,
    ...(options.headers || {})
  };

  // Chỉ set JSON header nếu body không phải FormData
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  let res = await fetch(`${BASE_URL}${url}`, {
    ...options,
    headers,
  });

  // Token hết hạn → refresh
  if (res.status === 401) {
    try {
      const newToken = await refreshAccessToken();

      const retryHeaders = {
        Authorization: `Bearer ${newToken}`,
        ...(options.headers || {})
      };
      if (!(options.body instanceof FormData)) {
        retryHeaders["Content-Type"] = "application/json";
      }

      res = await fetch(`${BASE_URL}${url}`, {
        ...options,
        headers: retryHeaders,
      });

      return res;
    } catch {
      forceLogout();
      throw new Error("Session expired — please login again.");
    }
  }

  return res;
}

/**
 * INIT CURRENT USER
 * (Không logout nếu lỗi — chỉ return null để UI xử lý)
 */
export async function initCurrentUser() {
  try {
    const res = await fetchWithAuth(`/profile`, { method: "GET" });
    if (!res.ok) return null;

    const data = await res.json();
    const profile = data?.data?.profile || null;

    cacheUser(profile);
    return profile;
  } catch {
    return null; // KHÔNG logout
  }
}

/**
 * LOGOUT
 */
export async function logout() {
  try {
    const token = getAccessToken();
    if (token) {
      await fetch(`${BASE_URL}/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access_token: token }),
      });
    }
  } finally {
    forceLogout();
  }
}

/**
 * FORCE LOGOUT
 */
export function forceLogout() {
  if (hasLoggedOut) return;
  hasLoggedOut = true;

  deleteAllCookies();
  cacheUser(null);
}

function decodeJwt(token) {
  try {
    const payload = token.split(".")[1];
    const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    return decoded;
  } catch (err) {
    console.warn("JWT decode error:", err);
    return null;
  }
}