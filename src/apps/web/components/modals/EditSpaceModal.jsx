import { useState, useEffect } from 'react';
import { notification } from 'antd';
import { RoomApi } from '@/api/roomApi';
import Modal from '../modal';
import { formatMoney } from '@/common/utils';

export default function EditSpaceModal({
  isVisible,
  onClose,
  space,
  onSuccess,
}) {
  const [api, contextHolder] = notification.useNotification();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    id: '',
    title: '',
    type: '',
    description: '',
    slug: '',
    visibility: 'public',
    thumbnail: '',
    price: 0,
  });

  const [thumbnailPreview, setThumbnailPreview] = useState(null);

  // Load data khi mở modal
  useEffect(() => {
    if (!space) return;

    setForm({
      id: space.id,
      title: space.title,
      slug: space.slug,
      type: space.type,
      description: space.description,
      visibility: space.visibility,
      thumbnail: space.thumbnail,
      price: space.price,
    });

    setThumbnailPreview(space.thumbnail);
  }, [space]);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = { ...form };

      console.log(payload);
      await RoomApi.update(payload);

      api.success({
        title: 'Thành công',
        description: 'Không gian đã được cập nhật.',
      });

      onClose();
      onSuccess();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setForm({
      id: '',
      title: '',
      type: '',
      description: '',
      slug: '',
      visibility: 'public',
      thumbnail: '',
      price: 0,
    });
    setThumbnailPreview(null);
    onClose();
  }

  return (
    <Modal isVisible={isVisible} onClose={handleClose}>
      {contextHolder}
      {loading && (
        <div className='absolute inset-0 bg-white/60 flex items-center justify-center z-50'>
          <div className='animate-spin w-10 h-10 border-4 border-gray-300 border-t-[#2e2e2e] -full'></div>
        </div>
      )}

      <div className='text-2xl font-bold text-gray-800 mb-4 uppercase w-full '>
        Chỉnh sửa không gian
      </div>

      <form
        onSubmit={handleSubmit}
        className={`space-y-4 w-[500px] ${
          loading ? 'opacity-50 pointer-events-none' : ''
        }`}
      >
        <div>
          <label className='block text-gray-700 font-medium mb-1'>
            Tên không gian
          </label>
          <input
            type='text'
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className='w-full border border-gray-300  px-3 py-2 '
          />
        </div>

        <div>
          <label className='block text-gray-700 font-medium mb-1'>Mô tả</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className='w-full border border-gray-300  px-3 py-2 h-28 '
          />
        </div>

        <div>
          <label className='block text-gray-700 font-medium mb-1'>
            Trạng thái hiển thị
          </label>
          <select
            value={form.visibility}
            onChange={(e) => setForm({ ...form, visibility: e.target.value })}
            className='w-full border border-gray-300  px-3 py-2 bg-white cursor-pointer '
          >
            <option value='public'>Công khai</option>
            <option value='private'>Riêng tư</option>
          </select>
        </div>
        {/* ⭐ PRICE – CHỈ KHI LÀ TEMPLATE */}
        {form.type === 'template' && (
          <div>
            <div className='flex justify-between'>
              <label className='block text-gray-700 font-medium mb-1'>
                Giá template (VNĐ)
              </label>
              Giá cũ: {formatMoney(space.price)}
            </div>
            <input
              type='number'
              min={0}
              value={form.price}
              onChange={(e) =>
                setForm({ ...form, price: Number(e.target.value) })
              }
              className='w-full border border-gray-300  px-3 py-2 '
              placeholder='Nhập giá template'
            />
          </div>
        )}

        <div>
          <label className='block text-gray-700 font-medium mb-1'>
            Thumbnail
          </label>

          {thumbnailPreview && (
            <img
              src={thumbnailPreview}
              className='w-full h-40 object-cover border  mb-3'
            />
          )}

          <input
            type='file'
            className='block w-full text-sm text-gray-700'
            onChange={(e) => {
              const file = e.target.files[0];
              if (!file) return;

              setForm({ ...form, thumbnail: file });
              setThumbnailPreview(URL.createObjectURL(file));
            }}
          />
        </div>

        <div className='grid grid-cols-2 gap-3'>
          <button type='submit' className=' primary-button mt-4'>
            Cập nhật
          </button>
          <button
            className=' secondary-button mt-4'
            onClick={() =>
              (window.location.href =
                form.type == 'template'
                  ? `/template-edit/` + form.slug
                  : `/exhibition-edit/` + form.slug)
            }
          >
            Sửa phòng 3D
          </button>
        </div>
      </form>
    </Modal>
  );
}
