import { useEffect, useState } from "react";
import { MdEdit, MdDelete } from "react-icons/md";
import { Modal, notification } from "antd";
import { RoleEnum } from "@/common/constants";
import { UserApi } from "@/api/userApi";

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [originalUsers, setOriginalUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
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
      api.error({ message: "Không thể tải danh sách người dùng" });
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
      title: "Xóa người dùng?",
      content: `Bạn có chắc muốn xóa user: ${user.email}?`,
      okText: "Xóa",
      okType: "danger",
      cancelText: "Hủy",

      async onOk() {
        try {
          await UserApi.delete(user.id);
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

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold uppercase">Quản lý người dùng</h1>

        <input
          placeholder="Tìm theo email hoặc tên..."
          className="border p-2  w-80"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <p>Đang tải...</p>
      ) : (
        <div className="min-h-[452px] border  shadow">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="border p-3">Email</th>
                <th className="border p-3">Tên</th>
                <th className="border p-3">SĐT</th>
                <th className="border p-3">Role</th>
                <th className="border p-3">Ngày tạo</th>
                <th className="border p-3">Hành động</th>
              </tr>
            </thead>

            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="border p-3">{u.email}</td>
                  <td className="border p-3">{u.name}</td>
                  <td className="border p-3">{u.phone || "-"}</td>
                  <td className="border p-3">{u.role}</td>
                  <td className="border p-3">
                    {new Date(u.created_at).toLocaleDateString("vi-VN")}
                  </td>

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

              {users.length === 0 && (
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

// =====================================================
// MODAL EDIT USER
// =====================================================

function EditUserModal({ user, onClose, onSuccess }) {
  const [role, setRole] = useState(user.role);

  const handleSave = async () => {
    try {
      await UserApi.update(user.id, { role });
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
