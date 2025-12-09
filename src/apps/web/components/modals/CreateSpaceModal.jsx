import { useState, useEffect } from "react";
import { notification } from "antd";
import { RoomApi } from "@/api/roomApi";
import Modal from "../modal";
import { AiOutlineLoading3Quarters } from "react-icons/ai"; // Import icon loading (nếu bạn có react-icons)
// Hoặc nếu không muốn import icon, mình dùng CSS thuần bên dưới

export default function CreateSpaceModal({
  isVisible,
  onClose,
  template,
  onSuccess,
}) {
  const [api, contextHolder] = notification.useNotification(); // Thêm contextHolder để hiển thị noti đúng cách
  const [isLoading, setIsLoading] = useState(false); // 1. State loading

  const [form, setForm] = useState({
    title: "",
    description: "",
    visibility: "public",
    type: "",
    thumbnail: "",
    room_json: {},
    owner_id: "",
  });

  const [thumbnailPreview, setThumbnailPreview] = useState("");

  // Autofill nếu tạo từ template
  useEffect(() => {
    if (!template?.title) return;

    setForm({
      title: `Bản sao của ${template.title}`,
      description: template.description || "",
      visibility: "public",
      thumbnail: "",
      room_json: template.room_json,
      type: "",
      owner_id: template.owner_id,
    });
  }, [template]);

  async function handleSubmit(e) {
    e.preventDefault();
    // Ngăn spam click
    if (isLoading) return;

    setIsLoading(true); // Bắt đầu loading

    try {
      await RoomApi.create({
        ...form,
      });

      api.success({
        message: "Thành công",
        description: "Đã tạo không gian.",
      });

      onSuccess();
      handleClose(); // Đóng modal sau khi thành công
    } catch (err) {
      console.error(err);
      api.error({
        message: "Lỗi",
        description: "Không thể tạo không gian. Vui lòng thử lại.",
      });
    } finally {
      setIsLoading(false); // Kết thúc loading dù thành công hay thất bại
    }
  }

  function handleClose() {
    setForm({
      title: "",
      description: "",
      visibility: "public",
      type: "",
      thumbnail: "",
      room_json: {},
    });
    setThumbnailPreview("");
    setIsLoading(false);
    onClose();
  }

  return (
    <Modal isVisible={isVisible} onClose={handleClose}>
      {contextHolder}
      {/* TITLE */}
      <div className="text-2xl font-semibold text-[#2e2e2e] w-[500px] mb-4">
        TẠO KHÔNG GIAN
        {template?.title && (
          <span className="">
            {" "}
            từ <span className="underline">{template.title}</span>
          </span>
        )}
      </div>
      {/* FORM */}
      <form className="flex flex-col w-full mt-4" onSubmit={handleSubmit}>
        {/* Tên */}
        <label aria-required className=" mb-2">
          Tên
        </label>
        <input
          type="text"
          required
          disabled={isLoading}
          className="bg-gray-200 p-3 mb-4 text-[16px] outline-none w-full disabled:opacity-60"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />

        {/* Mô tả */}
        <label className=" mb-2">Mô tả</label>
        <textarea
          disabled={isLoading}
          className="bg-gray-200 p-3 mb-4 text-[16px] outline-none w-full min-h-[100px] disabled:opacity-60"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <label className=" mb-2">Danh mục</label>
        <input
          type="text"
          disabled={isLoading}
          className="bg-gray-200 p-3 mb-4 text-[16px] outline-none w-full disabled:opacity-60"
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value })}
        />

        {/* Hiển thị */}
        <label className=" mb-2">Hiển thị</label>
        <select
          disabled={isLoading}
          value={form.visibility}
          onChange={(e) => setForm({ ...form, visibility: e.target.value })}
          className="bg-gray-200 p-3 mb-4 text-[16px] outline-none w-full disabled:opacity-60"
        >
          <option value="public">Công khai</option>
          <option value="private">Riêng tư</option>
        </select>

        {/* Thumbnail */}
        <label className=" mb-2">Thumbnail</label>

        {(thumbnailPreview || form.thumbnail) && (
          <img
            src={thumbnailPreview || form.thumbnail}
            className="w-full h-40 object-cover border mb-3"
            alt="Thumbnail"
          />
        )}

        <input
          key={form.title}
          type="file"
          required
          disabled={isLoading}
          onChange={(e) => {
            const file = e.target.files[0];
            if (file) {
              setThumbnailPreview(URL.createObjectURL(file));
              setForm({ ...form, thumbnail: file });
            }
          }}
          className="mb-4 disabled:opacity-60"
        />

        {/* BUTTON SUBMIT */}
        <button
          className={`primary-button mt-2 flex justify-center items-center gap-2 transition-all ${
            isLoading ? "opacity-70 cursor-not-allowed" : ""
          }`}
          disabled={isLoading}
        >
          {isLoading && (
            // Icon loading (Spin)
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          )}
          {isLoading ? "ĐANG TẠO..." : "TẠO KHÔNG GIAN"}
        </button>
      </form>
    </Modal>
  );
}
