import { useEffect, useState } from 'react';
import { UserApi } from '@/api/userApi';
import { RoleEnum } from '@/common/constants';
import { notification, Skeleton } from 'antd'; // 1. Import Skeleton

export default function UserProfile() {
  const [api, contextHolder] = notification.useNotification();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false); // Loading khi update data
  const [fetching, setFetching] = useState(true); // 2. Loading khi mới vào trang

  const [editing, setEditing] = useState({
    name: false,
    phone: false,
  });

  const [draft, setDraft] = useState({
    name: '',
    phone: '',
  });

  async function loadUser() {
    setFetching(true);
    try {
      const userId = localStorage.getItem('user');
      const data = await UserApi.getById(userId);
      setUser(data);
      setDraft({
        name: data.name || '',
        phone: data.phone || '',
      });
    } catch (err) {
      console.error('Lỗi tải user:', err);
    } finally {
      setFetching(false);
    }
  }

  useEffect(() => {
    loadUser();
  }, []);

  /* ================= AVATAR ================= */
  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      await UserApi.updateAvatar(user.id, file);
      document.dispatchEvent(new Event('avatar-changed'));
      api.success({
        title: 'Thành công',
        description: 'Cập nhật avatar thành công!',
      });
      // Gọi lại API nhưng không set fetching để tránh nháy toàn bộ trang
      const userId = localStorage.getItem('user');
      const data = await UserApi.getById(userId);
      setUser(data);
    } catch (err) {
      console.error('Lỗi upload avatar:', err);
    } finally {
      setLoading(false);
    }
  };

  /* ================= UPDATE FIELD ================= */
  const handleUpdateField = async (field) => {
    if (!draft[field].trim()) return;

    try {
      setLoading(true);
      await UserApi.update(user.id, {
        [field]: draft[field],
      });
      setEditing((prev) => ({ ...prev, [field]: false }));

      // Reload data background
      const userId = localStorage.getItem('user');
      const data = await UserApi.getById(userId);
      setUser(data);

      api.success({
        title: 'Thành công',
        description: 'Cập nhật thông tin thành công!',
      });
    } catch (err) {
      console.error('Lỗi cập nhật:', err);
    } finally {
      setLoading(false);
    }
  };

  // 3. Component Skeleton mô phỏng trang Profile
  const ProfileSkeleton = () => (
    <div className='container-main max-w-2xl flex flex-col mx-auto mt-10 p-6'>
      {/* Title */}
      <div className='flex justify-center mb-6'>
        <Skeleton.Input active style={{ width: 250, height: 40 }} />
      </div>

      {/* Avatar Circle */}
      <div className='flex flex-col items-center gap-3 mb-8'>
        <Skeleton.Avatar active size={112} shape='circle' />
      </div>

      {/* Rows */}
      <div className='space-y-6'>
        {[1, 2, 3, 4, 5].map((item) => (
          <div key={item} className='flex justify-between border-b pb-3'>
            <Skeleton.Input active size='small' style={{ width: 100 }} />
            <Skeleton.Input active size='small' style={{ width: 200 }} />
          </div>
        ))}
      </div>
    </div>
  );

  // 4. Render Logic: Nếu đang fetching hoặc chưa có user thì hiện Skeleton
  if (fetching || !user) {
    return (
      <>
        {contextHolder}
        <ProfileSkeleton />
      </>
    );
  }

  return (
    <div className='container-main max-w-2xl flex flex-col mx-auto mt-10 p-6'>
      {contextHolder}
      <h1 className='text-3xl font-bold text-[#2e2e2e] mb-6 text-center'>
        Hồ sơ người dùng
      </h1>

      {/* ================= AVATAR ================= */}
      <div className='flex flex-col items-center gap-3 mb-8'>
        <label className='relative cursor-pointer group'>
          <img
            src={user.avatar || '/avatar-default.png'}
            alt='avatar'
            className='w-28 h-28 rounded-full object-cover border'
          />

          <div className='absolute inset-0 bg-black/40 rounded-full flex items-center justify-center text-white text-sm opacity-0 group-hover:opacity-100 transition'>
            Đổi ảnh
          </div>

          <input
            type='file'
            accept='image/*'
            hidden
            onChange={handleAvatarChange}
          />
        </label>

        {loading && (
          <span className='text-sm text-gray-500'>Đang cập nhật...</span>
        )}
      </div>

      <div className='space-y-4'>
        {/* NAME */}
        <ProfileEditableRow
          label='Họ tên'
          value={user.name}
          editing={editing.name}
          draft={draft.name}
          onEdit={() => setEditing({ ...editing, name: true })}
          onCancel={() => {
            setEditing({ ...editing, name: false });
            setDraft({ ...draft, name: user.name || '' });
          }}
          onChange={(v) => setDraft({ ...draft, name: v })}
          onSave={() => handleUpdateField('name')}
        />

        {/* EMAIL */}
        <ProfileRow label='Email' value={user.email} />

        {/* PHONE */}
        <ProfileEditableRow
          label='Số điện thoại'
          value={user.phone || 'Chưa có'}
          editing={editing.phone}
          draft={draft.phone}
          onEdit={() => setEditing({ ...editing, phone: true })}
          onCancel={() => {
            setEditing({ ...editing, phone: false });
            setDraft({ ...draft, phone: user.phone || '' });
          }}
          onChange={(v) => setDraft({ ...draft, phone: v })}
          onSave={() => handleUpdateField('phone')}
        />

        {/* ROLE */}
        <ProfileRow
          label='Vai trò'
          value={
            user.role == RoleEnum.Admin
              ? 'Quản trị viên'
              : user.role == RoleEnum.Designer
              ? 'Nhà thiết kế'
              : 'Người dùng'
          }
        />
      </div>
    </div>
  );
}

/* ================= COMPONENTS ================= */

function ProfileRow({ label, value }) {
  return (
    <div className='flex justify-between border-b pb-3'>
      <div className='text-gray-600 font-medium'>{label}</div>
      <div className='text-gray-900 font-semibold text-right'>
        {value || '—'}
      </div>
    </div>
  );
}

function ProfileEditableRow({
  label,
  value,
  editing,
  draft,
  onEdit,
  onCancel,
  onChange,
  onSave,
}) {
  return (
    <div className='flex justify-between border-b pb-3 items-center'>
      <div className='text-gray-600 font-medium'>{label}</div>

      {editing ? (
        <div className='flex gap-2 items-center'>
          <input
            className='border px-2 py-1 rounded text-sm'
            value={draft}
            onChange={(e) => onChange(e.target.value)}
          />
          <button
            className='text-blue-600 text-sm font-medium'
            onClick={onSave}
          >
            Lưu
          </button>
          <button className='text-gray-500 text-sm' onClick={onCancel}>
            Huỷ
          </button>
        </div>
      ) : (
        <div className='flex gap-2 items-center'>
          <span className='font-semibold text-right'>{value || 'Chưa có'}</span>
          <button className='text-blue-600 text-sm' onClick={onEdit}>
            Sửa
          </button>
        </div>
      )}
    </div>
  );
}
