import React, { useState, useEffect } from "react";
import {
  uploadTexture,
  updateTexture,
  getTextureByUserId,
  getTextureDetail,
  deleteTexture,
  getAllTextures,
} from "../../api/textureApi";

export default function TextureTest() {
  const [title, setTitle] = useState("");
  const [textureFor, setTextureFor] = useState("wall");
  const [alb, setAlb] = useState(null);
  const [nor, setNor] = useState(null);
  const [orm, setOrm] = useState(null);
  const [textureId, setTextureId] = useState("");
  const [textures, setTextures] = useState([]);
  const [publicTextures, setPublicTextures] = useState([]);
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("upload"); // upload | update
  const [tab, setTab] = useState("private"); // private | public

  // Load danh sách private khi mount
  useEffect(() => {
    fetchTextures();
  }, []);

  async function fetchTextures() {
    setLoading(true);
    try {
      const list = await getTextureByUserId();
      setTextures(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchPublicTextures() {
    setLoading(true);
    try {
      const list = await getAllTextures();
      setPublicTextures(list);
      console.log("🌍 Public textures:", list);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload() {
    setLoading(true);
    try {
      const res = await uploadTexture({
        title,
        texture_for: textureFor,
        alb,
        nor,
        orm,
      });
      console.log("✅ Upload thành công:", res);
      await fetchTextures();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdate() {
    if (!textureId) return alert("Nhập texture_id để cập nhật!");
    setLoading(true);
    try {
      const res = await updateTexture(textureId, {
        title,
        texture_for: textureFor,
        alb,
        nor,
        orm,
      });
      console.log("🛠️ Cập nhật thành công:", res);
      await fetchTextures();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleGetDetail(id) {
    setLoading(true);
    try {
      const detail = await getTextureDetail(id);
      setSelectedDetail(detail);
      console.log("🔍 Chi tiết texture:", detail);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Bạn có chắc muốn xóa texture này?")) return;
    setLoading(true);
    try {
      await deleteTexture(id);
      await fetchTextures();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">
        🎨 Texture API Tester ({mode === "upload" ? "Upload" : "Update"})
      </h1>

      {/* TAB SWITCH */}
      <div className="flex gap-4 mb-4">
        <button
          onClick={() => setTab("private")}
          className={`px-4 py-2 rounded ${
            tab === "private" ? "bg-blue-500 text-white" : "bg-gray-200"
          }`}
        >
          🔒 Private Textures
        </button>
        <button
          onClick={() => {
            setTab("public");
            fetchPublicTextures();
          }}
          className={`px-4 py-2 rounded ${
            tab === "public" ? "bg-green-500 text-white" : "bg-gray-200"
          }`}
        >
          🌍 Public Textures
        </button>
      </div>

      {tab === "private" ? (
        <>
          {/* ===== PRIVATE TEXTURE CRUD ===== */}
          <div className="bg-gray-100 rounded-xl p-4 space-y-3">
            <div>
              <label className="block font-medium">Title</label>
              <input
                type="text"
                className="border p-2 w-full rounded"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Stone Texture"
              />
            </div>

            <div>
              <label className="block font-medium">Texture For</label>
              <input
                type="text"
                className="border p-2 w-full rounded"
                value={textureFor}
                onChange={(e) => setTextureFor(e.target.value)}
                placeholder="wall / floor / ceiling"
              />
            </div>

            {mode === "update" && (
              <div>
                <label className="block font-medium">Texture ID</label>
                <input
                  type="text"
                  className="border p-2 w-full rounded"
                  value={textureId}
                  onChange={(e) => setTextureId(e.target.value)}
                  placeholder="Nhập texture_id cần cập nhật"
                />
              </div>
            )}

            <div className="flex gap-4">
              <div>
                <label className="block font-medium">Albedo (alb)</label>
                <input type="file" onChange={(e) => setAlb(e.target.files[0])} />
              </div>
              <div>
                <label className="block font-medium">Normal (nor)</label>
                <input type="file" onChange={(e) => setNor(e.target.files[0])} />
              </div>
              <div>
                <label className="block font-medium">ORM</label>
                <input type="file" onChange={(e) => setOrm(e.target.files[0])} />
              </div>
            </div>

            <div className="flex items-center gap-3 mt-4">
              {mode === "upload" ? (
                <button
                  onClick={handleUpload}
                  disabled={loading}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:opacity-90"
                >
                  ⬆️ Upload Texture
                </button>
              ) : (
                <button
                  onClick={handleUpdate}
                  disabled={loading}
                  className="bg-green-500 text-white px-4 py-2 rounded hover:opacity-90"
                >
                  🛠️ Update Texture
                </button>
              )}

              <button
                onClick={() =>
                  setMode(mode === "upload" ? "update" : "upload")
                }
                className="bg-gray-300 px-3 py-2 rounded"
              >
                🔄 Chuyển sang {mode === "upload" ? "Update" : "Upload"}
              </button>
            </div>
          </div>

          <hr className="my-6" />

          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">📜 Danh sách texture</h2>
            <button
              onClick={fetchTextures}
              className="bg-gray-200 px-3 py-1 rounded hover:bg-gray-300"
            >
              🔁 Refresh
            </button>
          </div>

          {loading && <p className="text-blue-600 mt-2">⏳ Đang xử lý...</p>}

          <ul className="mt-4 space-y-2">
            {textures.map((tx) => (
              <li
                key={tx.id || tx.texture_id}
                className="border rounded-lg p-3 flex justify-between items-center"
              >
                <div>
                  <p className="font-medium">{tx.title}</p>
                  <p className="text-sm text-gray-500">{tx.texture_for}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleGetDetail(tx.id || tx.texture_id)}
                    className="px-3 py-1 bg-blue-100 hover:bg-blue-200 rounded"
                  >
                    🔍 Xem
                  </button>
                  <button
                    onClick={() => handleDelete(tx.id || tx.texture_id)}
                    className="px-3 py-1 bg-red-100 hover:bg-red-200 rounded"
                  >
                    🗑️ Xóa
                  </button>
                </div>
              </li>
            ))}
          </ul>

          {selectedDetail && (
            <div className="mt-6 border-t pt-4">
              <h3 className="font-semibold text-lg">📋 Chi tiết texture</h3>
              <pre className="bg-gray-50 border rounded p-3 text-sm mt-2 overflow-x-auto">
                {JSON.stringify(selectedDetail, null, 2)}
              </pre>
            </div>
          )}
        </>
      ) : (
        <>
          {/* ===== PUBLIC TEXTURE LIST ===== */}
          <h2 className="text-xl font-semibold mb-3">🌍 Public Textures</h2>
          <button
            onClick={fetchPublicTextures}
            className="bg-gray-200 px-3 py-1 rounded hover:bg-gray-300 mb-4"
          >
            🔁 Refresh
          </button>

          {loading && <p className="text-blue-600">⏳ Đang tải public textures...</p>}

          <div className="grid grid-cols-3 gap-4">
            {publicTextures.map((tx) => (
              <div
                key={tx.id}
                className="border rounded-xl p-3 bg-white shadow-sm hover:shadow-md transition"
              >
                <p className="font-semibold">{tx.title}</p>
                <p className="text-sm text-gray-500">{tx.texture_for}</p>
                <div className="mt-2 grid grid-cols-3 gap-1">
                  {tx.alb_url && (
                    <img
                      src={tx.alb_url}
                      alt="alb"
                      className="rounded w-full h-16 object-cover"
                    />
                  )}
                  {tx.nor_url && (
                    <img
                      src={tx.nor_url}
                      alt="nor"
                      className="rounded w-full h-16 object-cover"
                    />
                  )}
                  {tx.orm_url && (
                    <img
                      src={tx.orm_url}
                      alt="orm"
                      className="rounded w-full h-16 object-cover"
                    />
                  )}
                </div>
                <button
                  onClick={() => navigator.clipboard.writeText(tx.id)}
                  className="text-xs mt-2 bg-gray-100 px-2 py-1 rounded hover:bg-gray-200"
                >
                  📋 Copy ID
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
