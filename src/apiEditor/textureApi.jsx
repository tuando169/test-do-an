import { fetchWithAuth, forceLogout, getAccessToken } from "./authApi.jsx";

const BASE_URL = "https://nsumwobjesbawigigfwy.functions.supabase.co";
const PUBLIC_API_KEY = "3D_GALLERY_PUBLIC_API_2025_VS";

/**
 * Lấy toàn bộ danh sách texture public (không cần token)
 * @returns {Promise<Array>} Mảng danh sách texture public
 */
export async function getAllTextures() {
    try {
        const res = await fetch(`${BASE_URL}/public-textures`, {
        method: "GET",
        headers: {
            "x-api-key": PUBLIC_API_KEY,
        },
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
        throw new Error(data.message || "Lấy danh sách texture public thất bại");
        }

        return data?.data?.results || [];
    } catch (err) {
        console.error("getAllTextures error:", err);
        throw err;
    }
}

/**
 * Upload texture
 * @param {object} textureData - gồm { title, texture_for, alb, nor, orm }
 */
export async function uploadTexture({ title, texture_for, alb, nor, orm }) {
    try {
        // Tạo form data
        const formData = new FormData();
        formData.append("title", title);
        formData.append("texture_for", texture_for);
        if (alb) formData.append("alb", alb);
        if (nor) formData.append("nor", nor);
        if (orm) formData.append("orm", orm);

        // Gửi request, KHÔNG đặt Content-Type = application/json
        const res = await fetchWithAuth("/texture", {
        method: "POST",
        body: formData,
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
        throw new Error(data.message || "Upload texture thất bại");
        }

        console.log("Upload texture thành công:", data);
        return data;
    } catch (err) {
        console.error("uploadTexture error:", err);
        throw err;
    }
}

/**
 * Cập nhật texture theo ID
 * @param {string} textureId - ID của texture cần cập nhật
 * @param {Object} payload - dữ liệu form gồm: title, texture_for, alb/nor/orm (nếu có)
 */
export async function updateTexture(textureId, { title, texture_for, alb, nor, orm }) {
    try {
        if (!textureId) throw new Error("Thiếu texture_id để cập nhật");

        const formData = new FormData();
        if (title) formData.append("title", title);
        if (texture_for) formData.append("texture_for", texture_for);
        if (alb) formData.append("alb", alb);
        if (nor) formData.append("nor", nor);
        if (orm) formData.append("orm", orm);

        const res = await fetchWithAuth(`/texture?texture_id=${textureId}`, {
        method: "PUT",
        body: formData,
        });

        const data = await res.json();
        if (!res.ok || !data.success)
        throw new Error(data.message || "Cập nhật texture thất bại");

        console.log(`Cập nhật texture ${textureId} thành công:`, data);
        return data;
    } catch (err) {
        console.error("updateTexture error:", err);
        throw err;
    }
}

/**
 * Lấy chi tiết texture theo ID
 */
export async function getTextureByUserId(params = {}) {
    try {
        const query = new URLSearchParams(params).toString();
        const res = await fetchWithAuth(`/texture${query ? `?${query}` : ""}`, {
        method: "GET",
        });

        const data = await res.json();
        if (!res.ok || !data.success)
        throw new Error(data.message || "Lấy danh sách texture thất bại");

        console.log("Texture list:", data);
        return data?.data?.results || [];
    } catch (err) {
        console.error("getTextureList error:", err);
        forceLogout();
        throw err;
    }
}

/**
 * Lấy chi tiết texture theo ID
 * @param {string} textureId
 */
export async function getTextureDetail(textureId) {
    try {
        if (!textureId) throw new Error("Thiếu texture_id");

        const res = await fetchWithAuth(`/texture?texture_id=${textureId}`, {
        method: "GET",
        });

        const data = await res.json();
        if (!res.ok || !data.success)
        throw new Error(data.message || "Lấy chi tiết texture thất bại");

        console.log("Texture detail:", data);
        return data?.data || null;
    } catch (err) {
        console.error("getTextureDetail error:", err);
        throw err;
    }
}

/**
 * Xóa một hoặc nhiều texture
 * @param {string|string[]} textureIds - ID hoặc mảng ID của texture cần xóa
 */
export async function deleteTexture(textureIds) {
    try {
        if (!textureIds || (Array.isArray(textureIds) && textureIds.length === 0)) {
        throw new Error("Thiếu texture_ids để xóa");
        }

        // Đảm bảo luôn gửi mảng (dù chỉ có 1 ID)
        const ids = Array.isArray(textureIds) ? textureIds : [textureIds];

        const res = await fetchWithAuth(`/texture`, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ texture_ids: ids }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
        throw new Error(data.message || "Xóa texture thất bại");
        }

        console.log(`Đã xóa texture:`, ids);
        return data;
    } catch (err) {
        console.error("deleteTexture error:", err);
        throw err;
    }
}
