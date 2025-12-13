import { UserApi } from '@/api/userApi';
import { RoleEnum } from '@/common/constants';
import { useState } from 'react';

export default function EditUserModal({ user, onClose, onSuccess }) {
  const [role, setRole] = useState(user.role);

  const handleSave = async () => {
    try {
      await UserApi.update(user.id, { role });
      onSuccess();
      onClose();
    } catch {
      alert('Không thể cập nhật quyền');
    }
  };

  return (
    <div className='fixed inset-0 bg-black/40 flex items-center justify-center z-50'>
      <div className='bg-white p-6  shadow-lg w-96 animate-fadeIn'>
        <h2 className='text-xl font-semibold mb-4'>Chỉnh sửa người dùng</h2>

        <label className='block mb-2 text-gray-700'>Quyền hạn</label>
        <select
          className='border p-2  w-full mb-4'
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          <option value={RoleEnum.Admin}>Admin</option>
          <option value={RoleEnum.Designer}>Designer</option>
          <option value={RoleEnum.Client}>Client</option>
        </select>

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
