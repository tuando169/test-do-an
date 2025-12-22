import { fetchWithAuth, getAccessToken, forceLogout } from "./authApi.jsx";

const BASE_URL = "https://threed-gallery-be.onrender.com";

/**
 * Upload media với metadata động (key/value)
 * @param {File} file
 * @param {Object} metadata - object chứa key/value tùy ý
 */
export async function uploadMedia(file, metadata = {}, tags = []) {
    try {
        const token = getAccessToken();
        if (!token) {
            forceLogout();
            throw new Error("Không có token — cần đăng nhập lại");
        }

        const formData = new FormData();
        formData.append("file", file);

        if (tags?.length) {
            formData.append("tags", JSON.stringify(tags));
        }

        // metadata có thể là object bất kỳ
        formData.append("metadata", JSON.stringify(metadata));

        const res = await fetch(`${BASE_URL}/media`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
            throw new Error(data.message || "Upload thất bại");
        }

        return data;
    } catch (err) {
        console.error("Upload media error:", err);
        throw err;
    }
}

/**
 * Lấy danh sách media (có tự động refresh token nếu hết hạn)
 * @param {Object} params - Các tham số lọc (tùy chọn)
 * @returns {Promise<object>} Dữ liệu media list
 */
export async function getMediaList(params = {}) {
    try {
        const query = new URLSearchParams(params).toString();
        const res = await fetchWithAuth(`/image${query ? `?${query}` : ""}`, { method: "GET" });
        const data = await res.json();

        if (!res.ok)
            throw new Error(data.message || "Lấy danh sách media thất bại");

        return data; // <=== chuẩn nhất
    } catch (err) {
        console.error("getMediaList error:", err);
        throw err; // KHÔNG logout
    }
}

/**
 * Lấy danh sách media và chuyển đổi sang định dạng tối giản cho Editor
 * @returns {Promise<Array<{src:string, alt:string, title:string, description:string}>>}
 */
export async function getMediaListForEditor() {
    try {
        // Gọi hàm gốc để lấy toàn bộ media
        const list = await getMediaList();

        // Chuyển đổi dữ liệu cho Editor
        const simplified = list.map((item) => ({
            id: item.id,
            src: item.file_url || "",
            alt: item.metadata?.alt || "",
            title: item.metadata?.title || "",
            description: item.metadata?.description || "",
        }));

        console.log("Media list for Editor:", simplified);
        return simplified;
    } catch (err) {
        console.error("getMediaListForEditor error:", err);
        throw err;
    }
}

/**
 * Xóa media theo ID
 * @param {string} mediaId - ID của media cần xóa
 * @returns {Promise<object>} Kết quả phản hồi từ server
 */
export async function deleteMedia(mediaId) {
    try {
        const token = getAccessToken();
        if (!token) {
            forceLogout();
            throw new Error("Không có token — cần đăng nhập lại");
        }

        if (!mediaId) throw new Error("Thiếu media_id để xóa");

        const url = `${BASE_URL}/media?media_id=${encodeURIComponent(mediaId)}`;
        const res = await fetch(url, {
        method: "DELETE",
        headers: {
            Authorization: `Bearer ${token}`,
        },
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
        throw new Error(data.message || "Xóa media thất bại");
        }

        console.log(`Đã xóa media: ${mediaId}`);
        return data;
    } catch (err) {
        console.error("deleteMedia error:", err.message);
        throw err;
    }
}

/**
 * Cập nhật metadata cho media (alt, title, description, tags...)
 * @param {string} mediaId - ID của media cần cập nhật
 * @param {object} metadata - Dữ liệu metadata mới
 * @returns {Promise<object>} Kết quả phản hồi từ server
 */
export async function updateMedia(mediaId, metadata = {}) {
    try {
        const token = getAccessToken();
        if (!token) {
            forceLogout();
            throw new Error("Không có token — cần đăng nhập lại");
        }

        if (!mediaId) throw new Error("Thiếu media_id để cập nhật");

        const url = `${BASE_URL}/media?media_id=${encodeURIComponent(mediaId)}`;

        const res = await fetch(url, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ metadata }),
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
            throw new Error(data.message || "Cập nhật metadata thất bại");
        }

        console.log(`Đã cập nhật media ${mediaId}:`, data);
        return data;
    } catch (err) {
        console.error("updateMedia error:", err);
        throw err;
    }
}