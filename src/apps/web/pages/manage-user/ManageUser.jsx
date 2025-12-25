import { useEffect, useState } from 'react';
import { Modal, notification, Skeleton } from 'antd'; // 1. Import Skeleton
import { UserApi } from '@/api/userApi';
import EditUserModal from './components/EditUserModal';

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [originalUsers, setOriginalUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [editUser, setEditUser] = useState(null);

  const [api, contextHolder] = notification.useNotification();

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await UserApi.getAll();
      setOriginalUsers(data);
      setUsers(data);
    } catch (e) {
      console.error(e);
      api.error({ title: 'Không thể tải danh sách người dùng' });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Search realtime
  useEffect(() => {
    const keyword = search.toLowerCase();

    const filtered = originalUsers.filter(
      (u) =>
        u.email.toLowerCase().includes(keyword) ||
        (u.name && u.name.toLowerCase().includes(keyword))
    );

    setUsers(filtered);
  }, [search, originalUsers]);

  // ===========================
  // DELETE
  // ===========================
  const handleDelete = (user) => {
    Modal.confirm({
      title: 'Xóa người dùng?',
      content: `Bạn có chắc muốn xóa user: ${user.email}?`,
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',

      async onOk() {
        try {
          await UserApi.delete(user.id);
          api.success({ title: 'Đã xóa người dùng' });
          fetchData();
        } catch {
          api.error({ title: 'Không thể xóa người dùng' });
        }
      },
    });
  };

  // 2. Component tạo các dòng Skeleton giả lập bảng
  const TableRowsSkeleton = () => {
    return Array(5)
      .fill(0)
      .map((_, index) => (
        <tr key={index}>
          <td className='border p-3'>
            <Skeleton.Input
              active
              size='small'
              block
              style={{ maxWidth: 200 }}
            />
          </td>
          <td className='border p-3'>
            <Skeleton.Input
              active
              size='small'
              block
              style={{ maxWidth: 150 }}
            />
          </td>
          <td className='border p-3'>
            <Skeleton.Input active size='small' style={{ width: 100 }} />
          </td>
          <td className='border p-3'>
            <Skeleton.Input active size='small' style={{ width: 80 }} />
          </td>
          <td className='border p-3'>
            <Skeleton.Input active size='small' style={{ width: 100 }} />
          </td>
          <td className='border p-3 text-center'>
            <div className='inline-flex gap-2 justify-center'>
              <Skeleton.Button active size='default' style={{ width: 80 }} />
              <Skeleton.Button active size='default' style={{ width: 60 }} />
            </div>
          </td>
        </tr>
      ));
  };

  return (
    <div className='pt-10 container-main flex-col'>
      {contextHolder}

      <div className='flex justify-between items-center mb-6'>
        <h1 className='text-3xl font-bold uppercase'>Quản lý người dùng</h1>

        <input
          placeholder='Tìm theo email hoặc tên...'
          className='border p-2  w-80'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className='min-h-[452px] border  shadow'>
        <table className='w-full border-collapse'>
          <thead>
            <tr className='bg-gray-100 text-left'>
              <th className='border p-3'>Email</th>
              <th className='border p-3'>Tên</th>
              <th className='border p-3'>SĐT</th>
              <th className='border p-3'>Role</th>
              <th className='border p-3'>Ngày tạo</th>
              <th className='border p-3 text-center'>Hành động</th>
            </tr>
          </thead>

          <tbody>
            {/* 3. Logic Render: Loading thì hiện Skeleton Rows, xong thì hiện Data thật */}
            {loading ? (
              <TableRowsSkeleton />
            ) : (
              <>
                {users.map((u) => (
                  <tr key={u.id} className='hover:bg-gray-50'>
                    <td className='border p-3'>{u.email}</td>
                    <td className='border p-3'>{u.name}</td>
                    <td className='border p-3'>{u.phone || '-'}</td>
                    <td className='border p-3'>{u.role}</td>
                    <td className='border p-3'>
                      {new Date(u.created_at).toLocaleDateString('vi-VN')}
                    </td>

                    <td className='border p-3 w-0 whitespace-nowrap text-center'>
                      <div className='inline-flex gap-2 items-center'>
                        <button
                          className='primary-button'
                          onClick={() => setEditUser(u)}
                        >
                          Chỉnh sửa
                        </button>

                        <button
                          className='secondary-button'
                          onClick={() => handleDelete(u)}
                        >
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {users.length === 0 && (
                  <tr>
                    <td colSpan={6} className='p-5 text-center text-gray-500'>
                      Không có người dùng nào.
                    </td>
                  </tr>
                )}
              </>
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL EDIT */}
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
