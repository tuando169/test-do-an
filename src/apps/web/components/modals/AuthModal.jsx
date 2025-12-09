import { useEffect, useState } from 'react';
import Modal from '../modal';
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
  async function handleLogin(e) {
    e.preventDefault();
    AuthApi.login(form.email, form.password)
      .then((data) => {
        localStorage.setItem('user', data.id);
        if (onSuccess) onSuccess(data.id);
        api.success({
          title: 'Đăng nhập thành công',
          description: 'Chào mừng bạn quay lại!',
        });
        onClose();
      })
      .catch(() => {
        api.error({
          title: 'Đăng nhập thất bại',
          description: 'Sai email hoặc mật khẩu',
        });
      });
  }

  // ---------------- REGISTER ----------------
  async function handleRegister(e) {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      api.error({
        title: 'Mật khẩu xác nhận không trùng',
      });
      return;
    }

    try {
      await AuthApi.signup({
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
  useEffect(() => {
    if (initMode) setMode(initMode);
  }, [initMode]);

  return (
    <Modal isVisible={isVisible} onClose={onClose}>
      {contextHolder}

      {mode === 'login' && (
        <div className='w-[500px]'>
          <h2 className='text-xl font-bold text-center mb-4 text-[#2e2e2e]'>
            ĐĂNG NHẬP
          </h2>

          <form className='flex flex-col gap-3' onSubmit={handleLogin}>
            <label>Email</label>
            <input
              name='email'
              required
              className='border p-3  w-full'
              value={form.email}
              onChange={handleChange}
            />

            <label>Mật khẩu</label>
            <input
              type='password'
              name='password'
              required
              className='border p-3  w-full'
              value={form.password}
              onChange={handleChange}
            />

            <button className='primary-button'>ĐĂNG NHẬP</button>
          </form>

          <hr className='w-full bg-[#2e2e2e] my-3' />

          <div className='text-center'>Bạn chưa có tài khoản?</div>
          <div
            onClick={() => setMode('register')}
            className='secondary-button mt-3'
          >
            ĐĂNG KÝ
          </div>
        </div>
      )}

      {mode === 'register' && (
        <div className='w-[500px]'>
          <h2 className='text-xl font-bold text-center mb-4 text-[#2e2e2e]'>
            ĐĂNG KÝ
          </h2>

          <form className='flex flex-col gap-3' onSubmit={handleRegister}>
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
              required
              className='border p-3  w-full'
              value={form.email}
              onChange={handleChange}
            />

            <label>Mật khẩu</label>
            <input
              type='password'
              name='password'
              required
              className='border p-3  w-full'
              value={form.password}
              onChange={handleChange}
            />

            <label>Xác nhận mật khẩu</label>
            <input
              type='password'
              name='confirmPassword'
              required
              className='border p-3  w-full'
              value={form.confirmPassword}
              onChange={handleChange}
            />

            <button className='primary-button'>ĐĂNG KÝ</button>
          </form>

          <hr className='w-full bg-[#2e2e2e] my-3' />

          <div className='text-center'>Đã có tài khoản?</div>
          <div
            onClick={() => setMode('login')}
            className='secondary-button mt-3'
          >
            ĐĂNG NHẬP
          </div>
        </div>
      )}
    </Modal>
  );
}
