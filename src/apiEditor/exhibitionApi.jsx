import { fetchWithAuth, initCurrentUser, getUserInfo } from "./authApi";
import { getAllRoomTemplates } from "./roomTemplateApi";

const BASE_URL = "https://3d-gallery-be.vercel.app";
const PUBLIC_API_KEY = "3D_GALLERY_PUBLIC_API_2025_VS";

/**
 * Tạo mới Exhibition
 */

async function cloneImageUrlToFile(url, filename = "img.jpg") {
    const res = await fetch(url);
    const blob = await res.blob();
    return new File([blob], filename, { type: blob.type });
}

export async function createExhibition({
    title,
    room_template_id,
    description,
    status = "draft",
    visibility = "public",
    category,
    tags = [],
    cover_image,
    thumbnail,
    environment_config,
} = {}) {
    try {
        const user = await initCurrentUser();
        if (!user?.id) throw new Error("Chưa đăng nhập hoặc không lấy được user info");

        // AUTO TITLE
        let finalTitle = title?.trim();
        if (!finalTitle) {
        finalTitle = `Exhibition by ${user.username || "Anonymous"}`;
        }

        // KIỂM TRA TRÙNG TÊN
        const exhibitions = await getExhibitionByUserId();
        const sameTitles = exhibitions.filter((ex) =>
            ex.title?.startsWith(finalTitle)
        );
        if (sameTitles.length > 0) {
        finalTitle = `${finalTitle} ${sameTitles.length + 1}`;
        }

        // AUTO SLUG
        function removeVietnameseTones(str) {
        return str
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/đ/g, "d").replace(/Đ/g, "D");
        }

        const slugBase = removeVietnameseTones(finalTitle)
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");

        const finalSlug = `exhibition-${user.id}-${slugBase}`;

        // -------------------------------
        // 🔥 AUTO CLONE THUMBNAIL TỪ TEMPLATE
        // -------------------------------

        let finalCover = cover_image;
        let finalThumb = thumbnail;

        if (!cover_image || !thumbnail) {
        // Lấy toàn bộ template
        const templates = await getAllRoomTemplates();

        // Tìm template đúng ID
        const tpl = templates.find(t => t.id === room_template_id);

        if (tpl) {
            // Ưu tiên thumbnail_url
            const tplThumbnail = tpl.thumbnail_url || tpl.cover_image_url;

            if (!finalThumb && tplThumbnail) {
            finalThumb = await cloneImageUrlToFile(tplThumbnail, "thumbnail.jpg");
            }

            if (!finalCover && tplThumbnail) {
            finalCover = await cloneImageUrlToFile(tplThumbnail, "cover.jpg");
            }
        }
        }

        // -------------------------------
        // Build FormData
        // -------------------------------
        const formData = new FormData();
        formData.append("title", finalTitle);
        formData.append("slug", finalSlug);
        formData.append("room_template_id", room_template_id || "6a5b624c-f113-46a5-8863-7301857f028e");
        formData.append("description", description || "");
        formData.append("status", status);
        formData.append("visibility", visibility);
        formData.append("category", category || "");
        formData.append("tags", JSON.stringify(tags));

        if (finalCover) formData.append("cover_image", finalCover);
        if (finalThumb) formData.append("thumbnail", finalThumb);

        // Nếu không có env thì dùng default
        if (environment_config) {
        formData.append(
            "environment_config",
            typeof environment_config === "string"
            ? environment_config
            : JSON.stringify(environment_config)
        );
        } else {
        const defaultTemplate = {
            isPreset: false,
            objects: {
            spawn: {
                id: "spawn-1",
                type: "spawn",
                position: [0, 0.2, 0],
                rotation: [-90, 0, 0],
                scale: [1.5, 1.5, 1.5],
            },
            wall: [
                {
                id: "wall-1762482238762",
                type: "wall",
                position: [0, 1.5, -3.75],
                rotation: [0, -26.1, 0],
                scale: [1.5, 1.5, 1.5],
                color: "#b6b898",
                albedo: "/textures/default/tex_default_alb.jpg",
                normal: "/textures/default/tex_default_nor.jpg",
                orm: "/textures/default/tex_default_orm.jpg",
                children: [],
                transparent: false,
                objectRole: "user",
                },
            ],
            image: [],
            light: [],
            tourMarkers: [],
            },
            imageFrameList: [
            { id: "imageFrame-1" },
            { id: "imageFrame-2" },
            { id: "imageFrame-3" },
            { id: "imageFrame-4" },
            ],
            audio: [],
        };

        formData.append("environment_config", JSON.stringify(defaultTemplate));
        }

        // SEND
        const res = await fetchWithAuth("/room", {
        method: "POST",
        body: formData,
        });

        const data = await res.json();
        if (!res.ok || !data.success)
        throw new Error(data.message || "Tạo exhibition thất bại");

        return data;
    } catch (err) {
        console.error("createExhibition error:", err);
        throw err;
    }
}

/** Lấy danh sách exhibitions (của user) */
export async function getExhibitionByUserId(params = {}) {
    const query = new URLSearchParams(params).toString();
    const url = `/room${query ? `?${query}` : ""}`;
    const res = await fetchWithAuth(url, { method: "GET" });
    const data = await res.json();
    if (!res.ok || !data.success)
        throw new Error(data.message || "Không lấy được danh sách exhibitions");
    return data.data?.results || [];
}

/** Lấy chi tiết exhibition theo ID */
export async function getExhibitionDetail(id) {
    const res = await fetchWithAuth(`/room/${encodeURIComponent(id)}`, {
        method: "GET",
    });
    const data = await res.json();
    if (!res.ok || !data.success)
        throw new Error(data.message || "Không lấy được chi tiết exhibition");
    return data.data;
}

/** Cập nhật exhibition */
export async function updateExhibition(id, updateData = {}) {
    try {
        // Lấy thông tin user hiện tại
        const user = getUserInfo();
        if (!user?.id) throw new Error("Chưa đăng nhập hoặc không lấy được user info");

        let finalTitle = updateData.title?.trim();
        let finalSlug = updateData.slug; // mặc định giữ slug cũ nếu không đổi title

        // Nếu có title mới, xử lý kiểm tra trùng + slug mới
        if (finalTitle) {
        const exhibitions = await getExhibitionByUserId({ user_id: user.id });
        const sameTitles = exhibitions
            .filter(
            (ex) =>
                ex.title?.startsWith(finalTitle) &&
                ex.id !== id && // bỏ qua chính nó
                ex.title?.toLowerCase() === finalTitle.toLowerCase()
            );

        if (sameTitles.length > 0) {
            // ví dụ có "My Exhibition" rồi, tạo "My Exhibition 2"
            finalTitle = `${finalTitle} ${sameTitles.length + 1}`;
        }

        // Sinh slug mới
        const slugBase = (finalTitle || "")
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9-]/g, "");
        finalSlug = `${user.id}-${slugBase}`;

        // Ghi đè lại vào updateData
        updateData.title = finalTitle;
        updateData.slug = finalSlug;
        }

        // FormData
        const formData = new FormData();
        for (const [key, value] of Object.entries(updateData)) {
        if (value === undefined || value === null) continue;
        if (typeof value === "object" && !(value instanceof File)) {
            formData.append(key, JSON.stringify(value));
        } else {
            formData.append(key, value);
        }
        }

        // Gửi request
        const res = await fetchWithAuth(`/room/${encodeURIComponent(id)}`, {
        method: "PUT",
        body: formData,
        });

        const data = await res.json();
        if (!res.ok || !data.success)
        throw new Error(data.message || "Cập nhật exhibition thất bại");

        console.log("Exhibition updated:", data);
        return data;
    } catch (err) {
        console.error("updateExhibition error:", err);
        throw err;
    }
}

/** Xóa exhibition */
export async function deleteExhibition(ids) {
    const res = await fetchWithAuth(`/room/${encodeURIComponent(ids)}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok || !data.success)
        throw new Error(data.message || "Xóa exhibition thất bại");
    return data;
}

/** Lấy danh sách public exhibition (nếu có endpoint public) */
export async function getAllExhibitions() {
  const res = await fetch(`${BASE_URL}/room/public`, {
    method: "GET",
  });

  const data = await res.json();

  if (!res.ok)
    throw new Error(data.message || "Không lấy được danh sách public exhibitions");

  return data.data; // tùy backend: results hoặc data
}
