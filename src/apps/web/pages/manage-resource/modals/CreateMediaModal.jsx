import { MdClose } from 'react-icons/md';
import { useEffect, useState } from 'react';
import { RoomApi } from '@/api/roomApi';
import { ImageApi } from '@/api/imageApi';
import { notification } from 'antd';
import { Object3dApi } from '@/api/object3dApi';
import { AudioApi } from '@/api/audioApi';

export default function ModalCreateResource({
  isOpen,
  onClose,
  formData,
  tab, // "image" | "object" | "audio"
  onSubmit,
}) {
  const [api, contextHolder] = notification.useNotification();
  const [form, setForm] = useState({
    title: '',
    room_id: [],
    file: null,
  });

  const [preview, setPreview] = useState('');
  const [rooms, setRooms] = useState([]);

  useEffect(() => {
    fetchRooms();
  }, []);

  useEffect(() => {
    if (formData) setForm(formData);
  }, [isOpen]);

  if (!isOpen) return null;

  async function fetchRooms() {
    const data = await RoomApi.getAll();
    setRooms(data);
  }

  function handleRoomSelect(e) {
    const selected = Array.from(e.target.selectedOptions).map(
      (opt) => opt.value
    );
    setForm({ ...form, room_id: selected });
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setForm({ ...form, file });

    const tempUrl = URL.createObjectURL(file);
    setPreview(tempUrl);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.id) {
      await handleUpdate();
    } else await handleCreate();

    onSubmit();
    onClose();
  };

  function handleClose() {
    setForm({
      title: '',
      room_id: [],
      file: null,
    });
    setPreview('');
    onClose();
  }

  async function handleCreate() {
    if (tab === 'image') {
      const res = await ImageApi.create({
        title: form.title,
        file: form.file,
        room_id: form.room_id,
      });
      console.log(res);
      if (res.status == 422)
        alert(
          'File không hợp lệ hoặc quá lớn. Vui lòng thử lại với file khác.'
        );
      api.success({
        title: 'Thành công',
        description: 'Tải lên tranh mới',
      });
      return;
    }
    if (tab === 'object') {
      await Object3dApi.create({
        title: form.title,
        file: form.file,
        description: form.description,
        room_id: form.room_id,
      });
      api.success({
        title: 'Thành công',
        description: 'Tải lên object 3D mới.',
      });
      return;
    }
    if (tab === 'audio') {
      await AudioApi.create({
        title: form.title,
        file: form.file,
        description: form.description,
        room_id: form.room_id,
      });
      api.success({
        title: 'Thành công',
        description: 'Tải lên âm thanh mới.',
      });
      return;
    }
  }
  async function handleUpdate() {
    if (tab === 'image') {
      await ImageApi.update(form.id, {
        title: form.title,
        file: form.file,
        description: form.description,
        room_id: form.room_id,
      });
      api.success({
        title: 'Thành công',
        description: 'Tải lên tranh mới',
      });
      return;
    }
    if (tab === 'object') {
      await Object3dApi.update(form.id, {
        title: form.title,
        file: form.file,
        description: form.description,
        room_id: form.room_id,
      });
      api.success({
        title: 'Thành công',
        description: 'Tải lên object 3D mới.',
      });
      return;
    }
    if (tab === 'audio') {
      await AudioApi.update(form.id, {
        title: form.title,
        file: form.file,
        description: form.description,
        room_id: form.room_id,
      });
      api.success({
        title: 'Thành công',
        description: 'Tải lên âm thanh mới.',
      });
      return;
    }
  }

  return (
    <>
      {contextHolder}
      <div className='fixed inset-0 bg-black/40 flex items-center justify-center z-50'>
        <div className='bg-white w-[460px] p-6 relative  shadow-lg'>
          {/* Close button */}
          <button
            className='absolute right-3 top-3 text-gray-600 hover:text-black'
            onClick={handleClose}
          >
            <MdClose size={24} />
          </button>

          <h2 className='text-xl font-bold mb-4 text-[#2e2e2e] uppercase'>
            Thêm{' '}
            {tab === 'image' ? 'Ảnh' : tab === 'object' ? 'Object 3D' : 'Audio'}{' '}
            Mới
          </h2>

          <form className='flex flex-col gap-4' onSubmit={handleSubmit}>
            <div>
              <label className='font-medium'>Tên tài nguyên</label>
              <input
                type='text'
                required={form.title ? false : true}
                className='w-full border px-3 py-2 mt-1'
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder='Tên hiển thị...'
              />
            </div>

            {form.file_url && (
              <div>
                <label className='font-medium'>Đường dẫn hiện tại</label>
                <a
                  href={form.file_url}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='truncate block text-blue-600 underline'
                >
                  {form.file_url}
                </a>
              </div>
            )}
            {/* UPLOAD FILE */}
            <div>
              <label className='font-medium'>
                Upload{' '}
                {tab === 'image'
                  ? 'Ảnh'
                  : tab === 'object'
                  ? 'File .glb'
                  : 'Audio'}
              </label>

              <input
                type='file'
                required={form.file_url ? false : true}
                accept={
                  tab === 'image'
                    ? 'image/*'
                    : tab === 'object'
                    ? '.glb'
                    : 'audio/*'
                }
                className='w-full border px-3 py-2 mt-1'
                onChange={handleFileChange}
              />

              {/* PREVIEW */}
              {tab === 'image' && preview && (
                <img
                  src={preview}
                  className='w-full h-40 object-cover border mt-3'
                />
              )}

              {tab === 'audio' && preview && (
                <audio controls className='mt-3 w-full'>
                  <source src={preview} />
                </audio>
              )}

              {tab === 'object' && form.file && (
                <p className='text-sm text-gray-600 mt-2'>
                  Đã chọn file: {form.file.name}
                </p>
              )}
            </div>
            <div className='flex flex-col gap-2'>
              <label className='font-medium'>Không gian</label>
              <select
                multiple // ⭐ Cho chọn nhiều
                name='room_id'
                id='room_id'
                required={form.room_id.length === 0}
                className='w-full border px-3 py-2 mt-1 h-32'
                value={form.room_id} // ⭐ select nhiều phải truyền array
                onChange={handleRoomSelect}
              >
                {rooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.title}
                  </option>
                ))}
              </select>
            </div>
            <button className='primary-button w-full' type='submit'>
              {form.id ? 'Cập nhật' : 'Tạo mới'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
