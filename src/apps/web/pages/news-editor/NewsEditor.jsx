import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { notification, Modal } from "antd";
import { NewsApi } from "@/api/newsApi";
import slugify from "slugify";

export default function NewsEditor() {
  const { slug, mode } = useParams();

  const readonly = mode === "view"; // <--- CHẾ ĐỘ READONLY

  const [api] = notification.useNotification();
  const isEdit = !!slug && !readonly;

  const [thumbnailPreview, setThumbnailPreview] = useState("");

  const [news, setNews] = useState({
    id: "",
    title: "",
    slug: "",
    description: "",
    visibility: "public",
    thumbnail: null,
    layout_json: [],
  });

  // ==========================
  // LOAD WHEN EDIT / VIEW
  // ==========================
  useEffect(() => {
    async function load() {
      const data = await NewsApi.getBySlug(slug);
      if (!Array.isArray(data.layout_json)) data.layout_json = [];

      setNews(data);
      setThumbnailPreview(data.thumbnail);
    }

    if (slug) load();
  }, [slug]);

  // ==========================
  // ADD BLOCK (EDIT ONLY)
  // ==========================
  const addBlock = (type) => {
    if (readonly) return;

    const block =
      type === "text"
        ? { type: "text", content: "" }
        : type === "image"
        ? { type: "image", content: null, preview: "" }
        : { type: "object3d", content: null, preview: "" };

    setNews((prev) => ({
      ...prev,
      layout_json: [...prev.layout_json, block],
    }));
  };

  // ==========================
  // UPDATE BLOCK (EDIT ONLY)
  // ==========================
  const updateBlock = (idx, patch) => {
    if (readonly) return;

    const updated = [...news.layout_json];
    updated[idx] = { ...updated[idx], ...patch };

    setNews({ ...news, layout_json: updated });
  };

  // ==========================
  // DELETE BLOCK (EDIT ONLY)
  // ==========================
  const deleteBlock = (idx) => {
    if (readonly) return;

    Modal.confirm({
      title: "Xóa block?",
      okType: "danger",
      onOk() {
        setNews((prev) => ({
          ...prev,
          layout_json: prev.layout_json.filter((_, i) => i !== idx),
        }));
      },
    });
  };

  // ==========================
  // BUILD FORM DATA
  // ==========================
  function buildFormData() {
    const form = new FormData();

    form.append("title", news.title);
    form.append("description", news.description);
    form.append("visibility", news.visibility);

    const finalSlug =
      news.slug || slugify(news.title, { lower: true, strict: true });

    form.append("slug", finalSlug);

    if (news.thumbnail instanceof File) {
      form.append("thumbnail", news.thumbnail);
    }

    const layoutToSend = news.layout_json.map((block) => ({
      type: block.type,
      content: typeof block.content === "string" ? block.content : "",
    }));

    form.append("layout_json", JSON.stringify(layoutToSend));

    news.layout_json.forEach((block, idx) => {
      if (block.content instanceof File) {
        form.append(`items[${idx}]`, block.content);
      }
    });

    return form;
  }

  // ==========================
  // SAVE NEWS
  // ==========================
  async function save() {
    try {
      const form = buildFormData();

      if (isEdit) {
        await NewsApi.update(news.id, form);
        api.success({ message: "Cập nhật thành công!" });
      } else {
        await NewsApi.create(form);
        api.success({ message: "Tạo mới thành công!" });
      }
    } catch (err) {
      console.error(err);
      api.error({ message: "Lỗi khi lưu" });
    }
  }

  return (
    <div className="container-main flex flex-col py-10 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">
        {readonly
          ? "Xem tin tức"
          : isEdit
          ? "Chỉnh sửa tin tức"
          : "Tạo tin tức mới"}
      </h1>

      {/* Title */}
      <label className="font-semibold">Tiêu đề</label>
      {!readonly ? (
        <input
          className="border w-full px-3 py-2 mb-4"
          value={news.title}
          onChange={(e) => setNews({ ...news, title: e.target.value })}
        />
      ) : (
        <p className="text-xl mb-4">{news.title}</p>
      )}

      {/* Description */}
      <label className="font-semibold">Mô tả</label>
      {!readonly ? (
        <textarea
          className="border w-full px-3 py-2 mb-4"
          value={news.description}
          onChange={(e) => setNews({ ...news, description: e.target.value })}
        />
      ) : (
        <p className="mb-4">{news.description}</p>
      )}

      {/* Thumbnail */}
      <label className="font-semibold">Thumbnail</label>
      {thumbnailPreview && (
        <img src={thumbnailPreview} className="w-full h-56 object-cover mb-3" />
      )}

      {!readonly && (
        <input
          type="file"
          accept="image/*"
          className="border w-full px-3 py-2 mb-4"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setThumbnailPreview(URL.createObjectURL(file));
            setNews({ ...news, thumbnail: file });
          }}
        />
      )}

      {/* BLOCK LIST */}
      <h2 className="text-xl font-bold mb-4">Nội dung bài viết</h2>

      <div className="space-y-4">
        {news.layout_json.map((block, idx) => (
          <div key={idx} className="border p-4 bg-white shadow-sm">
            <div className="flex justify-between mb-3">
              <span className="font-semibold">{block.type.toUpperCase()}</span>
              {!readonly && (
                <button
                  className="text-red-500"
                  onClick={() => deleteBlock(idx)}
                >
                  ✖
                </button>
              )}
            </div>

            {/* TEXT */}
            {block.type === "text" &&
              (!readonly ? (
                <textarea
                  className="border w-full px-3 py-2"
                  value={block.content}
                  onChange={(e) =>
                    updateBlock(idx, { content: e.target.value })
                  }
                />
              ) : (
                <p>{block.content}</p>
              ))}

            {/* IMAGE */}
            {block.type === "image" && (
              <>
                {block.preview || block.content ? (
                  <img
                    src={block.preview || block.content}
                    className="w-full h-56 object-cover rounded mb-3"
                  />
                ) : null}

                {!readonly && (
                  <input
                    type="file"
                    accept="image/*"
                    className="border w-full px-3 py-2"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;

                      updateBlock(idx, {
                        content: file,
                        preview: URL.createObjectURL(file),
                      });
                    }}
                  />
                )}
              </>
            )}

            {/* OBJECT 3D */}
            {block.type === "object3d" &&
              (!readonly ? (
                <input
                  type="file"
                  accept=".gltf,.glb"
                  className="border w-full px-3 py-2"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    updateBlock(idx, {
                      content: file,
                      preview: file.name,
                    });
                  }}
                />
              ) : (
                <p className="text-blue-600">{block.content}</p>
              ))}
          </div>
        ))}
      </div>

      {/* ADD BLOCK (EDIT ONLY) */}
      {!readonly && (
        <div className="mt-6">
          <label className="font-semibold">Thêm nội dung</label>
          <div className="flex gap-3 mt-2">
            <button
              onClick={() => addBlock("text")}
              className="px-4 py-2 bg-black text-white"
            >
              + Text
            </button>
            <button
              onClick={() => addBlock("image")}
              className="px-4 py-2 bg-black text-white"
            >
              + Image
            </button>
            <button
              onClick={() => addBlock("object3d")}
              className="px-4 py-2 bg-black text-white"
            >
              + 3D Model
            </button>
          </div>
        </div>
      )}

      {/* SAVE BUTTON */}
      {!readonly && (
        <button onClick={save} className="w-full bg-black text-white py-2 mt-6">
          {isEdit ? "LƯU THAY ĐỔI" : "TẠO MỚI"}
        </button>
      )}
    </div>
  );
}
