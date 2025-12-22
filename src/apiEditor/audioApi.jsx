import { fetchWithAuth, getAccessToken, forceLogout } from "./authApi.jsx";

const BASE_URL = "https://threed-gallery-be.onrender.com";

/**
 * Upload audio file đến server Supabase Function /audio
 * @param {File} file - File object (ví dụ: từ input type="file")
 * @param {Array<string>} tags - Tags cho file
 * @param {string} title - Tiêu đề bài audio
 * @param {string} description - Mô tả bài audio
 */
export async function uploadAudio(file) {
    try {
        const token = getAccessToken();
        if (!token) {
        forceLogout();
            throw new Error("Không có token — cần đăng nhập lại");
        }

        if (!file) throw new Error("Thiếu file âm thanh để upload");

        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch(`${BASE_URL}/audio`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
        },
        body: formData,
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
        throw new Error(data.message || "Upload audio thất bại");
        }

        console.log("Upload audio thành công:", data);
        return data;
    } catch (err) {
        console.error("uploadAudio error:", err);
        throw err;
    }
}

/**
 * Lấy danh sách audio
 * @param {Object} params - Các tham số lọc (ví dụ: { page, limit, search })
 */
export async function getAudioList(params = {}) {
    try {
        const query = new URLSearchParams(params).toString();
        const res = await fetchWithAuth(`/audio${query ? `?${query}` : ""}`, {
            method: "GET",
        });
        const data = await res.json();

        if (!res.ok) {
        throw new Error(data.message || "Lấy danh sách audio thất bại");
        }
        return data || [];
    } catch (err) {
        console.error("getAudioList error:", err);
        forceLogout();
        throw err;
    }
}

/**
 * Xóa audio theo ID
 * @param {string} audioId - ID của audio cần xóa
 */
export async function deleteAudio(audioId) {
    try {
        const token = getAccessToken();
        if (!token) {
            forceLogout();
            throw new Error("Không có token — cần đăng nhập lại");
        }

        if (!audioId) throw new Error("Thiếu audio_id để xóa");

        const url = `${BASE_URL}/audio?audio_id=${encodeURIComponent(audioId)}`;
        const res = await fetch(url, {
        method: "DELETE",
        headers: {
            Authorization: `Bearer ${token}`,
        },
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
        throw new Error(data.message || "Xóa audio thất bại");
        }

        console.log(`Đã xóa audio: ${audioId}`);
        return data;
    } catch (err) {
        console.error("deleteAudio error:", err);
        throw err;
    }
}