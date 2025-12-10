import { fetchWithAuth } from "./authApi.jsx";

const BASE_URL = "https://nsumwobjesbawigigfwy.functions.supabase.co";
const PUBLIC_API_KEY = "3D_GALLERY_PUBLIC_API_2025_VS";

/**
 * Lấy danh sách news public có phân trang
 * @param {number} page - Số trang (mặc định: 1)
 * @param {number} page_size - Số item mỗi trang (mặc định: 6)
 * @returns {Promise<Object>} Object chứa results và thông tin phân trang
 */
export async function getAllNews(page = 1, page_size = 6) {
  try {
    const res = await fetch(
      `${BASE_URL}/public-news?page=${page}&page_size=${page_size}`,
      {
        method: "GET",
        headers: {
          "x-api-key": PUBLIC_API_KEY,
        },
      }
    );

    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.message || "Lấy danh sách news public thất bại");
    }

    return {
      results: data?.data?.results || [],
      pagination: data?.data?.pagination || {
        page: 1,
        page_size: page_size,
        total_count: 0,
        total_pages: 1,
        has_next: false,
        has_prev: false,
      },
    };
  } catch (err) {
    console.error("getAllNews error:", err);
    throw err;
  }
}

/**
 * Lấy chi tiết news theo ID
 * @param {string} slug
 */
export async function getNewsDetail(slug) {
  try {
    if (!slug) throw new Error("Thiếu slug");

    const res = await fetchWithAuth(`/public-news?slug=${slug}`, {
      method: "GET",
      headers: {
        "x-api-key": PUBLIC_API_KEY,
      },
    });

    const data = await res.json();
    if (!res.ok || !data.success)
      throw new Error(data.message || "Lấy chi tiết news thất bại");

    console.log("News detail:", data);
    return data?.data || null;
  } catch (err) {
    console.error("getNewsDetail error:", err);
    throw err;
  }
}
