import { RoomApi } from '@/api/roomApi';
import React, { useState } from 'react';

export default function RoomTemplateTest() {
  const [form, setForm] = useState({
    name: 'Minh template',
    room_type: 'gallery',
    description: 'A modern 3D exhibition room template',
    category: 'modern',
    tags: ['gallery', 'art'],
    dimensions: { width: 10, height: 8, depth: 6 },
    price: '88.99',
    is_free: false,
    is_official: true,
    status: 'draft',
    thumbnail: null,
    glb_lod1: null,
    template_json: {
      rotation: [0, 0, 0],
      scale: [1.7, 1.7, 1.7],
      color: '#b6b898',
      albedo: '/textures/default/tex_default_alb.jpg',
    },
  });

  const [templateId, setTemplateId] = useState('');
  const [detail, setDetail] = useState(null);
  const [list, setList] = useState([]);
  const [publicList, setPublicList] = useState([]); // 👈 public data
  const [publicDetail, setPublicDetail] = useState(null);
  const [showJson, setShowJson] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const parseJSON = (input, fallback) => {
    try {
      return JSON.parse(input);
    } catch {
      return fallback;
    }
  };

  // ====== PRIVATE API ======
  const handleCreate = async () => {
    setLoading(true);
    try {
      const res = await RoomApi.create(form);
      console.log('✅ Created:', res);
      const id = res?.data?.room_template_id || res?.data?.id;
      setTemplateId(id);
      alert(`Tạo thành công! ID: ${id}`);
    } catch (err) {
      alert('❌ Tạo thất bại: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!templateId) return alert('⚠️ Chưa nhập Template ID để cập nhật');
    setLoading(true);
    try {
      const res = await RoomApi.update(templateId, form);
      console.log('✏️ Updated:', res);
      alert('Cập nhật thành công!');
    } catch (err) {
      alert('❌ Lỗi cập nhật: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleList = async () => {
    setLoading(true);
    try {
      const data = await RoomApi.getAll();
      setList(data);
      console.log('📜 List:', data);
    } catch (err) {
      alert('❌ Lỗi lấy danh sách: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDetail = async () => {
    if (!templateId) return alert('⚠️ Chưa nhập Template ID');
    setLoading(true);
    try {
      const data = await RoomApi.getDetail(templateId);
      setDetail(data);
      console.log('🔍 Detail:', data);
    } catch (err) {
      alert('❌ Lỗi detail: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!templateId) return alert('⚠️ Chưa nhập Template ID');
    if (!window.confirm('Xóa template này?')) return;
    setLoading(true);
    try {
      await RoomApi.delete(templateId);
      alert('🗑️ Đã xóa thành công!');
      setTemplateId('');
      setDetail(null);
    } catch (err) {
      alert('❌ Lỗi xóa: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ====== PUBLIC API ======
  const handlePublicList = async () => {
    setLoading(true);
    try {
      const res = await RoomApi.getAll();
      console.log('🌍 Public List:', res);
      setPublicList(res?.data || res);
    } catch (err) {
      alert('❌ Lỗi lấy danh sách public: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePublicDetail = async () => {
    if (!templateId) return alert('⚠️ Nhập Template ID để xem public detail');
    setLoading(true);
    try {
      const res = await fetch(
        `https://nsumwobjesbawigigfwy.functions.supabase.co/public-room-template-detail?template_id=${encodeURIComponent(
          templateId
        )}`,
        {
          headers: {
            'x-api-key': '3D_GALLERY_PUBLIC_API_2025_VS',
          },
        }
      );
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.message || 'Không lấy được public detail');
      setPublicDetail(data);
      console.log('🌍 Public Detail:', data);
    } catch (err) {
      alert('❌ Lỗi lấy chi tiết public: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        padding: 20,
        fontFamily: 'sans-serif',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 20,
      }}
    >
      {/* ================= LEFT PANEL ================= */}
      <div>
        <h2>🏗️ Test Room Template API</h2>

        <div style={{ marginBottom: 10, display: 'flex', gap: 10 }}>
          <input
            type='text'
            placeholder='🔑 Template ID (update / detail / delete)'
            value={templateId}
            onChange={(e) => setTemplateId(e.target.value)}
            style={{ flex: 1 }}
          />
          <button onClick={() => setTemplateId('')}>🧹 Clear</button>
        </div>

        {/* Form inputs */}
        <div
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}
        >
          <input
            name='name'
            value={form.name}
            placeholder='Name'
            onChange={handleChange}
          />
          <input
            name='room_type'
            value={form.room_type}
            placeholder='Room Type'
            onChange={handleChange}
          />
          <input
            name='description'
            value={form.description}
            placeholder='Description'
            onChange={handleChange}
          />
          <input
            name='category'
            value={form.category}
            placeholder='Category'
            onChange={handleChange}
          />
          <input
            name='tags'
            value={form.tags.join(',')}
            placeholder='Tags'
            onChange={(e) =>
              setForm({
                ...form,
                tags: e.target.value.split(',').map((t) => t.trim()),
              })
            }
          />
          <input
            name='dimensions'
            value={JSON.stringify(form.dimensions)}
            placeholder='Dimensions JSON'
            onChange={(e) =>
              setForm({
                ...form,
                dimensions: parseJSON(e.target.value, form.dimensions),
              })
            }
          />
          <input
            name='price'
            value={form.price}
            type='number'
            onChange={handleChange}
            placeholder='Price'
          />
          <select
            name='is_free'
            value={form.is_free}
            onChange={(e) =>
              setForm({ ...form, is_free: e.target.value === 'true' })
            }
          >
            <option value='true'>Free</option>
            <option value='false'>Paid</option>
          </select>
          <select
            name='is_official'
            value={form.is_official}
            onChange={(e) =>
              setForm({ ...form, is_official: e.target.value === 'true' })
            }
          >
            <option value='true'>Official</option>
            <option value='false'>Unofficial</option>
          </select>
          <select name='status' value={form.status} onChange={handleChange}>
            <option value='draft'>Draft</option>
            <option value='published'>Published</option>
          </select>
        </div>

        <div style={{ marginTop: 10 }}>
          <label>Thumbnail: </label>
          <input type='file' name='thumbnail' onChange={handleChange} />
          <label style={{ marginLeft: 10 }}>LOD1: </label>
          <input
            type='file'
            name='glb_lod1'
            accept='.glb'
            onChange={handleChange}
          />
        </div>

        <div style={{ marginTop: 10 }}>
          <button onClick={() => setShowJson(!showJson)}>
            {showJson ? 'Ẩn JSON' : 'Hiện JSON'}
          </button>
          {showJson && (
            <textarea
              rows='8'
              style={{ width: '100%', marginTop: 5 }}
              value={JSON.stringify(form.template_json, null, 2)}
              onChange={(e) =>
                setForm({
                  ...form,
                  template_json: parseJSON(e.target.value, form.template_json),
                })
              }
            />
          )}
        </div>

        {/* Private API Buttons */}
        <div
          style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 10 }}
        >
          <button disabled={loading} onClick={handleCreate}>
            🚀 Tạo
          </button>
          <button disabled={loading} onClick={handleUpdate}>
            ✏️ Cập nhật
          </button>
          <button disabled={loading} onClick={handleDetail}>
            🔍 Chi tiết
          </button>
          <button disabled={loading} onClick={handleList}>
            📜 Danh sách
          </button>
          <button disabled={loading} onClick={handleDelete}>
            🗑️ Xóa
          </button>
        </div>

        {/* Public API Buttons */}
        <hr style={{ margin: '20px 0' }} />
        <h3>🌍 Public API Test</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <button disabled={loading} onClick={handlePublicList}>
            📂 Public List
          </button>
          <button disabled={loading} onClick={handlePublicDetail}>
            🔍 Public Detail
          </button>
        </div>
      </div>

      {/* ================= RIGHT PANEL ================= */}
      <div>
        <h3>📦 Preview / Response</h3>

        {form.thumbnail && (
          <div>
            <p>📷 Thumbnail Preview:</p>
            <img
              src={URL.createObjectURL(form.thumbnail)}
              alt='thumb'
              style={{ width: 150, borderRadius: 8 }}
            />
          </div>
        )}

        {detail && (
          <>
            <h4>🔍 Private Detail</h4>
            <pre style={preStyle}>{JSON.stringify(detail, null, 2)}</pre>
          </>
        )}

        {list?.length > 0 && (
          <>
            <h4>📜 Private List</h4>
            <pre style={preStyle}>{JSON.stringify(list, null, 2)}</pre>
          </>
        )}

        {publicList?.length > 0 && (
          <>
            <h4>🌍 Public List</h4>
            <pre style={preStyle}>{JSON.stringify(publicList, null, 2)}</pre>
          </>
        )}

        {publicDetail && (
          <>
            <h4>🌍 Public Detail</h4>
            <pre style={preStyle}>{JSON.stringify(publicDetail, null, 2)}</pre>
          </>
        )}
      </div>
    </div>
  );
}

const preStyle = {
  background: '#f5f5f5',
  padding: 10,
  borderRadius: 8,
  maxHeight: 250,
  overflow: 'auto',
  fontSize: 12,
};
