import { useEffect, useState } from "react";
import { RoomApi } from "@/api/roomApi";
import { ImageApi } from "@/api/imageApi";
import { notification } from "antd";
import { Object3dApi } from "@/api/object3dApi";
import { AudioApi } from "@/api/audioApi";
import Modal from "@/apps/web/components/modal";

export default function ModalCreateResource({
  isOpen,
  onClose,
  formData,
  tab, // "image" | "object" | "audio"
  onSubmit,
}) {
  const [api, contextHolder] = notification.useNotification();

  const [form, setForm] = useState({
    title: "",
    room_id: "",
    file: null,
  });

  const [preview, setPreview] = useState("");
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);

  // ================== FETCH ROOMS ==================
  useEffect(() => {
    fetchRooms();
  }, []);

  async function fetchRooms() {
    const data = await RoomApi.getAll();
    setRooms(data);
  }

  // ================== UPDATE FORM WHEN EDIT ==================
  useEffect(() => {
    if (formData) {
      setForm(formData);
      if (formData.file_url) setPreview(formData.file_url);
    }
  }, [formData]);

  // ================== FILE CHANGE ==================
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setForm({ ...form, file });
    const tempUrl = URL.createObjectURL(file);
    setPreview(tempUrl);
  };

  // ================== SUBMIT ==================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (form.id) {
        await handleUpdate();
      } else {
        await handleCreate();
      }

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

  // ================== CLOSE ==================
  function handleClose() {
    setForm({
      title: "",
      room_id: "",
      file: null,
    });
    document.querySelector("input").value = null;
    setPreview("");
    onClose();
  }

  // ================== CREATE ==================
  async function handleCreate() {
    if (tab === "image") {
      const res = await ImageApi.create({
        title: form.title,
        file: form.file,
        room_id: form.room_id,
      });

      if (res.status == 422)
        alert("File không hợp lệ hoặc quá lớn. Vui lòng thử file khác.");

      api.success({
        title: "Thành công",
        description: "Tải lên tranh mới",
      });
      return;
    }

    if (tab === "object") {
      await Object3dApi.create({
        title: form.title,
        file: form.file,
        description: form.description,
        room_id: form.room_id,
      });

      api.success({
        title: "Thành công",
        description: "Tải lên object 3D mới.",
      });
      return;
    }

    if (tab === "audio") {
      await AudioApi.create({
        title: form.title,
        file: form.file,
        description: form.description,
        room_id: form.room_id,
      });

      api.success({
        title: "Thành công",
        description: "Tải lên âm thanh mới.",
      });
      return;
    }
  }

  // ================== UPDATE ==================
  async function handleUpdate() {
    if (tab === "image") {
      await ImageApi.update(form.id, {
        title: form.title,
        file: form.file,
        description: form.description,
        room_id: form.room_id,
      });

      api.success({
        title: "Thành công",
        description: "Cập nhật tranh thành công",
      });
      return;
    }

    if (tab === "object") {
      await Object3dApi.update(form.id, {
        title: form.title,
        file: form.file,
        description: form.description,
        room_id: form.room_id,
      });

      api.success({
        title: "Thành công",
        description: "Cập nhật object 3D thành công",
      });
      return;
    }

    if (tab === "audio") {
      await AudioApi.update(form.id, {
        title: form.title,
        file: form.file,
        description: form.description,
        room_id: form.room_id,
      });

      api.success({
        title: "Thành công",
        description: "Cập nhật âm thanh thành công",
      });
      return;
    }
  }

  return (
    <Modal isVisible={isOpen} onClose={handleClose}>
      {contextHolder}

      {/* LOADING OVERLAY */}
      {loading && (
        <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-50">
          <div className="animate-spin w-10 h-10 border-4 border-gray-300 border-t-[#2e2e2e] rounded-full"></div>
        </div>
      )}

      <h2 className="text-xl font-bold mb-4 text-[#2e2e2e] uppercase">
        {form.id ? "Cập nhật" : "Thêm"}{" "}
        {tab === "image" ? "Ảnh" : tab === "object" ? "Object 3D" : "Audio"} Mới
      </h2>

      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        {/* TITLE */}
        <div>
          <label className="font-medium">Tên tài nguyên</label>
          <input
            type="text"
            required={!form.title}
            className="w-full border px-3 py-2 mt-1"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Tên hiển thị..."
          />
        </div>

        {/* FILE URL WHEN EDIT */}
        {form.file_url && (
          <div>
            <label className="font-medium">Đường dẫn hiện tại</label>
            <a
              href={form.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="truncate block text-blue-600 underline w-[500px]"
            >
              {form.file_url}
            </a>
          </div>
        )}

        {/* PREVIEW IMAGE */}
        {tab === "image" && preview && (
          <img src={preview} className="w-full h-40 object-cover border mt-3" />
        )}

        {/* AUDIO PREVIEW */}
        {tab === "audio" && preview && (
          <audio controls className="mt-3 w-full">
            <source src={preview} />
          </audio>
        )}

        <div>
          <label className="font-medium">
            Upload{" "}
            {tab === "image" ? "Ảnh" : tab === "object" ? "File .glb" : "Audio"}
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

          {/* SHOW FILE SELECTED */}
          {tab === "object" && form.file && (
            <p className="text-sm text-gray-600 mt-2">
              Đã chọn file: {form.file.name}
            </p>
          )}
        </div>

        {/* ROOM SELECT */}
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
