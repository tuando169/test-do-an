import { useState, useEffect } from "react";
import { updateMedia, deleteMedia } from "@/apiEditor/mediaApi";

export default function MetadataEditModal({ show, image, onClose, onSuccess }) {

  const [loading, setLoading] = useState(false);

  const DEFAULT_FIELDS = {
    kich_thuoc_trong_khong_gian: "",
    chieu_dai: "",
    chieu_rong: "",
    tieu_de: "",
    tac_gia: "",
    chat_lieu: "",
    nam_sang_tac: "",
  };

  const LABEL_MAP = {
    kich_thuoc_trong_khong_gian: "Kích thước trong không gian",
    tieu_de: "Tiêu đề",
    tac_gia: "Tác giả",
    chat_lieu: "Chất liệu",
    chieu_dai: "Chiều ngang (cm)",
    chieu_rong: "Chiều dọc (cm)",
    nam_sang_tac: "Năm sáng tác",
  };

  const [metadata, setMetadata] = useState({ rawKeys: {}, values: {} });

  const normalizeKey = (str) =>
    str
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "");

  useEffect(() => {
    if (image) {
      const raw = {};
      const val = {};

      const currentMeta = { ...DEFAULT_FIELDS, ...(image.metadata || {}) };

      Object.entries(currentMeta).forEach(([key, value]) => {
        raw[key] = LABEL_MAP[key] || key;
        val[key] = value;
      });

      setMetadata({ rawKeys: raw, values: val });
    }
  }, [image]);

  if (!show || !image) return null;

  const addField = () => {
    const newKey = "thuoc_tinh_moi_" + Date.now();
    setMetadata((prev) => ({
      rawKeys: { ...prev.rawKeys, [newKey]: "Thuộc tính mới" },
      values: { ...prev.values, [newKey]: "" },
    }));
  };

  const handleValueChange = (key, value) => {
    setMetadata((prev) => ({
      rawKeys: prev.rawKeys,
      values: {
        ...prev.values,
        [key]: value,
      },
    }));
  };

  const getImageRatio = (url) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";

      img.onload = () => {
        resolve(img.naturalWidth / img.naturalHeight);
      };

      img.onerror = reject;

      img.src = url;
    });
  };

  const save = async () => {
    if (loading) return;

    setLoading(true);
    try {

      // Lấy 2 chiều người dùng nhập
      const cd = Number(metadata.values.chieu_dai);
      const cr = Number(metadata.values.chieu_rong);

      let kichThuoc = "";

      // Nếu người dùng nhập đủ chiều dài & rộng
      if (cd > 0 && cr > 0) {
        kichThuoc = `${cd} x ${cr}`;
      } 
      else {
        // Auto tính từ ảnh
        if (!image?.file_url) {
          alert("Không tìm thấy ảnh để tính kích thước!");
          setLoading(false);
          return;
        }

        // Lấy ratio từ image.file_url
        const ratio = await new Promise((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => resolve(img.naturalWidth / img.naturalHeight);
          img.onerror = reject;
          img.src = image.file_url;
        });

        const autoCR = 100;
        const autoCD = Math.round(100 * ratio);

        kichThuoc = `${autoCD} x ${autoCR}`;
      }

      // Build final metadata
      const finalMeta = {};
      Object.entries(metadata.rawKeys).forEach(([key, rawKey]) => {
        const finalKey = Object.hasOwn(DEFAULT_FIELDS, key)
          ? key
          : normalizeKey(rawKey);

        finalMeta[finalKey] = metadata.values[key];
      });

      // Gán kích thước cuối
      finalMeta.kich_thuoc_trong_khong_gian = kichThuoc;

      await updateMedia(image.id, finalMeta);
      onSuccess(finalMeta);
      onClose();

    } catch (err) {
      console.error(err);
      alert("Lỗi lưu dữ liệu!");
    } finally {
      setLoading(false);
    }
  };


  const handleDelete = async () => {
    if (loading) return;

    setLoading(true);
    try {
      await deleteMedia(image.id);
      onSuccess(null); // Indicate deletion
      onClose();
    } catch (err) {
      console.error(err);
      alert("Lỗi xóa dữ liệu!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-[520px] p-6 rounded-lg shadow-xl">
        <h2 className="text-xl font-bold">Sửa thông tin tranh</h2>

        {/* LIST FIELD */}
        <div className="space-y-4 max-h-[350px] overflow-auto mt-4">
          {Object.keys(metadata.rawKeys).map((k) => (
            <div key={k} className="flex items-center gap-3">

              <input
                className={`w-1/3 border px-3 py-2 rounded font-medium ${
                  k === "kich_thuoc_trong_khong_gian" ? "bg-gray-200 cursor-not-allowed" : ""
                }`}
                value={metadata.rawKeys[k]}
                disabled={k === "kich_thuoc_trong_khong_gian"}
                onChange={(e) =>
                  setMetadata((prev) => ({
                    rawKeys: { ...prev.rawKeys, [k]: e.target.value },
                    values: prev.values,
                  }))
                }
              />

              <input
                className={`flex-1 border px-3 py-2 rounded ${
                  k === "kich_thuoc_trong_khong_gian" ? "bg-gray-200 cursor-not-allowed" : ""
                }`}
                value={metadata.values[k]}
                disabled={k === "kich_thuoc_trong_khong_gian"}
                onChange={(e) => handleValueChange(k, e.target.value)}
              />

              {!Object.hasOwn(DEFAULT_FIELDS, k) && (
                <button
                  className="px-2 py-1 bg-red-500 text-white rounded"
                  onClick={() =>
                    setMetadata((prev) => {
                      const raw = { ...prev.rawKeys };
                      const val = { ...prev.values };
                      delete raw[k];
                      delete val[k];
                      return { rawKeys: raw, values: val };
                    })
                  }
                >
                  X
                </button>
              )}
            </div>
          ))}
        </div>

        {/* ADD FIELD */}
        <button
          className="mt-4 px-4 py-2 bg-gray-200 rounded"
          onClick={addField}
        >
          + Thêm thuộc tính
        </button>

        {/* ACTIONS */}
        <div className="flex justify-end gap-3 mt-6">
          <button className="px-4 py-2 bg-red-600 text-white rounded" onClick={handleDelete}>
            Xóa
          </button>
          <button
            disabled={loading}
            className={`px-4 py-2 rounded text-white ${
              loading ? "bg-gray-400 cursor-not-allowed" : "bg-green-600"
            }`}
            onClick={save}
          >
            {loading ? "Đang lưu..." : "Lưu"}
          </button>
          <button className="px-4 py-2 bg-gray-500 text-white rounded" onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
