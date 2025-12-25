import { MdClose } from 'react-icons/md';
import { useEffect, useState } from 'react';
import { ImageApi } from '@/api/imageApi';
import { notification, Select } from 'antd';
import { Object3dApi } from '@/api/object3dApi';
import { AudioApi } from '@/api/audioApi';
import { TextureApi } from '@/api/textureApi';

export default function ModalCreateResource({
  isOpen,
  onClose,
  formData,
  tab, // "image" | "object" | "audio" | "texture"
  onSuccess,
}) {
  const [api, contextHolder] = notification.useNotification();
  const defaultForm = {
    title: '',
    file: null,
    alb: null,
    nor: null,
    orm: null,
    texture_for: '',
    id: '',
  };
  const [loading, setLoading] = useState(false);
  const [objectMode, setObjectMode] = useState('upload');

  const [form, setForm] = useState({
    title: '',
    file: null,
    alb: null,
    nor: null,
    orm: null,
    texture_for: '',
    id: '',
  });
  const [generatedObject, setGeneratedObject] = useState(null);
  const [imageSource, setImageSource] = useState(null);

  const [preview, setPreview] = useState('');

  useEffect(() => {
    if (formData) {
      setForm({
        ...defaultForm,
        ...formData,
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setForm((prev) => ({
      ...prev,
      file,
      title: prev.title || file.name.replace(/\.[^/.]+$/, ''),
    }));

    const tempUrl = URL.createObjectURL(file);
    setPreview(tempUrl);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    try {
      setLoading(true);
      if (tab === 'object' && objectMode === 'generate' && generatedObject) {
        form.file = generatedObject;
      }

      if (form.id) {
        await handleUpdate();
      } else {
        await handleCreate();
      }

      onSuccess();
      handleClose();
    } catch (err) {
      if (err?.response?.status === 444) {
        api.error({
          title: 'Lỗi',
          description: 'File không hợp lệ. Vui lòng thử lại với file khác.',
        });
        return;
      }
      if (err?.response?.status === 403) {
        api.error({
          title: 'Lỗi',
          description: 'Bạn cần đăng ký gói trả phí để thêm tài nguyên.',
        });
        return;
      }
      if (err?.response?.status === 429) {
        api.error({
          title: 'Lỗi',
          description:
            'Bạn đã đạt đến giới hạn tải lên của mình. Vui lòng nâng cấp tài khoản.',
        });
        return;
      }
      if (err?.response?.status === 400) {
        api.error({
          title: 'Lỗi',
          description: 'Vui lòng điền đầy đủ thông tin.',
        });
        return;
      }
      api.error({
        title: 'Lỗi',
        description: err?.message || 'Có lỗi xảy ra, vui lòng thử lại',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTextureChange = (type) => (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setForm((prev) => ({
      ...prev,
      [type]: file,
    }));
  };

  function handleClose() {
    setForm({
      title: '',
      file: null,
      alb: null,
      nor: null,
      orm: null,
      texture_for: '',
      id: '',
    });
    setPreview('');
    onClose();
  }

  async function handleGenerateObject() {
    if (!imageSource) {
      api.error({
        title: 'Lỗi',
        description: 'Vui lòng chọn ảnh để tạo Object 3D từ ảnh.',
      });
      return;
    }
    try {
      setLoading(true);
      const object = await Object3dApi.generate(imageSource);
      setGeneratedObject(object);
      console.log(generatedObject);
    } catch (err) {
      api.error({
        title: 'Lỗi',
        description: err?.message || 'Có lỗi xảy ra, vui lòng thử lại',
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (tab === 'image') {
      const res = await ImageApi.create({
        title: form.title,
        file: form.file,
      });
      if (res.status == 444)
        api.error({
          title: 'Lỗi',
          description:
            'File không hợp lệ hoặc quá lớn. Vui lòng thử lại với file khác.',
        });
      return;
    }
    if (tab === 'object') {
      const res = await Object3dApi.create({
        title: form.title,
        file: form.file,
        description: form.description,
      });
      if (res.status == 444)
        api.error({
          title: 'Lỗi',
          description:
            'File không hợp lệ hoặc quá lớn. Vui lòng thử lại với file khác.',
        });
      return;
    }
    if (tab === 'audio') {
      const res = await AudioApi.create({
        title: form.title,
        file: form.file,
        description: form.description,
      });
      if (res.status == 444)
        api.error({
          title: 'Lỗi',
          description:
            'File không hợp lệ hoặc quá lớn. Vui lòng thử lại với file khác.',
        });
      return;
    }
    if (tab === 'texture') {
      const res = await TextureApi.create({
        title: form.title,
        alb: form.alb,
        nor: form.nor,
        orm: form.orm,
        texture_for: form.texture_for,
      });
      if (res.status == 444)
        api.error({
          title: 'Lỗi',
          description:
            'File không hợp lệ hoặc quá lớn. Vui lòng thử lại với file khác.',
        });
    }
  }
  async function handleUpdate() {
    if (tab === 'image') {
      await ImageApi.update(form.id, {
        title: form.title,
        file: form.file,
        description: form.description,
      });
      return;
    }
    if (tab === 'object') {
      await Object3dApi.update(form.id, {
        title: form.title,
        file: form.file,
        description: form.description,
        room_id: form.room_id,
      });
      return;
    }
    if (tab === 'audio') {
      await AudioApi.update(form.id, {
        title: form.title,
        file: form.file,
        description: form.description,
        room_id: form.room_id,
      });
      api.success({
        title: 'Thành công',
        description: 'Tải lên âm thanh mới.',
      });
      return;
    }
    if (tab === 'object') {
      await TextureApi.update(form.id, {
        title: form.title,
        alb: form.alb,
        nor: form.nor,
        orm: form.orm,
        texture_for: form.texture_for,
      });
      return;
    }
    if (tab === 'texture') {
      await TextureApi.update(form.id, {
        title: form.title,
        alb: form.alb,
        nor: form.nor,
        orm: form.orm,
        texture_for: form.texture_for,
      });
    }
  }

  return (
    <>
      {contextHolder}
      <div className='fixed inset-0 bg-black/40 flex items-center justify-center z-50'>
        <div className='bg-white w-[460px] p-6 relative shadow-lg'>
          {/* ===== LOADING OVERLAY ===== */}
          {loading && (
            <div
              className='absolute inset-0 z-20 bg-white/70 
                    flex flex-col items-center justify-center'
            >
              <span className='w-8 h-8 border-4 border-gray-400 border-t-transparent rounded-full animate-spin mb-3' />
              <p className='text-sm text-gray-600'>Đang xử lý…</p>
            </div>
          )}

          {/* Close button */}
          <button
            className='absolute right-3 top-3 text-gray-600 hover:text-black'
            onClick={handleClose}
          >
            <MdClose size={24} />
          </button>

          <div className={loading ? 'opacity-50 pointer-events-none' : ''}>
            <h2 className='text-xl font-bold mb-4 text-[#2e2e2e] uppercase'>
              Thêm{' '}
              {tab === 'image'
                ? 'Ảnh'
                : tab === 'object'
                ? 'Object 3D'
                : tab === 'audio'
                ? 'Âm thanh'
                : 'Texture'}{' '}
              Mới
            </h2>
          </div>

          <form className='flex flex-col gap-4' onSubmit={handleSubmit}>
            <div>
              <label className='font-medium'>Tên</label>
              <input
                type='text'
                required={form.title ? false : true}
                className='w-full border px-3 py-2 mt-1'
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder='Tên hiển thị...'
              />
            </div>

            {form.file_url && (
              <div>
                <label className='font-medium'>Đường dẫn cũ</label>
                <a
                  href={form.file_url}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='truncate block text-blue-600 underline'
                >
                  {form.file_url}
                </a>
              </div>
            )}
            {tab === 'texture' ? (
              <div className='flex flex-col gap-3 overflow-hidden'>
                <div className='grid grid-cols-3'>
                  {form.alb && (
                    <img
                      src={form.id ? form.alb : URL.createObjectURL(form.alb)}
                      className='mt-2 h-20 w-full object-cover border'
                    />
                  )}
                  {form.nor && (
                    <img
                      src={form.id ? form.nor : URL.createObjectURL(form.nor)}
                      className='mt-2 h-20 w-full object-cover border'
                    />
                  )}
                  {form.orm && (
                    <img
                      src={form.id ? form.orm : URL.createObjectURL(form.orm)}
                      className='mt-2 h-20 w-full object-cover border'
                    />
                  )}
                </div>
                <div>
                  <p className='text-sm font-medium mb-1'>Albedo</p>
                  <input
                    type='file'
                    accept='image/*'
                    onChange={handleTextureChange('alb')}
                  />
                </div>

                <div>
                  <p className='text-sm font-medium mb-1'>Normal</p>
                  <input
                    type='file'
                    accept='image/*'
                    onChange={handleTextureChange('nor')}
                  />
                </div>

                <div>
                  <p className='text-sm font-medium mb-1'>ORM</p>
                  <input
                    type='file'
                    accept='image/*'
                    onChange={handleTextureChange('orm')}
                  />
                </div>
                <div>
                  <label className='font-medium'>Dành cho</label>
                  <input
                    type='text'
                    required={form.texture_for ? false : true}
                    className='w-full border px-3 py-2 mt-1'
                    value={form.texture_for}
                    onChange={(e) =>
                      setForm({ ...form, texture_for: e.target.value })
                    }
                    placeholder='Tên hiển thị...'
                  />
                </div>
              </div>
            ) : (
              <div>
                {tab === 'object' && (
                  <div className='flex gap-4 mt-2'>
                    <label className='flex items-center gap-2 cursor-pointer'>
                      <input
                        type='radio'
                        checked={objectMode === 'upload'}
                        onChange={() => setObjectMode('upload')}
                      />
                      <span>Tải file GLB</span>
                    </label>

                    <label className='flex items-center gap-2 cursor-pointer'>
                      <input
                        type='radio'
                        checked={objectMode === 'generate'}
                        onChange={() => setObjectMode('generate')}
                      />
                      <span>Generate 3D từ ảnh</span>
                    </label>
                  </div>
                )}
                {tab === 'object' && objectMode === 'upload' && (
                  <input
                    type='file'
                    accept='.glb'
                    className='w-full py-2 mt-1'
                    onChange={handleFileChange}
                  />
                )}
                {tab !== 'object' && (
                  <input
                    type='file'
                    required={form.file_url ? false : true}
                    accept={
                      tab === 'image'
                        ? 'image/*'
                        : tab === 'object'
                        ? '.glb'
                        : 'audio/*'
                    }
                    className='w-full border px-3 py-2 mt-1'
                    onChange={handleFileChange}
                  />
                )}

                {/* PREVIEW */}
                {tab === 'image' && preview && (
                  <img
                    src={preview}
                    className='w-full h-40 object-cover border mt-3'
                  />
                )}

                {tab === 'audio' && preview && (
                  <audio controls className='mt-3 w-full'>
                    <source src={preview} />
                  </audio>
                )}

                {tab === 'object' && objectMode === 'generate' && (
                  <div>
                    <div className='flex justify-between mt-2 items-center'>
                      <input
                        type='file'
                        accept='image/*'
                        className='w-full'
                        onChange={(e) => setImageSource(e.target.files?.[0])}
                      />

                      <div
                        className='secondary-button text-nowrap'
                        onClick={handleGenerateObject}
                      >
                        {loading ? 'Đang tạo...' : 'Tạo Object 3D'}
                      </div>
                    </div>

                    {generatedObject && (
                      <model-viewer
                        src={URL.createObjectURL(generatedObject)}
                        style={{ width: '100%', height: '200px' }}
                        camera-controls
                        auto-rotate
                      />
                    )}
                  </div>
                )}
              </div>
            )}

            <button
              className='primary-button w-full flex items-center justify-center gap-2'
              type='submit'
              disabled={loading}
            >
              {loading && (
                <span className='w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin' />
              )}
              {loading ? 'Đang xử lý...' : form.id ? 'Cập nhật' : 'Tạo mới'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
