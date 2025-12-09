import { useState, useEffect } from "react";
import { notification } from "antd";
import Modal from "@/components/modal";
import { RoomApi } from "@/api/roomApi";

export default function CreateSpaceModal({ isVisible, onClose, template, onSuccess }) {
  const [api] = notification.useNotification();

  const [form, setForm] = useState({
    title: "",
    description: "",
    visibility: "public",
    thumbnail: "",
    room_json: {},
    owner_id: "",
  });

  useEffect(() => {
    if (!template) return;

    setForm({
      title: `Bản sao của ${template.title}`,
      description: template.description || "",
      visibility: "public",
      thumbnail: template.thumbnail,
      room_json: template.room_json,
      owner_id: template.owner_id,
    });
  }, [template]);

  const [thumbnailPreview, setThumbnailPreview] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      await RoomApi.create({
        ...form,
        type: "gallery",
      });

      api.success({ message: "Thành công", description: "Đã tạo không gian." });

      onClose();
      onSuccess();
    } catch  {
      api.error({ message: "Lỗi", description: "Không thể tạo." });
    }
  }

  return (
    <Modal isVisible={isVisible} onClose={onClose}>
      <div className="modalRegister__title">TẠO KHÔNG GIAN</div>

      <form className="modalRegister__form" onSubmit={handleSubmit}>
        <label className="modalRegister__form__label">Tên</label>
        <input
          type="text"
          className="modalRegister__form__input"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />

        <label className="modalRegister__form__label">Mô tả</label>
        <textarea
          className="modalRegister__form__input"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />

        <label className="modalRegister__form__label">Hiển thị</label>
        <select
          value={form.visibility}
          onChange={(e) => setForm({ ...form, visibility: e.target.value })}
          className="modalRegister__form__input"
        >
          <option value="public">Công khai</option>
          <option value="private">Riêng tư</option>
        </select>

        <label className="modalRegister__form__label">Thumbnail</label>
        <img
          src={thumbnailPreview || form.thumbnail}
          className="w-full h-40 object-cover border mb-3"
        />

        <input
          type="file"
          onChange={(e) =>
            setThumbnailPreview(URL.createObjectURL(e.target.files[0]))
          }
        />

        <button className="modalRegister__form__button mt-4">
          TẠO KHÔNG GIAN
        </button>
      </form>
    </Modal>
  );
}
