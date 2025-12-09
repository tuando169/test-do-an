import { useState, useEffect } from "react";
import { notification } from "antd";
import { RoomApi } from "@/api/roomApi";
import Modal from "../modal";

export default function EditSpaceModal({
  isVisible,
  onClose,
  space,
  onSuccess,
}) {
  const [api] = notification.useNotification();

  const [form, setForm] = useState({
    id: "",
    title: "",
    description: "",
    slug: "",
    visibility: "public",
    thumbnail: "",
  });

  const [thumbnailPreview, setThumbnailPreview] = useState("");

  // Load data khi mở modal
  useEffect(() => {
    if (!space) return;

    setForm({
      id: space.id,
      title: space.title,
      slug: space.slug,
      description: space.description,
      visibility: space.visibility,
      thumbnail: space.thumbnail,
    });

    setThumbnailPreview(space.thumbnail);
  }, [space]);

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      await RoomApi.update(form);

      api.success({
        message: "Thành công",
        description: "Không gian đã được cập nhật.",
      });

      onClose();
      onSuccess();
    } catch {
      api.error({
        message: "Lỗi",
        description: "Không thể cập nhật.",
      });
    }
  }

  return (
    <Modal isVisible={isVisible} onClose={onClose}>
      <div className="text-2xl font-bold text-gray-800 mb-4 text-center ">
        Chỉnh sửa không gian
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 w-[500px]">
        {/* Tên */}
        <div>
          <label className="block text-gray-700 font-medium mb-1">
            Tên không gian
          </label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:ring focus:ring-black/20 outline-none"
          />
        </div>

        {/* Mô tả */}
        <div>
          <label className="block text-gray-700 font-medium mb-1">Mô tả</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full border border-gray-300 rounded px-3 py-2 h-28 focus:ring focus:ring-black/20 outline-none"
          />
        </div>

        {/* Trạng thái */}
        <div>
          <label className="block text-gray-700 font-medium mb-1">
            Trạng thái hiển thị
          </label>
          <select
            value={form.visibility}
            onChange={(e) => setForm({ ...form, visibility: e.target.value })}
            className="w-full border border-gray-300 rounded px-3 py-2 bg-white cursor-pointer focus:ring focus:ring-black/20 outline-none"
          >
            <option value="public">Công khai</option>
            <option value="private">Riêng tư</option>
          </select>
        </div>

        {/* Thumbnail */}
        <div>
          <label className="block text-gray-700 font-medium mb-1">
            Thumbnail
          </label>

          <img
            src={thumbnailPreview}
            className="w-full h-40 object-cover border rounded mb-3"
          />

          <input
            type="file"
            className="block w-full text-sm text-gray-700"
            onChange={(e) => {
              const file = e.target.files[0];
              if (!file) return;

              setForm({ ...form, thumbnail: file });
              setThumbnailPreview(URL.createObjectURL(file));
            }}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button type="submit" className=" primary-button mt-4">
            Cập nhật
          </button>
          <button
            className=" secondary-button mt-4"
            onClick={() =>
              (window.location.href = `exhibition-edit/` + form.slug)
            }
          >
            Sửa phòng 3D
          </button>
        </div>
      </form>
    </Modal>
  );
}
