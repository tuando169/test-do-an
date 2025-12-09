import { useState } from 'react';
import Modal from '../modal';
import WebLine from '../web-line';
import { AuthApi } from '@/api/authApi';
import { notification } from 'antd';

export default function AuthModal({ isVisible, onClose, onSuccess, initMode }) {
  const [api, contextHolder] = notification.useNotification();

  const [mode, setMode] = useState(initMode || 'login'); // login | register

  const [form, setForm] = useState({
    name: '',
    role: 'client',
    email: '',
    password: '',
    confirmPassword: '',
  });

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  // ---------------- LOGIN ----------------
  async function handleLogin() {
    try {
      const data = await AuthApi.login(form.email, form.password);

      localStorage.setItem('user', data.id);
      if (onSuccess) onSuccess(data);
      api.success({
        title: 'Đăng nhập thành công',
        description: 'Chào mừng bạn quay lại!',
      });
      onClose();
    } catch {
      api.error({
        title: 'Đăng nhập thất bại',
        description: 'Sai email hoặc mật khẩu',
      });
    }
  }

  // ---------------- REGISTER ----------------
  async function handleRegister() {
    if (form.password !== form.confirmPassword) {
      api.error({
        title: 'Mật khẩu xác nhận không trùng',
      });
      return;
    }

    try {
      await AuthApi.register({
        name: form.name,
        role: form.role,
        email: form.email,
        password: form.password,
      });

      api.success({
        title: 'Đăng ký thành công',
        description: 'Hãy đăng nhập để tiếp tục',
      });

      setMode('login');
    } catch {
      api.error({
        title: 'Đăng ký thất bại',
      });
    }
  }

  return (
    <Modal isVisible={isVisible} onClose={onClose}>
      {contextHolder}

      {mode === 'login' && (
        <div className='w-full'>
          <h2 className='text-xl font-bold text-center mb-4 text-[#2e2e2e]'>
            ĐĂNG NHẬP
          </h2>

          <div className='flex flex-col gap-3'>
            <label>Email</label>
            <input
              name='email'
              className='border p-3  w-full'
              value={form.email}
              onChange={handleChange}
            />

            <label>Mật khẩu</label>
            <input
              type='password'
              name='password'
              className='border p-3  w-full'
              value={form.password}
              onChange={handleChange}
            />

            <button
              onClick={handleLogin}
              className='bg-[#2e2e2e] text-white py-3  mt-2 hover:opacity-90'
            >
              ĐĂNG NHẬP
            </button>
          </div>

          <WebLine />

          <div className='text-center mt-3'>Bạn chưa có tài khoản?</div>
          <div
            onClick={() => setMode('register')}
            className='text-center font-semibold text-[#2e2e2e] cursor-pointer mt-1'
          >
            ĐĂNG KÝ
          </div>
        </div>
      )}

      {mode === 'register' && (
        <div>
          <h2 className='text-xl font-bold text-center mb-4 text-[#2e2e2e]'>
            ĐĂNG KÝ
          </h2>

          <div className='flex flex-col gap-3'>
            <label>Tên của bạn</label>
            <input
              name='name'
              className='border p-3  w-full'
              value={form.name}
              onChange={handleChange}
            />

            <label>Vai trò</label>
            <select
              name='role'
              className='border p-3  w-full'
              value={form.role}
              onChange={handleChange}
            >
              <option value='client'>Người dùng</option>
              <option value='designer'>Nhà thiết kế</option>
            </select>

            <label>Email</label>
            <input
              name='email'
              className='border p-3  w-full'
              value={form.email}
              onChange={handleChange}
            />

            <label>Mật khẩu</label>
            <input
              type='password'
              name='password'
              className='border p-3  w-full'
              value={form.password}
              onChange={handleChange}
            />

            <label>Xác nhận mật khẩu</label>
            <input
              type='password'
              name='confirmPassword'
              className='border p-3  w-full'
              value={form.confirmPassword}
              onChange={handleChange}
            />

            <button
              onClick={handleRegister}
              className='bg-[#2e2e2e] text-white py-3  mt-2 hover:opacity-90'
            >
              ĐĂNG KÝ
            </button>
          </div>

          <WebLine />

          <div className='text-center mt-3'>Đã có tài khoản?</div>
          <div
            onClick={() => setMode('login')}
            className='text-center font-semibold text-[#2e2e2e] cursor-pointer mt-1'
          >
            ĐĂNG NHẬP
          </div>
        </div>
      )}
    </Modal>
  );
}
