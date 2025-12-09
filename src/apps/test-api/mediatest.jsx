import { ImageApi } from '@/api/imageApi';
import React, { useState, useEffect } from 'react';

export default function MediaApiTest() {
  const [file, setFile] = useState(null);
  const [folderId, setFolderId] = useState('');
  const [output, setOutput] = useState('');
  const [mediaList, setMediaList] = useState([]);
  const [loading, setLoading] = useState(false);

  // 🔹 Lấy danh sách media khi load trang
  useEffect(() => {
    handleGetList();
  }, []);

  // 🟩 Upload file
  const handleUpload = async () => {
    if (!file) return alert('Vui lòng chọn file!');
    setLoading(true);
    try {
      const res = await ImageApi.upload(file, folderId, ['avatar', 'test'], {
        alt: 'Upload Test',
      });
      setOutput('✅ Upload thành công:\n' + JSON.stringify(res, null, 2));
      handleGetList();
    } catch (err) {
      setOutput('❌ Upload lỗi: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // 🟦 Lấy danh sách media
  const handleGetList = async () => {
    setLoading(true);
    try {
      const list = await ImageApi.getList();
      console.log('Danh sách media:', list);
      setMediaList(list);
      setOutput('📦 Lấy danh sách thành công (' + list.length + ' file)');
    } catch (err) {
      setOutput('❌ Lỗi lấy danh sách: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // 🟥 Xóa file
  const handleDelete = async (id) => {
    if (!window.confirm('Bạn chắc chắn muốn xóa file này?')) return;
    setLoading(true);
    try {
      await ImageApi.delete(id);
      setMediaList((prev) => prev.filter((m) => m.id !== id));
      setOutput('🗑️ Đã xóa media ID: ' + id);
    } catch (err) {
      setOutput('❌ Lỗi xóa: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{ maxWidth: 700, margin: '40px auto', fontFamily: 'monospace' }}
    >
      <h2>🧩 Media API Tester</h2>

      {/* Upload Form */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          padding: 12,
          border: '1px solid #333',
          borderRadius: 6,
          marginBottom: 16,
        }}
      >
        <label>📁 Chọn file upload:</label>
        <input
          type='file'
          onChange={(e) => setFile(e.target.files[0])}
          style={{ marginBottom: 8 }}
        />
        <input
          type='text'
          placeholder='Folder ID (tùy chọn)'
          value={folderId}
          onChange={(e) => setFolderId(e.target.value)}
          style={{ padding: 4 }}
        />
        <button onClick={handleUpload} disabled={loading}>
          {loading ? 'Đang tải...' : 'Upload file'}
        </button>
      </div>

      {/* Danh sách media */}
      <div>
        <h3>📦 Danh sách Media</h3>
        <button onClick={handleGetList} disabled={loading}>
          Làm mới danh sách
        </button>

        {mediaList.length === 0 ? (
          <p>Không có file nào</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {mediaList.map((m) => (
              <li
                key={m.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  borderBottom: '1px solid #444',
                  padding: '8px 0',
                }}
              >
                <img
                  src={m.file_url}
                  alt={m.original_filename}
                  width={80}
                  height={80}
                  style={{
                    objectFit: 'cover',
                    borderRadius: 6,
                    marginRight: 10,
                    border: '1px solid #333',
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div>{m.original_filename}</div>
                  <small>{(m.file_size / 1024).toFixed(1)} KB</small>
                </div>
                <button
                  onClick={() => handleDelete(m.id)}
                  style={{
                    background: '#ff5555',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 4,
                    padding: '4px 8px',
                    cursor: 'pointer',
                  }}
                >
                  Xóa
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Kết quả */}
      <pre
        style={{
          background: '#111',
          color: '#0f0',
          padding: 10,
          marginTop: 16,
          borderRadius: 6,
          whiteSpace: 'pre-wrap',
        }}
      >
        {output || '👉 Kết quả hiển thị tại đây'}
      </pre>
    </div>
  );
}
