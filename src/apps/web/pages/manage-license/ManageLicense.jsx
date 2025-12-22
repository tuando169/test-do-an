import { useEffect, useState } from 'react';
import { Modal, notification } from 'antd';
import { LicenseApi } from '@/api/licenseApi';
import { MdAdd } from 'react-icons/md';
import { formatMoney } from '@/common/utils';
import LicenseModal from './components/LicenseModal';

export default function ManageLicense() {
  const [licenses, setLicenses] = useState([]);
  const [loading, setLoading] = useState(true);

  // ⭐ Dùng chung cho create + edit
  const [modalData, setModalData] = useState(null);

  const [api, contextHolder] = notification.useNotification();

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await LicenseApi.getAll();
      setLicenses(data);
    } catch (e) {
      console.error(e);
      api.error({ message: 'Không thể tải danh sách gói đăng ký' });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className='pt-10 container-main flex-col'>
      {contextHolder}

      {/* HEADER */}
      <div className='flex justify-between mb-4'>
        <h1 className='text-3xl font-bold text-[#2e2e2e] uppercase mb-6'>
          Quản lý Gói Đăng Ký
        </h1>

        {/* ⭐ CREATE */}
        <button
          onClick={() => setModalData({})}
          className='flex items-center gap-2 primary-button'
        >
          <MdAdd size={20} /> Thêm gói đăng ký
        </button>
      </div>

      {/* TABLE */}
      {loading ? (
        <p>Đang tải...</p>
      ) : (
        <div className='border shadow'>
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
              {licenses.map((l) => (
                <tr key={l.id} className='hover:bg-gray-50 text-center'>
                  <td className='border p-3'>{l.title}</td>
                  <td className='border p-3 text-right'>
                    <span className='mr-20'>{formatMoney(l.price)} VND</span>
                  </td>
                  <td className='border p-3'>{l.media_limit}</td>
                  <td className='border p-3'>{l.space_limit}</td>

                  {/* ACTIONS */}
                  <td className='border p-3 whitespace-nowrap text-center'>
                    <div className='inline-flex gap-2 items-center'>
                      <button
                        className='primary-button'
                        onClick={() => setModalData(l)}
                      >
                        Chỉnh sửa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {licenses.length === 0 && (
                <tr>
                  <td colSpan={5} className='p-5 text-center text-gray-500'>
                    Chưa có gói đăng ký nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ⭐ MODAL CREATE / EDIT */}
      {modalData !== null && (
        <LicenseModal
          isVisible={true}
          formData={modalData} // có id → edit, không có → create
          onClose={() => setModalData(null)}
          onSuccess={() => {
            api.success({
              title: 'Thành công',
              description: modalData.id
                ? 'Gói đăng ký đã được cập nhật.'
                : 'Gói đăng ký đã được tạo.',
            });
            fetchData();
          }}
        />
      )}
    </div>
  );
}
