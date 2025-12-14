import { useEffect, useState } from "react";
import { LicenseApi } from "@/api/licenseApi";
import { formatMoney } from "@/common/utils";
import { notification } from "antd";
import Modal from "@/apps/web/components/modal";

export default function LicenseModal({
  isVisible,
  formData,
  onClose,
  onSuccess,
}) {
  const [api, contextHolder] = notification.useNotification();
  const isEdit = Boolean(formData?.id);

  const [loading, setLoading] = useState(false); // ⭐ NEW

  const [form, setForm] = useState({
    title: "",
    price: "",
    media_limit: 0,
    space_limit: 0,
  });

  useEffect(() => {
    if (formData) {
      setForm({
        title: formData.title || "",
        price: formData.price ? String(formData.price) : "",
        media_limit: formData.media_limit || 0,
        space_limit: formData.space_limit || 0,
      });
    } else {
      setForm({
        title: "",
        price: "",
        media_limit: 0,
        space_limit: 0,
      });
    }
  }, [formData]);

  const handlePriceChange = (e) => {
    const raw = e.target.value.replace(/,/g, "");
    if (!isNaN(raw)) {
      setForm({ ...form, price: raw });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async () => {
    if (loading) return; // ⭐ chống double submit
    setLoading(true);

    try {
      const payload = {
        title: form.title,
        price: Number(form.price),
        media_limit: Number(form.media_limit),
        space_limit: Number(form.space_limit),
      };

      if (isEdit && formData?.id) {
        await LicenseApi.update(formData.id, payload);
      } else {
        await LicenseApi.create(payload);
      }

      onSuccess();
      onClose();
    } catch {
      api.error({
        message: "Lỗi",
        description: isEdit
          ? "Không thể cập nhật gói đăng ký"
          : "Không thể tạo gói đăng ký",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isVisible={isVisible} onClose={onClose}>
      {contextHolder}

      <div
        className={`w-[420px] ${
          loading ? "opacity-60 pointer-events-none" : ""
        }`}
      >
        <h2 className="text-xl font-semibold mb-4">
          {isEdit ? "Chỉnh sửa gói đăng ký" : "Tạo gói đăng ký"}
        </h2>

        <label className="block mb-1">Tên gói</label>
        <input
          name="title"
          disabled={loading}
          className="border p-2 w-full mb-3"
          value={form.title}
          onChange={handleChange}
        />

        <label className="block mb-1">Giá (VND)</label>
        <input
          disabled={loading}
          className="border p-2 w-full mb-3"
          value={formatMoney(form.price)}
          onChange={handlePriceChange}
        />

        <label className="block mb-1">Giới hạn tài nguyên</label>
        <input
          name="media_limit"
          type="number"
          disabled={loading}
          className="border p-2 w-full mb-3"
          value={form.media_limit}
          onChange={handleChange}
        />

        <label className="block mb-1">Giới hạn không gian</label>
        <input
          name="space_limit"
          type="number"
          disabled={loading}
          className="border p-2 w-full mb-4"
          value={form.space_limit}
          onChange={handleChange}
        />

        <div className="flex justify-end gap-3">
          <button
            className="primary-button flex items-center gap-2"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading && (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            )}
            {isEdit ? "Lưu" : "Tạo"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
