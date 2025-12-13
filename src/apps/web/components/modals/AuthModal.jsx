import { useEffect, useState } from "react";
import Modal from "../modal";
import { AuthApi } from "@/api/authApi";
import { notification } from "antd";

export default function AuthModal({ isVisible, onClose, onSuccess, initMode }) {
  const [api, contextHolder] = notification.useNotification();

  const [mode, setMode] = useState(initMode || "login"); // login | register
  const [loading, setLoading] = useState(false); // ⭐ STATE LOADING
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  const [form, setForm] = useState({
    name: "",
    role: "client",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
  });

  function handleAvatarChange(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      api.error({ title: "Vui lòng chọn ảnh hợp lệ" });
      return;
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleClose() {
    setForm({
      name: "",
      role: "client",
      email: "",
      password: "",
      confirmPassword: "",
      phone: "",
    });
    setAvatarFile(null);
    setAvatarPreview(null);
    setLoading(false);
    onClose();
  }

  // ---------------- LOGIN ----------------
  async function handleLogin(e) {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    AuthApi.login(form.email, form.password)
      .then((data) => {
        if (onSuccess) onSuccess(data.id);

        api.success({
          title: "Đăng nhập thành công",
          description: "Chào mừng bạn quay lại!",
        });

        handleClose();
      })
      .catch(() => {
        api.error({
          title: "Đăng nhập thất bại",
          description: "Sai email hoặc mật khẩu",
        });
      })
      .finally(() => setLoading(false));
  }

  // ---------------- REGISTER ----------------
  async function handleRegister(e) {
    e.preventDefault();
    if (loading) return;

    if (form.password !== form.confirmPassword) {
      api.error({
        title: "Mật khẩu xác nhận không trùng",
      });
      return;
    }
    if (!avatarFile) {
      api.error({
        title: "Vui lòng chọn ảnh đại diện",
      });
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();

      formData.append("name", form.name);
      formData.append("role", form.role);
      formData.append("email", form.email);
      formData.append("password", form.password);
      formData.append("avatar", avatarFile);

      await AuthApi.signup(formData);

      api.success({
        title: "Đăng ký thành công",
        description: "Hãy đăng nhập để tiếp tục",
      });

      setMode("login");
      setForm({
        role: "",
        phone: "",
        confirmPassword: "",
        email: "",
        name: "",
        password: "",
      });
    } catch (err) {
      api.error({
        title: "Đăng ký thất bại",
        description: err,
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (initMode) setMode(initMode);
  }, [initMode]);

  return (
    <Modal isVisible={isVisible} onClose={handleClose}>
      {contextHolder}

      {/* ⭐ OVERLAY LOADING */}
      {loading && (
        <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-50">
          <div className="w-10 h-10 border-4 border-gray-300 border-t-[#2e2e2e] rounded-full animate-spin"></div>
        </div>
      )}

      {/* LOGIN */}
      {mode === "login" && (
        <div className="w-[500px] relative">
          <h2 className="text-xl font-bold text-center mb-4 text-[#2e2e2e]">
            ĐĂNG NHẬP
          </h2>

          <form className="flex flex-col gap-3" onSubmit={handleLogin}>
            <label>Email</label>
            <input
              name="email"
              required
              disabled={loading}
              className="border p-3 w-full disabled:bg-gray-100"
              value={form.email}
              onChange={handleChange}
            />

            <label>Mật khẩu</label>
            <input
              type="password"
              name="password"
              required
              disabled={loading}
              className="border p-3 w-full disabled:bg-gray-100"
              value={form.password}
              onChange={handleChange}
            />

            <button
              disabled={loading}
              className="primary-button flex justify-center items-center gap-2"
            >
              {loading && (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              )}
              ĐĂNG NHẬP
            </button>
          </form>

          <hr className="w-full bg-[#2e2e2e] my-3" />

          <div className="text-center">Bạn chưa có tài khoản?</div>
          <div
            onClick={() => !loading && setMode("register")}
            className="secondary-button mt-3"
          >
            ĐĂNG KÝ
          </div>
        </div>
      )}

      {/* REGISTER */}
      {mode === "register" && (
        <div className="w-[500px] relative">
          <h2 className="text-xl font-bold text-center mb-4 text-[#2e2e2e]">
            ĐĂNG KÝ
          </h2>

          <form className="flex flex-col gap-3" onSubmit={handleRegister}>
            <div className="flex items-center gap-4 h-full">
              <label className="cursor-pointer h-full">
                <div className="aspect-square h-40 border flex items-center justify-center overflow-hidden bg-gray-100">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-sm text-gray-500">Chọn ảnh</span>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                  disabled={loading}
                />
              </label>
              <div>
                <label>Tên của bạn</label>
                <input
                  name="name"
                  className="border p-3 w-full disabled:bg-gray-100"
                  value={form.name}
                  onChange={handleChange}
                  disabled={loading}
                />

                <label>Vai trò</label>
                <select
                  name="role"
                  className="border p-3 w-full disabled:bg-gray-100"
                  value={form.role}
                  onChange={handleChange}
                  disabled={loading}
                >
                  <option value="client">Người dùng</option>
                  <option value="designer">Nhà thiết kế</option>
                </select>
              </div>
            </div>

            <label>Số điện thoại</label>
            <input
              name="phone"
              required
              className="border p-3 w-full disabled:bg-gray-100"
              value={form.phone}
              onChange={handleChange}
              disabled={loading}
            />

            <label>Email</label>
            <input
              name="email"
              required
              className="border p-3 w-full disabled:bg-gray-100"
              value={form.email}
              onChange={handleChange}
              disabled={loading}
            />

            <label>Mật khẩu</label>
            <input
              type="password"
              name="password"
              required
              className="border p-3 w-full disabled:bg-gray-100"
              value={form.password}
              onChange={handleChange}
              disabled={loading}
            />

            <label>Xác nhận mật khẩu</label>
            <input
              type="password"
              name="confirmPassword"
              required
              className="border p-3 w-full disabled:bg-gray-100"
              value={form.confirmPassword}
              onChange={handleChange}
              disabled={loading}
            />

            <button
              disabled={loading}
              className="primary-button flex justify-center items-center gap-2"
            >
              {loading && (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              )}
              ĐĂNG KÝ
            </button>
          </form>

          <hr className="w-full bg-[#2e2e2e] my-3" />

          <div className="text-center">Đã có tài khoản?</div>
          <div
            onClick={() => !loading && setMode("login")}
            className="secondary-button mt-3"
          >
            ĐĂNG NHẬP
          </div>
        </div>
      )}
    </Modal>
  );
}
