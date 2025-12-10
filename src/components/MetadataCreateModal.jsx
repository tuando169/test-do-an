import { useState } from "react";
import { uploadMedia } from "@/apiEditor/mediaApi";

export default function MetadataCreateModal({ show, onClose, onSuccess }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [imageRatio, setImageRatio] = useState(null);

  const defaultKeys = [
    "tieu_de",
    "tac_gia",
    "chieu_dai",
    "chieu_rong",
    "chat_lieu",
    "nam_sang_tac",
    "kich_thuoc_trong_khong_gian",
  ];

  const [metadata, setMetadata] = useState({
    rawKeys: {
      tieu_de: "Tiêu đề",
      tac_gia: "Tác giả",
      chieu_dai: "Chiều ngang (cm)",
      chieu_rong: "Chiều dọc (cm)",
      chat_lieu: "Chất liệu",
      nam_sang_tac: "Năm sáng tác",
    },
    values: {
      tieu_de: "",
      tac_gia: "",
      chieu_dai: "",
      chieu_rong: "",
      chat_lieu: "",
      nam_sang_tac: "",
    },
  });

  const normalizeKey = (str) =>
    str
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "");

  if (!show) return null;

  const addField = () => {
    const newKey = "thuoc_tinh_moi_" + Date.now();
    setMetadata((prev) => ({
      rawKeys: { ...prev.rawKeys, [newKey]: "Thuộc tính mới" },
      values: { ...prev.values, [newKey]: "" },
    }));
  };

  const save = async () => {
  if (loading) return;
  if (!file) return alert("Bạn cần chọn ảnh!");

  setLoading(true);

  try {
    let cd = Number(metadata.values.chieu_dai);
    let cr = Number(metadata.values.chieu_rong);

    let kichThuoc = "";

    // Nếu người dùng nhập đầy đủ → dùng luôn
    if (cd > 0 && cr > 0) {
      kichThuoc = `${cd} x ${cr}`;
    } else {
      // Auto sinh theo tỉ lệ ảnh
      if (!imageRatio) {
        alert("Đang lấy tỉ lệ ảnh, thử lại!");
        setLoading(false);
        return;
      }

      // Luôn sinh dạng y x 100
      const autoCR = 100;
      const autoCD = Math.round(100 * imageRatio);

      kichThuoc = `${autoCD} x ${autoCR}`;
    }

    const finalMeta = {};

    Object.entries(metadata.rawKeys).forEach(([key, rawLabel]) => {
      let finalKey = defaultKeys.includes(key)
        ? key
        : normalizeKey(rawLabel);

      finalMeta[finalKey] = metadata.values[key];
    });

    // Gán kích thước không gian vào metadata
    finalMeta.kich_thuoc_trong_khong_gian = kichThuoc;

    await uploadMedia(file, finalMeta, []);

    onSuccess();
    onClose();
  } catch (err) {
    console.error(err);
    alert("Không thể lưu!");
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-[520px] p-6 rounded-lg shadow-xl">
        <h2 className="text-xl font-bold">Tạo tranh mới</h2>

        {/* FILE */}
        <label className="font-medium mt-3 block">Chọn ảnh</label>
        <input
          type="file"
          accept="image/*"
          className="w-full mt-2 mb-4"
          onChange={(e) => {
            const f = e.target.files[0];
            setFile(f);

            if (f) {
              const img = new Image();
              img.onload = () => {
                setImageRatio(img.naturalWidth / img.naturalHeight);
              };
              img.src = URL.createObjectURL(f);
            }
          }}
        />

        {/* LIST FIELD */}
        <div className="space-y-4 max-h-[300px] overflow-auto border-t pt-4">
          {Object.keys(metadata.rawKeys).map((k) => (
            <div key={k} className="flex gap-3 items-center">
              <input
                type="text"
                className="w-1/3 border px-3 py-2 rounded"
                value={metadata.rawKeys[k]}
                onChange={(e) =>
                  setMetadata((prev) => ({
                    rawKeys: { ...prev.rawKeys, [k]: e.target.value },
                    values: prev.values,
                  }))
                }
              />

              <input
                type={
                  ["chieu_dai", "chieu_rong"].includes(k)
                    ? "number"
                    : "text"
                }
                className="flex-1 border px-3 py-2 rounded"
                value={metadata.values[k]}
                onChange={(e) =>
                  setMetadata((prev) => ({
                    rawKeys: prev.rawKeys,
                    values: {
                      ...prev.values,
                      [k]: ["chieu_dai", "chieu_rong"].includes(k)
                        ? Number(e.target.value) || "" // đảm bảo là số
                        : e.target.value,
                    },
                  }))
                }
              />

              {![ "tieu_de", "tac_gia", "chieu_dai", "chieu_rong", "chat_lieu", "nam_sang_tac" ].includes(k) && (
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
          <button className="px-4 py-2 bg-gray-500 text-white rounded" onClick={onClose}>
            Hủy
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
        </div>
      </div>
    </div>
  );
}