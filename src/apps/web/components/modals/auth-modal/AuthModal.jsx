import { useState } from 'react';
import Modal from '../../modal';
import WebLine from '../../web-line';
import { AuthApi } from '@/api/authApi';
import { UserApi } from '@/api/userApi';
import { notification } from 'antd';

export default function AuthModal({
  isVisible,
  onClose,
  onSuccess,
  initModal,
}) {
  const [api, contextHolder] = notification.useNotification();

  const [mode, setMode] = useState(initModal || 'login'); // login | register
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

  async function handleLogin(e) {
    e.preventDefault();
    try {
      const data = await AuthApi.login(form.email, form.password);

      localStorage.setItem('user', data.id);
      if (onSuccess) onSuccess(data);

      api.success({ title: 'Đăng nhập thành công' });
      onClose();
    } catch {
      api.error({ title: 'Sai email hoặc mật khẩu' });
    }
  }

  async function handleRegister(e) {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      api.error({ message: 'Mật khẩu xác nhận không trùng khớp' });
      return;
    }

    try {
      await AuthApi.register({
        name: form.name,
        role: form.role,
        email: form.email,
        password: form.password,
      });

      api.success({ message: 'Đăng ký thành công, vui lòng đăng nhập' });
      setMode('login');
    } catch {
      api.error({ message: 'Đăng ký thất bại, vui lòng thử lại' });
    }
  }

  return (
    <Modal isVisible={isVisible} onClose={onClose}>
      {contextHolder}

      {/* ------------------- LOGIN ------------------- */}
      {mode === 'login' && (
        <>
          <div className='modalRegister__title'>ĐĂNG NHẬP</div>

          <form className='modalRegister__form' onSubmit={handleLogin}>
            <label className='modalRegister__form__label'>Email</label>
            <input
              type='text'
              name='email'
              className='modalRegister__form__input'
              value={form.email}
              onChange={handleChange}
            />

            <label className='modalRegister__form__label'>Mật khẩu</label>
            <input
              type='password'
              name='password'
              className='modalRegister__form__input'
              value={form.password}
              onChange={handleChange}
            />

            <button className='modalRegister__form__button'>ĐĂNG NHẬP</button>
          </form>

          <WebLine />
          <div className='modalRegister__have'>Bạn chưa có tài khoản?</div>
          <div
            className='modalRegister__login'
            onClick={() => setMode('register')}
          >
            ĐĂNG KÝ
          </div>
        </>
      )}

      {/* ------------------- REGISTER ------------------- */}
      {mode === 'register' && (
        <>
          <div className='modalRegister__title'>ĐĂNG KÝ</div>

          <form className='modalRegister__form' onSubmit={handleRegister}>
            <label className='modalRegister__form__label'>Tên của bạn</label>
            <input
              type='text'
              name='name'
              className='modalRegister__form__input'
              value={form.name}
              onChange={handleChange}
            />

            <label className='modalRegister__form__label'>Vai trò</label>
            <select
              name='role'
              className='modalRegister__form__input'
              value={form.role}
              onChange={handleChange}
            >
              <option value='client'>Người dùng</option>
              <option value='designer'>Nhà thiết kế</option>
            </select>

            <label className='modalRegister__form__label'>Email</label>
            <input
              type='text'
              name='email'
              className='modalRegister__form__input'
              value={form.email}
              onChange={handleChange}
            />

            <label className='modalRegister__form__label'>Mật khẩu</label>
            <input
              type='password'
              name='password'
              className='modalRegister__form__input'
              value={form.password}
              onChange={handleChange}
            />

            <label className='modalRegister__form__label'>
              Xác nhận mật khẩu
            </label>
            <input
              type='password'
              name='confirmPassword'
              className='modalRegister__form__input'
              value={form.confirmPassword}
              onChange={handleChange}
            />

            <button className='modalRegister__form__button'>ĐĂNG KÝ</button>
          </form>

          <WebLine />
          <div className='modalRegister__have'>Đã có tài khoản?</div>
          <div
            className='modalRegister__login'
            onClick={() => setMode('login')}
          >
            ĐĂNG NHẬP
          </div>
        </>
      )}
    </Modal>
  );
}
