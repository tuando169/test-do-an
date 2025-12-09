import { useEffect, useState } from "react";
import { RoomApi } from "@/api/roomApi";
import { ImageApi } from "@/api/imageApi";
import { Object3dApi } from "@/api/object3dApi";
import { AudioApi } from "@/api/audioApi";
import { TextureApi } from "@/api/textureApi";
import { notification } from "antd";
import Modal from "@/apps/web/components/modal";

export default function ModalCreateResource({
  isOpen,
  onClose,
  formData,
  tab, // "image" | "object" | "audio" | "texture"
  onSubmit,
}) {
  const [api, contextHolder] = notification.useNotification();

  const [form, setForm] = useState({
    title: "",
    room_id: "",
    file: null,
    alb: null,
    nor: null,
    orm: null,
    texture_for: "",
  });

  const [preview, setPreview] = useState(null);
  const [texturePreview, setTexturePreview] = useState({
    alb: "",
    nor: "",
    orm: "",
  });

  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);

  // =========== FETCH ROOMS ===========
  useEffect(() => {
    fetchRooms();
  }, []);

  async function fetchRooms() {
    const data = await RoomApi.getAll();
    setRooms(data);
  }

  // =========== UPDATE FORM WHEN EDIT ===========
  useEffect(() => {
    if (formData) {
      setForm(formData);

      if (tab === "texture") {
        setForm({
          ...formData,
          alb: formData.alb || "",
          nor: formData.nor || "",
          orm: formData.orm || "",
          texture_for: formData.texture_for || "",
        });
        setTexturePreview({
          alb: formData.alb || "",
          nor: formData.nor || "",
          orm: formData.orm || "",
        });
      }
      console.log(form);

      if (formData.file_url) setPreview(formData.file_url);
    }
  }, [formData]);

  // =========== FILE CHANGE ===========
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setForm({ ...form, file });
    setPreview(URL.createObjectURL(file));
  };

  const handleTextureFileChange = (type, e) => {
    const file = e.target.files[0];
    if (!file) return;

    setForm({ ...form, [type]: file });
    setTexturePreview({
      ...texturePreview,
      [type]: URL.createObjectURL(file),
    });
  };

  // =========== SUBMIT ===========
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (form.id) await handleUpdate();
      else await handleCreate();

      onSubmit();
      handleClose();
    } catch (error) {
      console.error(error);
      api.error({
        message: "Lỗi",
        description: "Không thể thực hiện thao tác",
      });
    } finally {
      setLoading(false);
    }
  };

  // =========== CLOSE ===========
  function handleClose() {
    setForm({
      title: "",
      room_id: "",
      file: null,
      alb: null,
      nor: null,
      orm: null,
      texture_for: "",
    });

    setPreview("");
    document.querySelectorAll('input[type="file"]').forEach((input) => {
      input.value = "";
    });
    setTexturePreview({ alb: "", nor: "", orm: "" });
    onClose();
  }

  // =========== CREATE ===========
  async function handleCreate() {
    if (tab === "texture") {
      await TextureApi.create({
        title: form.title,
        alb: form.alb,
        nor: form.nor,
        orm: form.orm,
        texture_for: form.texture_for,
      });

      api.success({ title: "Thành công", description: "Tải lên texture mới." });
      return;
    }

    if (tab === "image") {
      await ImageApi.create({
        title: form.title,
        file: form.file,
        room_id: form.room_id,
      });
      api.success({ title: "Thành công", description: "Tải lên tranh mới" });
    }

    if (tab === "object") {
      await Object3dApi.create({
        title: form.title,
        file: form.file,
        room_id: form.room_id,
      });
      api.success({ title: "Thành công", description: "Tải lên object mới" });
    }

    if (tab === "audio") {
      await AudioApi.create({
        title: form.title,
        file: form.file,
        room_id: form.room_id,
      });
      api.success({ title: "Thành công", description: "Tải lên audio mới" });
    }
  }

  // =========== UPDATE ===========
  async function handleUpdate() {
    if (tab === "texture") {
      await TextureApi.update(form.id, {
        title: form.title,
        alb: form.alb,
        nor: form.nor,
        orm: form.orm,
        room_id: form.room_id,
      });

      api.success({
        title: "Thành công",
        description: "Cập nhật texture thành công",
      });
      return;
    }

    if (tab === "image") {
      await ImageApi.update(form.id, {
        title: form.title,
        file: form.file,
        room_id: form.room_id,
      });

      api.success({
        title: "Thành công",
        description: "Cập nhật ảnh thành công",
      });
    }

    if (tab === "object") {
      await Object3dApi.update(form.id, {
        title: form.title,
        file: form.file,
        room_id: form.room_id,
      });

      api.success({
        title: "Thành công",
        description: "Cập nhật object thành công",
      });
    }

    if (tab === "audio") {
      await AudioApi.update(form.id, {
        title: form.title,
        file: form.file,
        room_id: form.room_id,
      });

      api.success({
        title: "Thành công",
        description: "Cập nhật audio thành công",
      });
    }
  }

  return (
    <Modal isVisible={isOpen} onClose={handleClose}>
      {contextHolder}

      {/* LOADING OVERLAY */}
      {loading && (
        <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-50">
          <div className="animate-spin w-10 h-10 border-4 border-gray-300 border-t-[#2e2e2e] "></div>
        </div>
      )}

      <h2 className="text-xl font-bold mb-4 text-[#2e2e2e] uppercase">
        {form.id ? "Cập nhật" : "Thêm"}{" "}
        {tab === "image"
          ? "Ảnh"
          : tab === "object"
          ? "Object 3D"
          : tab === "audio"
          ? "Audio"
          : "Texture"}{" "}
        Mới
      </h2>

      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        {/* TITLE */}
        <div>
          <label className="font-medium">Tên tài nguyên</label>
          <input
            type="text"
            required
            className="w-full border px-3 py-2 mt-1"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Tên hiển thị..."
          />
        </div>

        {/* PREVIEW FOR IMAGE */}
        {tab === "image" && preview && (
          <img src={preview} className="w-full h-40 object-cover border mt-3" />
        )}

        {tab === "texture" && (
          <div className="w-full h-28 flex overflow-hidden mt-2">
            {texturePreview.alb && (
              <img
                src={texturePreview.alb}
                className="w-40 h-full object-cover"
              />
            )}
            {texturePreview.nor && (
              <img
                src={texturePreview.nor}
                className="w-40 h-full object-cover"
              />
            )}
            {texturePreview.orm && (
              <img
                src={texturePreview.orm}
                className="w-40 h-full object-cover"
              />
            )}
          </div>
        )}

        {/* FILE INPUTS */}
        {tab !== "texture" && (
          <div>
            <label className="font-medium">
              Upload{" "}
              {tab === "image"
                ? "Ảnh"
                : tab === "object"
                ? "File .glb"
                : "Audio"}
            </label>

            <input
              type="file"
              required={!form.file_url}
              accept={
                tab === "image"
                  ? "image/*"
                  : tab === "object"
                  ? ".glb"
                  : "audio/*"
              }
              className="w-full border px-3 py-2 mt-1"
              onChange={handleFileChange}
            />
          </div>
        )}

        {tab === "texture" && (
          <>
            <div>
              <label className="font-medium">Albedo Map</label>
              <input
                type="file"
                required={!form.alb}
                accept="image/*"
                className="w-full border px-3 py-2 mt-1"
                onChange={(e) => handleTextureFileChange("alb", e)}
              />
            </div>

            <div>
              <label className="font-medium">Normal Map</label>
              <input
                type="file"
                required={!form.nor}
                accept="image/*"
                className="w-full border px-3 py-2 mt-1"
                onChange={(e) => handleTextureFileChange("nor", e)}
              />
            </div>

            <div>
              <label className="font-medium">ORM Map</label>
              <input
                type="file"
                required={!form.orm}
                accept="image/*"
                className="w-full border px-3 py-2 mt-1"
                onChange={(e) => handleTextureFileChange("orm", e)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="font-medium">Texture cho</label>
              <input
                value={form.texture_for}
                onChange={(e) =>
                  setForm({ ...form, texture_for: e.target.value })
                }
                className="w-full border px-3 py-2 mt-1"
              />
            </div>
          </>
        )}

        {/* ROOM SELECT */}

        {tab !== "texture" && (
          <div className="flex flex-col gap-2">
            <label className="font-medium">Không gian</label>
            <select
              name="room_id"
              value={form.room_id}
              onChange={(e) => setForm({ ...form, room_id: e.target.value })}
              className="w-full border px-3 py-2 mt-1"
            >
              <option value="">-- Chọn không gian --</option>
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.title}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* SUBMIT BUTTON */}
        <button
          className="primary-button w-full disabled:opacity-70 disabled:cursor-not-allowed"
          type="submit"
          disabled={loading}
        >
          {loading ? "Đang xử lý..." : form.id ? "Cập nhật" : "Tạo mới"}
        </button>
      </form>
    </Modal>
  );
}
