import { useEffect, useState } from "react";
import { UserApi } from "@/api/userApi";

export default function User() {
  const [user, setUser] = useState(null);

  async function loadUser() {
    try {
      const userId = localStorage.getItem("user");
      const data = await UserApi.getById(userId);
      setUser(data);
    } catch (err) {
      console.error("Lỗi tải user:", err);
    }
  }

  useEffect(() => {
    loadUser();
  }, []);

  if (!user)
    return (
      <div className="text-center text-gray-600 py-10 text-lg">
        Đang tải hồ sơ...
      </div>
    );

  return (
    <>
      <div className="container-main max-w-2xl flex flex-col mx-auto mt-10 p-6 ">
        <h1 className="text-3xl font-bold text-[#2e2e2e] mb-6 text-center">
          Hồ sơ người dùng
        </h1>

        <div className="space-y-4 mb-40">
          <ProfileRow label="Họ tên" value={user.name || "Chưa có"} />
          <ProfileRow label="Email" value={user.email} />
          <ProfileRow label="Số điện thoại" value={user.phone || "Chưa có"} />
          <ProfileRow label="Vai trò" value={user.role} />
          <ProfileRow
            label="Ngày tạo"
            value={new Date(user.created_at).toLocaleString("vi-VN")}
          />
        </div>
      </div>
    </>
  );
}

function ProfileRow({ label, value }) {
  return (
    <div className="flex justify-between border-b pb-3">
      <div className="text-gray-600 font-medium">{label}</div>
      <div className="text-gray-900 font-semibold text-right">{value}</div>
    </div>
  );
}
