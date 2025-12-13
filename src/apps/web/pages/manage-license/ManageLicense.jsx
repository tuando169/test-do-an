import { useEffect, useState } from 'react';
import { Modal, notification } from 'antd';
import { RoleEnum } from '@/common/constants';
import { LicenseApi } from '@/api/licenseApi';
import { MdAdd } from 'react-icons/md';
import { formatMoney } from '@/common/utils';
import EditLicenseModal from './components/EditLicenseModal';

export default function ManageLicense() {
  const [licenses, setLicenses] = useState([]);
  const [loading, setLoading] = useState(true);

  const [editLicense, setEditLicense] = useState(null);

  const [api, contextHolder] = notification.useNotification();

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await LicenseApi.getAll();
      setLicenses(data);
    } catch (e) {
      console.error(e);
      api.error({ message: 'Không thể tải danh sách người dùng' });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

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
          await LicenseApi.delete(user.id);
          api.success({ message: 'Đã xóa người dùng' });
          fetchData();
        } catch {
          api.error({ message: 'Không thể xóa người dùng' });
        }
      },
    });
  };

  return (
    <div className='pt-10 container-main flex-col'>
      {contextHolder}
      <div className='flex justify-between mb-4'>
        <h1 className='text-3xl font-bold text-[#2e2e2e] uppercase mb-6'>
          Quản lý Gói Đăng Ký
        </h1>

        <button
          onClick={() => (window.location.href = '/news-editor')}
          className='flex items-center gap-2 primary-button'
        >
          <MdAdd size={20} /> Thêm gói đăng ký
        </button>
      </div>
      {loading ? (
        <p>Đang tải...</p>
      ) : (
        <div className=' border  shadow'>
          <table className='w-full border-collapse'>
            <thead>
              <tr className='bg-gray-100 text-center'>
                <th className='border p-3 min-w-[250px]'>Tên</th>
                <th className='border p-3'>Giá</th>
                <th className='border p-3'>Giới hạn tài nguyên</th>
                <th className='border p-3'>Giới hạn không gian</th>
                <th className='border p-3'></th>
              </tr>
            </thead>

            <tbody>
              {licenses.map((u) => (
                <tr key={u.id} className='hover:bg-gray-50 text-center'>
                  <td className='border p-3'>{u.title}</td>
                  <td className='border p-3 text-right '>
                    <span className='mr-20'>{formatMoney(u.price)} VND</span>
                  </td>
                  <td className='border p-3'>{u.media_limit}</td>
                  <td className='border p-3'>{u.space_limit}</td>

                  {/* CỘT HÀNH ĐỘNG — FIXED */}
                  <td className='border p-3 w-0 whitespace-nowrap text-center'>
                    <div className='inline-flex gap-2 items-center'>
                      <button
                        className='primary-button'
                        onClick={() => setEditLicense(u)}
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

              {licenses.length === 0 && (
                <tr>
                  <td colSpan={6} className='p-5 text-center text-gray-500'>
                    Không có người dùng nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL EDIT */}
      {editLicense && (
        <EditLicenseModal
          license={editLicense}
          onClose={() => setEditLicense(null)}
          onSuccess={fetchData}
        />
      )}
    </div>
  );
}
