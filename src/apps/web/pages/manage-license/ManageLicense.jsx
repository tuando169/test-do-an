import { useEffect, useState } from "react";
import { Modal, notification } from "antd";
import { RoleEnum } from "@/common/constants";
import { LicenseApi } from "@/api/licenseApi";

export default function ManageLicense() {
  const [licenses, setLicenses] = useState([]);
  const [loading, setLoading] = useState(true);

  const [editUser, setEditUser] = useState(null);

  const [api, contextHolder] = notification.useNotification();

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await LicenseApi.getAll();
      setLicenses(data);
    } catch (e) {
      console.error(e);
      api.error({ message: "Không thể tải danh sách người dùng" });
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
      title: "Xóa người dùng?",
      content: `Bạn có chắc muốn xóa user: ${user.email}?`,
      okText: "Xóa",
      okType: "danger",
      cancelText: "Hủy",

      async onOk() {
        try {
          await LicenseApi.delete(user.id);
          api.success({ message: "Đã xóa người dùng" });
          fetchData();
        } catch {
          api.error({ message: "Không thể xóa người dùng" });
        }
      },
    });
  };

  return (
    <div className="pt-10 container-main flex-col">
      {contextHolder}

      {loading ? (
        <p>Đang tải...</p>
      ) : (
        <div className="min-h-[452px] border  shadow">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="border p-3">Tên</th>
                <th className="border p-3">Giá</th>
                <th className="border p-3">Giới hạn tài nguyên</th>
                <th className="border p-3">Giới hạn không gian</th>
              </tr>
            </thead>

            <tbody>
              {licenses.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="border p-3">{u.title}</td>
                  <td className="border p-3">{u.price} VND</td>
                  <td className="border p-3">{u.media_limit}</td>
                  <td className="border p-3">{u.space_limit}</td>

                  {/* CỘT HÀNH ĐỘNG — FIXED */}
                  <td className="border p-3 w-0 whitespace-nowrap text-center">
                    <div className="inline-flex gap-2 items-center">
                      <button
                        className="primary-button"
                        onClick={() => setEditUser(u)}
                      >
                        Chỉnh sửa
                      </button>

                      <button
                        className="secondary-button"
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
                  <td colSpan={6} className="p-5 text-center text-gray-500">
                    Không có người dùng nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

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

function EditUserModal({ user, onClose, onSuccess }) {
  const [role, setRole] = useState(user.role);

  const handleSave = async () => {
    try {
      await LicenseApi.update(user.id, { role });
      onSuccess();
      onClose();
    } catch {
      alert("Không thể cập nhật quyền");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white p-6  shadow-lg w-96 animate-fadeIn">
        <h2 className="text-xl font-semibold mb-4">Chỉnh sửa người dùng</h2>

        <label className="block mb-2 text-gray-700">Quyền hạn</label>
        <select
          className="border p-2  w-full mb-4"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          <option value={RoleEnum.Admin}>Admin</option>
          <option value={RoleEnum.Designer}>Designer</option>
          <option value={RoleEnum.Client}>Client</option>
        </select>

        <div className="flex justify-end gap-3">
          <button className="secondary-button" onClick={onClose}>
            Hủy
          </button>
          <button className="primary-button" onClick={handleSave}>
            Lưu
          </button>
        </div>
      </div>
    </div>
  );
}
