import { useEffect, useState } from 'react';
import { MdEdit, MdDelete } from 'react-icons/md';
import * as userApi from '@/api/userApi';
import { RoleEnum } from '@/common/constants';

export default function ManageUsers() {
  const [users, setUsers] = useState([]); // filtered data
  const [originalUsers, setOriginalUsers] = useState([]); // raw data
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');

  const [editUser, setEditUser] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await userApi.getUsers();
      setOriginalUsers(data); // lưu dữ liệu gốc
      setUsers(data); // hiển thị lần đầu
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  // Fetch 1 lần duy nhất
  useEffect(() => {
    fetchData();
  }, []);

  // Filter realtime không gọi API
  useEffect(() => {
    const keyword = search.toLowerCase();

    const filtered = originalUsers.filter(
      (u) =>
        u.email.toLowerCase().includes(keyword) ||
        (u.name && u.name.toLowerCase().includes(keyword))
    );

    setUsers(filtered);
  }, [search, originalUsers]);

  return (
    <div className='pt-10 container-main flex-col'>
      <div className='flex justify-between'>
        <h1 className='text-2xl font-semibold mb-4 uppercase'>
          Quản lý người dùng
        </h1>

        {/* SEARCH */}
        <input
          placeholder='Tìm theo email hoặc tên...'
          className='border p-2 rounded w-80 mb-4'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <p>Đang tải...</p>
      ) : (
        <div className='min-h-[452px]'>
          <table className='w-full border-collapse'>
            <thead>
              <tr className='bg-gray-100'>
                <th className='border p-2'>Email</th>
                <th className='border p-2'>Tên</th>
                <th className='border p-2'>SĐT</th>
                <th className='border p-2'>Role</th>
                <th className='border p-2'>Ngày tạo</th>
                <th className='border p-2'>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td className='border p-2'>{u.email}</td>
                  <td className='border p-2'>{u.name}</td>
                  <td className='border p-2'>{u.phone || '-'}</td>
                  <td className='border p-2'>{u.role}</td>
                  <td className='border p-2'>
                    {new Date(u.created_at).toLocaleDateString('vi-VN')}
                  </td>
                  <td className='border p-2 flex gap-2'>
                    <MdEdit
                      className='cursor-pointer text-blue-500'
                      size={22}
                      onClick={() => setEditUser(u)}
                    />
                    <MdDelete
                      className='cursor-pointer text-red-500'
                      size={22}
                      onClick={() => {
                        if (confirm('Xóa user này?')) {
                          userApi.deleteUser(u.id).then(fetchData);
                        }
                      }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editUser && (
        <EditUserModal
          user={editUser}
          onClose={() => setEditUser(null)}
          onSuccess={fetchData}
        />
      )}
    </div>
  );
}

// =====================
// POPUP EDIT USER
// =====================

function EditUserModal({ user, onClose, onSuccess }) {
  const [role, setRole] = useState(user.role);

  const handleSave = async () => {
    await userApi.updateUser(user.id, { role });
    onSuccess();
    onClose();
  };

  return (
    <div className='fixed inset-0 bg-black/40 flex items-center justify-center'>
      <div className='bg-white p-6 rounded shadow w-96'>
        <h2 className='text-xl mb-4'>Chỉnh sửa người dùng</h2>

        <select
          className='border p-2 rounded w-full mb-3'
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          <option value={RoleEnum.Admin}>{RoleEnum.Admin}</option>
          <option value={RoleEnum.Designer}>{RoleEnum.Designer}</option>
          <option value={RoleEnum.Client}>{RoleEnum.Client}</option>
        </select>

        <div className='flex justify-end gap-3'>
          <button className='px-4 py-2 bg-gray-300 rounded' onClick={onClose}>
            Hủy
          </button>
          <button
            className='px-4 py-2 bg-blue-600 text-white rounded'
            onClick={handleSave}
          >
            Lưu
          </button>
        </div>
      </div>
    </div>
  );
}
