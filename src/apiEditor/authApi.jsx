import { setCookie, getCookie, deleteAllCookies } from "./Cookies";

const BASE_URL = "https://3d-gallery-be.vercel.app";

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
      const res = await fetch(`${BASE_URL}/auth/refresh`, {
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
    const id = getUserInfo()?.id;
    const res = await fetchWithAuth(`/user/${id}`, { method: "GET" });
    console.log("initCurrentUser response:", res);
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