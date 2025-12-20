import { useState, useEffect } from 'react';
import { notification } from 'antd';
import { RoomApi } from '@/api/roomApi';
import Modal from '../modal';

export default function CreateSpaceInfoModal({
  isVisible,
  onClose,
  template,
  onSuccess,
  mode = 'space', // ⭐ NEW: 'template' | 'space'
}) {
  const [api, contextHolder] = notification.useNotification();
  const [isLoading, setIsLoading] = useState(false);

  const [form, setForm] = useState({
    title: '',
    description: '',
    visibility: 'public',
    thumbnail: '',
    room_json: null,
    price: 0,
  });

  const [thumbnailPreview, setThumbnailPreview] = useState('');

  useEffect(() => {
    console.log(template);

    setForm({
      title: ``,
      description: '',
      visibility: 'public',
      thumbnail: '',
      room_json: null,
      price: 0,
    });
    if (!template?.title) {
      return;
    }

    setForm({
      title: `Bản sao của ${template.title}`,
      description: template.description || '',
      visibility: 'public',
      thumbnail: template.thumbnail || '',
      room_json: template.room_json,
      price: template.price || 0,
    });
    setThumbnailPreview(template.thumbnail || '');
  }, [template]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (isLoading) return;

    setIsLoading(true);

    try {
      const payload = {
        ...form,
        type: mode === 'template' ? 'template' : 'gallery',
      };

      // ⭐ Nếu không phải template → xoá price
      if (mode !== 'template') {
        delete payload.price;
      }

      await RoomApi.create(payload);

      api.success({
        message: 'Thành công',
        description:
          mode === 'template'
            ? 'Đã tạo không gian mẫu.'
            : 'Đã tạo không gian trưng bày.',
      });

      onSuccess();
      handleClose();
    } catch (err) {
      if (err?.response?.status === 422) {
        api.error({
          message: 'Lỗi',
          description:
            'Thumbnail không hợp lệ. Vui lòng thử lại với thumbnail khác.',
        });
        return;
      }
      if (err?.response?.status === 403) {
        api.error({
          message: 'Lỗi',
          description: 'Bạn cần đăng ký gói trả phí để thêm không gian.',
        });
        return;
      }
      if (err?.response?.status === 429) {
        api.error({
          message: 'Lỗi',
          description:
            'Bạn đã đạt đến giới hạn tạo không gian của mình. Vui lòng nâng cấp gói để tiếp tục.',
        });
        return;
      }
      api.error({
        message: 'Lỗi',
        description: 'Không thể tạo không gian. Vui lòng thử lại.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  function handleClose() {
    setForm({
      title: '',
      description: '',
      visibility: 'public',
      thumbnail: '',
      room_json: {},
      price: 0, // ⭐ reset price
    });
    setThumbnailPreview('');
    setIsLoading(false);
    onClose();
  }

  return (
    <Modal isVisible={isVisible} onClose={handleClose}>
      {contextHolder}

      {/* ⭐ TITLE TÙY THEO MODE */}
      <div className='text-2xl font-semibold text-[#2e2e2e] w-[500px] mb-4'>
        {mode === 'template' ? 'TẠO KHÔNG GIAN MẪU' : 'TẠO KHÔNG GIAN'}
        {template?.title && (
          <span>
            {' '}
            từ <span className='underline'>{template.title}</span>
          </span>
        )}
      </div>

      {/* FORM */}
      <form className='flex flex-col w-full mt-4' onSubmit={handleSubmit}>
        {/* Tên */}
        <label className='mb-2'>Tên</label>
        <input
          type='text'
          required
          disabled={isLoading}
          className='bg-gray-200 p-3 mb-4 text-[16px] outline-none w-full'
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />

        {/* Mô tả */}
        <label className='mb-2'>Mô tả</label>
        <textarea
          disabled={isLoading}
          className='bg-gray-200 p-3 mb-4 text-[16px] outline-none w-full min-h-[100px]'
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />

        {/* Hiển thị */}
        <label className='mb-2'>Hiển thị</label>
        <select
          disabled={isLoading}
          value={form.visibility}
          onChange={(e) => setForm({ ...form, visibility: e.target.value })}
          className='bg-gray-200 p-3 mb-4 text-[16px] outline-none w-full'
        >
          <option value='public'>Công khai</option>
          <option value='private'>Riêng tư</option>
        </select>
        {/* ⭐ PRICE – CHỈ KHI TẠO TEMPLATE */}
        {mode === 'template' && (
          <>
            <label className='mb-2'>Giá (VNĐ)</label>
            <input
              type='number'
              min={0}
              required
              disabled={isLoading}
              className='bg-gray-200 p-3 mb-4 text-[16px] outline-none w-full'
              value={form.price}
              onChange={(e) =>
                setForm({ ...form, price: Number(e.target.value) })
              }
              placeholder='Nhập giá template'
            />
          </>
        )}

        {/* Thumbnail */}
        <label className='mb-2'>Thumbnail</label>

        {(thumbnailPreview || form.thumbnail) && (
          <img
            src={thumbnailPreview || form.thumbnail}
            className='w-full h-40 object-cover border mb-3'
            alt='Thumbnail'
          />
        )}

        <input
          key={form.title}
          type='file'
          required={!form.thumbnail}
          disabled={isLoading}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              setThumbnailPreview(URL.createObjectURL(file));
              setForm({ ...form, thumbnail: file });
            }
          }}
          className='mb-4'
        />

        {/* BUTTON */}
        <button
          className={`primary-button mt-2 flex justify-center items-center gap-2 transition-all ${
            isLoading ? 'opacity-70 cursor-not-allowed' : ''
          }`}
          disabled={isLoading}
        >
          {isLoading && (
            <div className='w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
          )}
          {isLoading
            ? 'ĐANG TẠO...'
            : mode === 'template'
            ? 'TẠO KHÔNG GIAN MẪU'
            : 'TẠO KHÔNG GIAN'}
        </button>
      </form>
    </Modal>
  );
}
