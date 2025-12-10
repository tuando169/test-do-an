import { fetchWithAuth, initCurrentUser, getUserInfo } from "./authApi";

const PUBLIC_BASE_URL = "https://3d-gallery-be.vercel.app";
const PUBLIC_API_KEY = "3D_GALLERY_PUBLIC_API_2025_VS";

/**
 * Lấy danh sách Room Template Public
 */
export async function getAllRoomTemplates(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${PUBLIC_BASE_URL}/public-room-templates${query ? `?${query}` : ""}`, {
        method: "GET",
        headers: {
        "x-api-key": PUBLIC_API_KEY,
        },
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Không lấy được danh sách Public Room Templates");
    return data.data.results;
}

/**
 * 🔹 Tạo Room Template mới (tự sinh name + slug)
 */
export async function createRoomTemplate({
    name,
    room_type,
    description,
    category,
    tags = [],
    dimensions,
    price = 0,
    is_free = true,
    is_official = false,
    status = "draft",
    thumbnail
    } = {}) {
    try {
        //Lấy thông tin user hiện tại
        const user = await initCurrentUser();
        if (!user?.id) throw new Error("Chưa đăng nhập hoặc không lấy được user info");

            //Nếu không có name → sinh mặc định theo fullname
            let finalName = name?.trim();
            if (!finalName) {
            const namePart = user.full_name || "Anonymous";
            finalName = `Room Template by ${namePart}`;
            }

        //Kiểm tra trùng tên của user
        const templates = await getRoomTemplateByUserId();
        const sameNames = templates.filter((tpl) => tpl.name?.startsWith(finalName));
        if (sameNames.length > 0) {
            finalName = `${finalName} ${sameNames.length + 1}`;
        }

        //Hàm xóa dấu tiếng Việt
        function removeVietnameseTones(str) {
        return str
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/đ/g, "d")
            .replace(/Đ/g, "D");
        }

        //Tạo slug tự động
        const slugBase = removeVietnameseTones(finalName)
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");

        const finalSlug = `template-${user.id}-${slugBase}`;

        //Chuẩn bị FormData
        const formData = new FormData();
        formData.append("name", finalName);
        formData.append("slug", finalSlug);
        formData.append("room_type", room_type || "default");
        formData.append("description", description || "");
        formData.append("category", category || "");
        formData.append("tags", JSON.stringify(tags || []));
        formData.append("dimensions", JSON.stringify(dimensions || { x: 0, y: 0, z: 0 }));
        formData.append("price", String(price || 0));
        formData.append("is_free", String(is_free));
        formData.append("is_official", String(is_official));
        formData.append("status", status);

        //Nếu chưa có wall_config → tạo mặc định
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

        formData.append(
        "wall_config",
            JSON.stringify(defaultTemplate)
        );

        if (thumbnail) formData.append("thumbnail", thumbnail);

        //Gửi request
        const res = await fetchWithAuth("/room-templates", {
        method: "POST",
        body: formData,
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
        throw new Error(data.message || "Tạo room template thất bại");
        }

        console.log("Room Template created:", data);
        return data;
    } catch (err) {
        console.error("createRoomTemplate error:", err);
        throw err;
    }
}

/**
 * Lấy danh sách room templates
 */
export async function getRoomTemplateByUserId(params = {}) {
    const query = new URLSearchParams(params).toString();
    const url = `/room-templates${query ? `?${query}` : ""}`;

    const res = await fetchWithAuth(url, { method: "GET" });
    const data = await res.json();

    if (!res.ok || !data.success) {
        throw new Error(data.message || "Lấy danh sách room templates thất bại");
    }

    return data.data?.results || [];
}

/**
 * Lấy chi tiết room template theo ID
 */
export async function getRoomTemplateDetail(id) {
    const res = await fetchWithAuth(`/room-template-detail?template_id=${encodeURIComponent(id)}`, {
        method: "GET",
    });

    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message || "Không lấy được chi tiết template");
    return data.data;
}

/**
 * Cập nhật room template
 */
export async function updateRoomTemplate(id, updateData) {
    const formData = new FormData();

    for (const [key, value] of Object.entries(updateData)) {
        if (value === undefined || value === null) continue;
        if (typeof value === "object" && !(value instanceof File)) {
            formData.append(key, JSON.stringify(value));
        } else {
            formData.append(key, value);
        }
    }

    const res = await fetchWithAuth(`/room-templates?template_id=${encodeURIComponent(id)}`, {
        method: "PUT",
        body: formData,
    });

    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message || "Cập nhật room template thất bại");
    return data;
}

/**
 * Xóa room template
 */
export async function deleteRoomTemplate(ids) {
  try {
    // Cho phép truyền 1 ID hoặc mảng
    const idList = Array.isArray(ids) ? ids : [ids];

    // Nếu có nhiều id => gộp vào query param nhiều lần
    const query = idList.map((id) => `template_id=${encodeURIComponent(id)}`).join("&");

    const res = await fetchWithAuth(`/room-templates?${query}`, {
      method: "DELETE",
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.message || "Xóa room template thất bại");
    }

    return data;
  } catch (err) {
    console.error("deleteRoomTemplate error:", err);
    throw err;
  }
}

/**
 * Import file GLB cho Room Template:
 * 1. Upload GLB (PUT) -> server trả template có glb_url
 * 2. Dựa trên glb_url: set isPreset = true, map wall.src = glb_url
 * 3. PUT lại wall_config đã update
 */
export async function importGlbForRoomTemplate(templateId, glbFile) {
    try {
        const formData = new FormData();
        formData.append("glb", glbFile);

        // Upload GLB
        const uploadRes = await fetchWithAuth(
        `/room-templates/upload-glb?template_id=${templateId}`,
        { method: "PUT", body: formData }
        );

        const uploadData = await uploadRes.json();
        const template = uploadData.data[0];
        const glbUrl = template.glb_url;

        if (!glbUrl) throw new Error("Server không trả về glb_url");

        let wallConfig = template.wall_config;

        let roomObj;

        // ---- CASE 1: old format (room is JSON string) ----
        if (wallConfig.room) {
        roomObj =
            typeof wallConfig.room === "string"
            ? JSON.parse(wallConfig.room)
            : wallConfig.room;
        }
        // ---- CASE 2: new format ----
        else {
        roomObj = {
            isPreset: wallConfig.isPreset ?? false,
            audio: wallConfig.audio ?? [],
            imageFrameList: wallConfig.imageFrameList ?? [],
            objects: wallConfig.objects ?? {
            wall: [],
            image: [],
            light: [],
            spawn: {},
            tourMarkers: [],
            },
        };
        }

        // Force preset ON
        roomObj.isPreset = true;

        // Update walls
        let hasSrc = false;

        roomObj.objects.wall = (roomObj.objects.wall || []).map(w => {
        if (w.src) hasSrc = true;
        return { ...w, src: glbUrl };
        });

        // If no wall has src → create new wall
        if (!hasSrc) {
        roomObj.objects.wall.push({
            id: `wall-${Date.now()}`,
            type: "wall",
            position: [0, 0, 0],
            rotation: [0, 0, 0],
            scale: [1, 1, 1],
            color: "#b6b898",
            albedo: "/textures/default/tex_default_alb.jpg",
            normal: "/textures/default/tex_default_nor.jpg",
            orm: "/textures/default/tex_default_orm.jpg",
            children: [],
            src: glbUrl,
            hdri: "/textures/room/exr_room1_texture_compressed.webp",
        });
        }

        // Build new final wall_config
        const newWallConfig = {
        room: JSON.stringify(roomObj),
        environment: wallConfig.environment || "{}",
        };

        return await updateRoomTemplate(templateId, {
            wall_config: newWallConfig
        }).catch(err => {
            throw new Error("Cập nhật wall_config thất bại: " + err.message);
        });

    } catch (err) {
        console.error("importGlbForRoomTemplate error:", err);
        throw err;
    }
}