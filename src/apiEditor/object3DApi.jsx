import { fetchWithAuth, getAccessToken, forceLogout } from "./authApi.jsx";

const BASE_URL = "https://3d-gallery-be.vercel.app";

export async function getObject3DList(params = {}) {
    try {
        const query = new URLSearchParams(params).toString();
        const res = await fetchWithAuth(`/object3d${query ? `?${query}` : ""}`, {
            method: "GET",
        });
        const data = await res.json();

        if (!res.ok) {
        throw new Error(data.message || "Lấy danh sách object3D thất bại");
        }
        return data || [];
    } catch (err) {
        console.error("getObject3DList error:", err);
        forceLogout();
        throw err;
    }
}