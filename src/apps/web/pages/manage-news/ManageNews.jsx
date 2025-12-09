import { useEffect, useState } from "react";
import { MdDelete, MdEdit, MdAdd, MdClose } from "react-icons/md";

export default function ManageNews() {
  // =========================
  // FAKE DATABASE TRONG FILE
  // =========================
  const [FAKE_NEWS_DB, setFAKEDB] = useState([
    {
      id: "1",
      title: "Khai trương không gian triển lãm 3D mới",
      content:
        "Sự kiện khai trương không gian triển lãm 3D mang đến trải nghiệm hoàn toàn mới...",
      thumbnail_url:
        "https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg",
      created_at: "2025-01-12T10:12:00Z",
    },
    {
      id: "2",
      title: "AI hỗ trợ nghệ sĩ sáng tạo",
      content:
        "Trí tuệ nhân tạo giúp nghệ sĩ sáng tạo các tác phẩm bằng cách gợi ý bố cục...",
      thumbnail_url:
        "https://images.pexels.com/photos/91227/pexels-photo-91227.jpeg",
      created_at: "2025-01-15T14:20:00Z",
    },
  ]);

  const [news, setNews] = useState([]);
  const wait = (ms) => new Promise((res) => setTimeout(res, ms));

  // ========== FAKE API ==========
  const fakeGetNews = async () => {
    await wait(200);
    return [...FAKE_NEWS_DB];
  };

  const fakeCreateNews = async (data) => {
    await wait(200);

    const newItem = {
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
      ...data,
    };

    setFAKEDB((prev) => [newItem, ...prev]);
  };

  const fakeUpdateNews = async (id, data) => {
    await wait(200);

    setFAKEDB((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...data } : item))
    );
  };

  const fakeDeleteNews = async (id) => {
    await wait(200);

    setFAKEDB((prev) => prev.filter((item) => item.id !== id));
  };

  const fakeUploadThumbnail = async (file) => {
    await wait(200);
    return { url: URL.createObjectURL(file) };
  };

  // ========== LOAD ==========
  const loadNews = async () => {
    const data = await fakeGetNews();
    setNews(data);
  };

  useEffect(() => {
    loadNews();
  }, []);

  // ========== MODAL STATE ==========
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);

  const [form, setForm] = useState({
    title: "",
    content: "",
    thumbnail_url: "",
    file: null,
  });

  // ========== CREATE ==========
  const openCreate = () => {
    setEditId(null);
    setForm({
      title: "",
      content: "",
      thumbnail_url: "",
      file: null,
    });
    setModalOpen(true);
  };

  // ========== EDIT ==========
  const openEdit = (item) => {
    setEditId(item.id);
    setForm({
      title: item.title,
      content: item.content,
      thumbnail_url: item.thumbnail_url,
      file: null,
    });
    setModalOpen(true);
  };

  // ========== SUBMIT ==========
  const handleSubmit = async () => {
    let finalUrl = form.thumbnail_url;

    // Upload ảnh nếu có file mới
    if (form.file) {
      const up = await fakeUploadThumbnail(form.file);
      finalUrl = up.url;
    }

    const dataToSend = {
      title: form.title,
      content: form.content,
      thumbnail_url: finalUrl,
    };

    if (editId) {
      await fakeUpdateNews(editId, dataToSend);
    } else {
      await fakeCreateNews(dataToSend);
    }

    setModalOpen(false);
    loadNews();
  };

  // ========== DELETE ==========
  const deleteItem = async (id) => {
    if (!confirm("Bạn chắc chắn muốn xoá bài viết này?")) return;

    await fakeDeleteNews(id);
    loadNews();
  };

  // ====================================================
  // =================== RENDER UI ======================
  // ====================================================

  return (
    <div className="container-main flex-col py-10">
      <div className="flex justify-between">
        <h1 className="text-3xl font-bold text-[#2e2e2e] uppercase mb-6">
          Quản lý Tin tức
        </h1>

        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-[#2e2e2e] text-white px-4 py-2 mb-4 hover:opacity-80"
        >
          <MdAdd size={20} /> Thêm bài viết
        </button>
      </div>

      {/* TABLE */}
      <div className="border border-gray-300 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-100 text-[#2e2e2e]">
            <tr>
              <th className="p-3">Ảnh</th>
              <th className="p-3">Tiêu đề</th>
              <th className="p-3">Nội dung</th>
              <th className="p-3">Ngày tạo</th>
              <th className="p-3 text-right">Hành động</th>
            </tr>
          </thead>

          <tbody>
            {news.map((n) => (
              <tr key={n.id} className="border-b">
                <td className="p-3">
                  <img
                    src={n.thumbnail_url}
                    className="w-20 h-16 object-cover border"
                  />
                </td>

                <td className="p-3 font-semibold">{n.title}</td>

                <td className="p-3 text-gray-600 text-sm line-clamp-2">
                  {n.content}
                </td>

                <td className="p-3 text-gray-500">
                  {new Date(n.created_at).toLocaleDateString("vi-VN")}
                </td>

                <td className="p-3 text-right">
                  <button
                    className="text-blue-600 mr-3 hover:text-blue-800"
                    onClick={() => openEdit(n)}
                  >
                    <MdEdit size={22} />
                  </button>

                  <button
                    className="text-red-600 hover:text-red-800"
                    onClick={() => deleteItem(n.id)}
                  >
                    <MdDelete size={22} />
                  </button>
                </td>
              </tr>
            ))}

            {news.length === 0 && (
              <tr>
                <td colSpan={5} className="p-5 text-center text-gray-500">
                  Không có bài viết nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ================== MODAL ================== */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-[550px] p-6 relative">
            <button
              className="absolute right-3 top-3 text-[#2e2e2e]"
              onClick={() => setModalOpen(false)}
            >
              <MdClose size={24} />
            </button>

            <h2 className="text-xl font-bold mb-4 text-[#2e2e2e]">
              {editId ? "Chỉnh sửa bài viết" : "Thêm bài viết mới"}
            </h2>

            <div className="flex flex-col gap-4">
              <div>
                <label className="font-medium">Tiêu đề</label>
                <input
                  type="text"
                  className="w-full border px-3 py-2 mt-1"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>

              <div>
                <label className="font-medium">Ảnh thumbnail</label>
                <input
                  type="file"
                  accept="image/*"
                  className="w-full border px-3 py-2 mt-1"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file)
                      setForm({
                        ...form,
                        file,
                        thumbnail_url: URL.createObjectURL(file),
                      });
                  }}
                />
              </div>

              {form.thumbnail_url && (
                <img
                  src={form.thumbnail_url}
                  className="w-full h-40 object-cover border"
                />
              )}

              <div>
                <label className="font-medium">Nội dung</label>
                <textarea
                  className="w-full border px-3 py-2 mt-1"
                  rows={6}
                  value={form.content}
                  onChange={(e) =>
                    setForm({ ...form, content: e.target.value })
                  }
                ></textarea>
              </div>

              <button
                className="bg-[#2e2e2e] text-white w-full py-2 hover:opacity-90"
                onClick={handleSubmit}
              >
                {editId ? "Lưu thay đổi" : "Thêm mới"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
