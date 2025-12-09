import { ImageApi } from '@/api/imageApi';
import { Object3dApi } from '@/api/object3dApi';
import { useEffect, useState } from 'react';
import { MdDelete, MdEdit, MdAdd, MdClose } from 'react-icons/md';

export default function ManageResource() {
  const [tab, setTab] = useState('image');

  const [images, setImages] = useState([]);
  const [objects, setObjects] = useState([]);
  const [displayData, setDisplayData] = useState([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);

  const [form, setForm] = useState({
    title: '',
    url: '',
    description: '',
    file: null,
  });

  const loadImages = async () => {
    const data = await ImageApi.getMediaList();
    setImages(data);
  };

  const loadObjects = async () => {
    const data = await Object3dApi.getObjectList();
    setObjects(data);
  };

  // ========== CRUD API ==========

  const createItem = async (data) => {
    console.log('createItem()', data);
  };

  const updateItem = async (id, data) => {
    console.log('updateItem()', id, data);
  };

  const deleteItem = async (id, type) => {
    console.log('deleteItem()', id, type);
  };

  // ========== LOAD INITIAL ==========

  useEffect(() => {
    loadImages();
    loadObjects();
  }, []);

  useEffect(() => {
    fetchDisplayData();
  }, [tab]);

  useEffect(() => {
    fetchDisplayData();
  }, [images, objects]);

  function fetchDisplayData() {
    if (tab === 'image') setDisplayData(images);
    else setDisplayData(objects);
  }

  // ========== POPUP ==========

  const openCreate = () => {
    setEditId(null);
    setForm({
      title: '',
      url: '',
      description: '',
      file: null,
    });
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditId(item.id);
    setForm({
      title: item.title,
      url: item.file_url,
      description: item.description || '',
      file: null,
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    let finalUrl = form.url;

    // Nếu có file mới upload lên server
    if (form.file) {
      const uploaded = await ImageApi.uploadMedia(form.file)
        .then(() => {
          alert('Upload thành công');
        })
        .catch((err) => {
          if (err.status === 422) alert('Nội dung upload không hợp lệ');
          else alert('Upload thất bại');
        });
      finalUrl = uploaded.url;
    }

    const dataToSend = {
      title: form.title,
      description: form.description,
      url: finalUrl,
      type: tab,
    };

    if (editId) await updateItem(editId, dataToSend);
    else await createItem(dataToSend);

    setModalOpen(false);
    loadImages();
    loadObjects();
  };

  const handleDelete = async (id, type) => {
    if (!window.confirm('Bạn có chắc muốn xoá mục này?')) return;

    await deleteItem(id, type);

    loadImages();
    loadObjects();
  };

  return (
    <div className='container-main flex-col py-10'>
      <h1 className='text-3xl font-bold text-[#2e2e2e] uppercase mb-6'>
        Quản Lý Tài Nguyên
      </h1>

      {/* ================= TAB ================= */}
      <div className='flex border-b mb-6 items-center'>
        <button
          onClick={() => setTab('image')}
          className={`
            px-6 py-2 font-semibold tracking-wide
            ${tab === 'image' ? 'bg-[#2e2e2e] text-white' : 'text-[#2e2e2e]'}
          `}
        >
          Thư Viện Tranh
        </button>

        <button
          onClick={() => setTab('object')}
          className={`
            px-6 py-2 font-semibold tracking-wide
            ${tab === 'object' ? 'bg-[#2e2e2e] text-white' : 'text-[#2e2e2e]'}
          `}
        >
          Thư Viện Object 3D
        </button>

        <button
          onClick={openCreate}
          className='ml-auto flex items-center gap-2 bg-[#2e2e2e] text-white px-4 py-2 hover:opacity-80'
        >
          <MdAdd size={20} /> Thêm Mới
        </button>
      </div>

      {/* ================= TABLE ================= */}
      <div className='border border-gray-300 overflow-hidden'>
        <table className='w-full text-left'>
          <thead className='bg-gray-100 text-[#2e2e2e]'>
            <tr>
              <th className='p-3'>{tab === 'image' ? 'Ảnh' : 'Xem trước'}</th>
              <th className='p-3'>Tên</th>
              <th className='p-3'>Mô tả</th>
              <th className='p-3 text-right'>Hành động</th>
            </tr>
          </thead>

          <tbody>
            {displayData.map((item) => (
              <tr key={item.id} className='border-b'>
                <td className='p-3'>
                  <img
                    src={item.file_url}
                    className={`${
                      tab === 'image' ? 'w-20 h-16' : 'w-20 h-20'
                    } object-cover border`}
                    alt=''
                  />
                </td>

                <td className='p-3 font-semibold text-[#2e2e2e]'>
                  {item.title}
                </td>

                <td className='p-3 text-gray-600 text-sm'>
                  {item.description}
                </td>

                <td className='p-3 text-right'>
                  <button
                    className='text-blue-600 mr-3 hover:text-blue-800'
                    onClick={() => openEdit(item)}
                  >
                    <MdEdit size={22} />
                  </button>

                  <button
                    className='text-red-600 hover:text-red-800'
                    onClick={() => handleDelete(item.id, tab)}
                  >
                    <MdDelete size={22} />
                  </button>
                </td>
              </tr>
            ))}

            {displayData.length === 0 && (
              <tr>
                <td colSpan={4} className='p-5 text-center text-gray-500'>
                  Không có dữ liệu.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ================= MODAL ================= */}
      {modalOpen && (
        <div className='fixed inset-0 bg-black/40 flex items-center justify-center z-50'>
          <div className='bg-white w-[450px] p-6 relative'>
            <button
              className='absolute right-3 top-3 text-[#2e2e2e]'
              onClick={() => setModalOpen(false)}
            >
              <MdClose size={24} />
            </button>

            <h2 className='text-xl font-bold mb-4 text-[#2e2e2e]'>
              {editId
                ? `Chỉnh sửa ${tab === 'image' ? 'ảnh' : 'object 3D'}`
                : `Thêm ${tab === 'image' ? 'ảnh' : 'object 3D'} mới`}
            </h2>

            {/* FORM */}
            <div className='flex flex-col gap-4'>
              {/* TÊN */}
              <div>
                <label className='font-medium text-[#2e2e2e]'>Tên</label>
                <input
                  type='text'
                  className='w-full border px-3 py-2 mt-1'
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>

              {/* UPLOAD FILE */}
              {tab === 'image' && (
                <div>
                  <label className='font-medium text-[#2e2e2e]'>
                    Upload ảnh
                  </label>

                  <input
                    type='file'
                    accept='image/*'
                    className='w-full border px-3 py-2 mt-1'
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setForm((prev) => ({
                          ...prev,
                          file,
                          url: URL.createObjectURL(file),
                        }));
                      }
                    }}
                  />
                </div>
              )}

              {/* URL OBJECT 3D */}
              {tab === 'object' && (
                <div>
                  <label className='font-medium text-[#2e2e2e]'>
                    URL Object 3D (.glb)
                  </label>

                  <input
                    type='text'
                    className='w-full border px-3 py-2 mt-1'
                    value={form.url}
                    onChange={(e) => setForm({ ...form, url: e.target.value })}
                  />
                </div>
              )}

              {/* MÔ TẢ */}
              <div>
                <label className='font-medium text-[#2e2e2e]'>Mô tả</label>
                <textarea
                  className='w-full border px-3 py-2 mt-1'
                  rows={3}
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                ></textarea>
              </div>

              <button
                className='bg-[#2e2e2e] text-white w-full py-2 hover:opacity-90 mt-2'
                onClick={handleSubmit}
              >
                {editId ? 'Lưu thay đổi' : 'Thêm mới'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
