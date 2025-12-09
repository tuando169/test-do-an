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
    visibility: "public",
    thumbnail: "",
  });

  const [thumbnailPreview, setThumbnailPreview] = useState("");

  // Khi mở modal → load data vào form
  useEffect(() => {
    if (!space) return;

    setForm({
      id: space.id,
      title: space.title,
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
      <div className="modalRegister__title">CHỈNH SỬA KHÔNG GIAN</div>

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

        <label className="modalRegister__form__label">Trạng thái</label>
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
          src={thumbnailPreview}
          className="w-full h-40 object-cover border mb-3"
        />

        <input
          type="file"
          onChange={(e) => {
            const file = e.target.files[0];
            if (!file) return;

            setForm({ ...form, thumbnail: file });
            setThumbnailPreview(URL.createObjectURL(file));
          }}
        />

        <button className="modalRegister__form__button">CẬP NHẬT</button>
      </form>
    </Modal>
  );
}
