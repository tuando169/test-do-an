import { useEffect, useState } from 'react';
import { ImageApi } from '@/api/imageApi';
import { notification, Modal as ModalAnt } from 'antd';
import { MdClose } from 'react-icons/md';
import { generateDescriptionFromImage } from '@/api/aiGateWay';

export default function ImageEditModal({ open, image, onClose, onSuccess }) {
  const [api, contextHolder] = notification.useNotification();
  const [loading, setLoading] = useState(false);
  const [showAIPrompt, setShowAIPrompt] = useState(false);
  const [aiPrompt, setAIPrompt] = useState('');
  const [aiLoading, setAILoading] = useState(false);

  const DEFAULT_KEYS = [
    'tieu_de',
    'tac_gia',
    'chieu_dai',
    'chieu_rong',
    'chat_lieu',
    'nam_sang_tac',
    'kich_thuoc_trong_khong_gian',
    'mo_ta',
  ];

  const LABEL_MAP = {
    tieu_de: 'Tiêu đề',
    tac_gia: 'Tác giả',
    chieu_dai: 'Chiều ngang (cm)',
    chieu_rong: 'Chiều dọc (cm)',
    chat_lieu: 'Chất liệu',
    nam_sang_tac: 'Năm sáng tác',
    kich_thuoc_trong_khong_gian: 'Kích thước trong không gian',
    mo_ta: 'Mô tả',
  };

  const [metadata, setMetadata] = useState({ rawKeys: {}, values: {} });

  const normalizeKey = (str) =>
    str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '');

  useEffect(() => {
    if (image) {
      const raw = {};
      const val = {};
      const currentMeta = image.metadata || {};

      Object.entries(currentMeta).forEach(([key, value]) => {
        raw[key] = LABEL_MAP[key] || key;
        val[key] = value;
      });

      setMetadata({ rawKeys: raw, values: val });
    }
  }, [image]);

  if (!open || !image) return null;

  const addField = () => {
    const key = 'thuoc_tinh_' + Date.now();
    setMetadata((prev) => ({
      rawKeys: { ...prev.rawKeys, [key]: 'Thuộc tính mới' },
      values: { ...prev.values, [key]: '' },
    }));
  };

  const handleGenerateAI = async () => {
    if (!aiPrompt.trim()) {
      api.error({
        title: 'Thiếu prompt',
        description: 'Vui lòng nhập prompt cho AI.',
      });
      return;
    }

    setAILoading(true);
    try {
      const description = await generateDescriptionFromImage(
        image.file_url,
        aiPrompt
      );

      setMetadata((prev) => ({
        rawKeys: {
          ...prev.rawKeys,
          mo_ta: 'Mô tả',
        },
        values: {
          ...prev.values,
          mo_ta: description,
        },
      }));

      api.success({
        title: 'AI hoàn tất',
        description: 'Đã tạo mô tả từ ảnh.',
      });

      setShowAIPrompt(false);
      setAIPrompt('');
    } catch {
      api.error({
        title: 'Lỗi AI',
        description: 'Không thể tạo mô tả từ AI Gateway.',
      });
    } finally {
      setAILoading(false);
    }
  };

  const handleSave = async () => {
    if (loading) return;
    setLoading(true);

    try {
      const cd = Number(metadata.values.chieu_dai);
      const cr = Number(metadata.values.chieu_rong);

      let kichThuoc = '';

      if (cd > 0 && cr > 0) {
        kichThuoc = `${cd} x ${cr}`;
      } else {
        const ratio = await new Promise((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => resolve(img.naturalWidth / img.naturalHeight);
          img.onerror = reject;
          img.src = image.file_url;
        });

        const autoCR = 100;
        const autoCD = Math.round(100 * ratio);
        kichThuoc = `${autoCD} x ${autoCR}`;
      }

      const finalMeta = {};

      Object.entries(metadata.rawKeys).forEach(([key, label]) => {
        const finalKey = DEFAULT_KEYS.includes(key) ? key : normalizeKey(label);
        finalMeta[finalKey] = metadata.values[key];
      });

      finalMeta.kich_thuoc_trong_khong_gian = kichThuoc;

      await ImageApi.updateMetadata(image.id, {
        title: finalMeta.tieu_de || image.title,
        metadata: finalMeta,
      });

      api.success({
        title: 'Thành công',
        description: 'Cập nhật thông tin tranh thành công.',
      });

      onSuccess();
      onClose();
    } catch (err) {
      if (err?.response?.status === 444) {
        api.error({
          title: 'Không thể cập nhật',
          description:
            'Ảnh này vi phạm chính sách của chúng tôi (ảnh nhạy cảm).',
        });
        return;
      }

      api.error({
        title: 'Lỗi',
        description:
          err?.response?.data?.message ||
          err?.message ||
          'Không thể cập nhật tranh.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    ModalAnt.confirm({
      title: 'Xóa tranh',
      content: 'Bạn có chắc chắn muốn xóa tranh này?',
      okText: 'Xóa',
      cancelText: 'Hủy',
      okType: 'danger',
      async onOk() {
        await ImageApi.delete(image.id);
        api.success({
          title: 'Đã xóa',
          description: 'Xóa tranh thành công.',
        });
        onSuccess();
        onClose();
      },
    });
  };

  return (
    <>
      {contextHolder}
      <div className='fixed inset-0 bg-black/40 flex items-center justify-center z-50'>
        <div className='bg-white w-[800px] p-6 relative shadow-lg'>
          {loading && (
            <div className='absolute inset-0 z-20 bg-white/70 flex flex-col items-center justify-center'>
              <span className='w-8 h-8 border-4 border-gray-400 border-t-transparent rounded-full animate-spin mb-3' />
              <p className='text-sm text-gray-600'>Đang xử lý…</p>
            </div>
          )}

          <button
            className='absolute right-3 top-3 text-gray-600 hover:text-black'
            onClick={onClose}
          >
            <MdClose size={22} />
          </button>

          <h2 className='text-xl font-bold mb-4 uppercase'>
            Sửa thông tin tranh
          </h2>

          <div className='space-y-3 max-h-[320px] overflow-auto border-t pt-4'>
            {Object.keys(metadata.rawKeys).map((k) => (
              <div key={k} className='flex gap-3 items-start'>
                <input
                  className={`w-1/3 border px-2 py-1 ${
                    k === 'kich_thuoc_trong_khong_gian'
                      ? 'bg-gray-200 cursor-not-allowed'
                      : ''
                  }`}
                  value={metadata.rawKeys[k]}
                  disabled={k === 'kich_thuoc_trong_khong_gian'}
                  onChange={(e) =>
                    setMetadata((prev) => ({
                      rawKeys: { ...prev.rawKeys, [k]: e.target.value },
                      values: prev.values,
                    }))
                  }
                />
                {metadata.rawKeys[k] == 'Mô tả' ? (
                  <textarea
                    className='flex-1 border px-2 py-1'
                    rows={5}
                    value={metadata.values[k]}
                    onChange={(e) =>
                      setMetadata((prev) => ({
                        rawKeys: prev.rawKeys,
                        values: { ...prev.values, [k]: e.target.value },
                      }))
                    }
                  />
                ) : (
                  <input
                    className={`flex-1 border px-2 py-1 ${
                      k === 'kich_thuoc_trong_khong_gian'
                        ? 'bg-gray-200 cursor-not-allowed'
                        : ''
                    }`}
                    value={metadata.values[k]}
                    disabled={k === 'kich_thuoc_trong_khong_gian'}
                    onChange={(e) =>
                      setMetadata((prev) => ({
                        rawKeys: prev.rawKeys,
                        values: { ...prev.values, [k]: e.target.value },
                      }))
                    }
                  />
                )}

                {!DEFAULT_KEYS.includes(k) && (
                  <button
                    className='px-2 bg-red-500 text-white'
                    onClick={() =>
                      setMetadata((prev) => {
                        const r = { ...prev.rawKeys };
                        const v = { ...prev.values };
                        delete r[k];
                        delete v[k];
                        return { rawKeys: r, values: v };
                      })
                    }
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>

          <button className='secondary-button mt-3' onClick={addField}>
            + Thêm thuộc tính
          </button>

          <div className='mt-4 border-t pt-4'>
            {!showAIPrompt ? (
              <button
                className='secondary-button'
                onClick={() => setShowAIPrompt(true)}
              >
                ✨ Tạo mô tả bằng AI
              </button>
            ) : (
              <div className='space-y-2'>
                <textarea
                  className='w-full border px-3 py-2 text-sm'
                  rows={3}
                  placeholder='Nhập prompt cho AI (ví dụ: mô tả học thuật, cảm xúc, mỹ thuật...)'
                  value={aiPrompt}
                  onChange={(e) => setAIPrompt(e.target.value)}
                />

                <div className='flex gap-2'>
                  <button
                    className='primary-button'
                    disabled={aiLoading}
                    onClick={handleGenerateAI}
                  >
                    {aiLoading ? 'AI đang xử lý…' : 'Tạo mô tả'}
                  </button>
                  <button
                    className='secondary-button'
                    onClick={() => {
                      setShowAIPrompt(false);
                      setAIPrompt('');
                    }}
                  >
                    Hủy
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className='flex justify-between gap-3 mt-6'>
            <button
              className='secondary-button bg-red-600 text-black'
              onClick={handleDelete}
            >
              Xóa
            </button>
            <div className='flex gap-3'>
              <button className='secondary-button' onClick={onClose}>
                Đóng
              </button>
              <button
                className='primary-button'
                disabled={loading}
                onClick={handleSave}
              >
                {loading ? 'Đang lưu...' : 'Lưu'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
