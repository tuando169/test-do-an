import { LicenseApi } from '@/api/licenseApi';
import { RoleEnum } from '@/common/constants';
import { formatMoney } from '@/common/utils';
import { useState } from 'react';

export default function EditLicenseModal({ license, onClose, onSuccess }) {
  const [form, setForm] = useState({
    title: license.title,
    price: license.price,
    media_limit: license.media_limit,
    space_limit: license.space_limit,
  });

  const handlePriceChange = (e) => {
    const raw = e.target.value.replace(/,/g, '');
    if (!isNaN(raw)) {
      setForm({ ...form, price: raw });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSave = async () => {
    try {
      await LicenseApi.update(license.id, {
        title: form.title,
        price: Number(form.price),
        media_limit: Number(form.media_limit),
        space_limit: Number(form.space_limit),
      });

      onSuccess();
      onClose();
    } catch {
      alert('Không thể cập nhật gói đăng ký');
    }
  };

  return (
    <div className='fixed inset-0 bg-black/40 flex items-center justify-center z-50'>
      <div className='bg-white p-6 shadow-lg w-[420px]'>
        <h2 className='text-xl font-semibold mb-4'>Chỉnh sửa gói đăng ký</h2>

        <label className='block mb-1'>Tên gói</label>
        <input
          name='title'
          className='border p-2 w-full mb-3'
          value={form.title}
          onChange={handleChange}
        />

        <label className='block mb-1'>Giá (VND)</label>
        <input
          className='border p-2 w-full mb-3'
          value={formatMoney(form.price)}
          onChange={handlePriceChange}
        />

        <label className='block mb-1'>Giới hạn tài nguyên</label>
        <input
          name='media_limit'
          type='number'
          className='border p-2 w-full mb-3'
          value={form.media_limit}
          onChange={handleChange}
        />

        <label className='block mb-1'>Giới hạn không gian</label>
        <input
          name='space_limit'
          type='number'
          className='border p-2 w-full mb-4'
          value={form.space_limit}
          onChange={handleChange}
        />

        <div className='flex justify-end gap-3'>
          <button className='secondary-button' onClick={onClose}>
            Hủy
          </button>
          <button className='primary-button' onClick={handleSave}>
            Lưu
          </button>
        </div>
      </div>
    </div>
  );
}
