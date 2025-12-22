import { useState, useEffect } from 'react'
import { ImageApi } from '@/api/imageApi'
import { notification } from 'antd'
import { MdClose } from 'react-icons/md'

export default function ImageCreateWithMetadataModal({
  open,
  onClose,
  onSuccess,
}) {
  const [api, contextHolder] = notification.useNotification()

  const [file, setFile] = useState<File | null>(null)
  const [imageRatio, setImageRatio] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)

  const [showAIPrompt, setShowAIPrompt] = useState(false)
  const [aiPrompt, setAIPrompt] = useState('')
  const [aiLoading, setAILoading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const DEFAULT_KEYS = [
    'tieu_de',
    'tac_gia',
    'chieu_dai',
    'chieu_rong',
    'chat_lieu',
    'nam_sang_tac',
    'kich_thuoc_trong_khong_gian',
  ]

  const [metadata, setMetadata] = useState({
    rawKeys: {
      tieu_de: 'Tiêu đề',
      tac_gia: 'Tác giả',
      chieu_dai: 'Chiều ngang (cm)',
      chieu_rong: 'Chiều dọc (cm)',
      chat_lieu: 'Chất liệu',
      nam_sang_tac: 'Năm sáng tác',
    },
    values: {
      tieu_de: '',
      tac_gia: '',
      chieu_dai: '',
      chieu_rong: '',
      chat_lieu: '',
      nam_sang_tac: '',
    },
  })

  const normalizeKey = (str: string) =>
    str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '')

  const addField = () => {
    const key = 'thuoc_tinh_' + Date.now()
    setMetadata((prev) => ({
      rawKeys: { ...prev.rawKeys, [key]: 'Thuộc tính mới' },
      values: { ...prev.values, [key]: '' },
    }))
  }

  const handleGenerateAI = async () => {
  if (!file) {
    api.error({
      message: 'Chưa có ảnh',
      description: 'Vui lòng chọn ảnh trước khi dùng AI.',
    })
    return
  }

  if (!aiPrompt.trim()) {
    api.error({
      message: 'Thiếu prompt',
      description: 'Vui lòng nhập prompt cho AI.',
    })
    return
  }

  setAILoading(true)

  try {
    const formData = new FormData()
    formData.append('image', file)
    formData.append('prompt', aiPrompt)

    const res = await fetch(
      'https://zipppier-henry-bananas.ngrok-free.dev/custom_describe',
      {
        method: 'POST',
        headers: {
          'ngrok-skip-browser-warning': 'true',
        },
        body: formData,
      }
    )

    const data = await res.json()

    if (!data?.result) {
      throw new Error('AI không trả về kết quả')
    }

    // ✅ AUTO FILL VÀO METADATA
    setMetadata((prev) => ({
      rawKeys: {
        ...prev.rawKeys,
        mo_ta: 'Mô tả',
      },
      values: {
        ...prev.values,
        mo_ta: data.result,
      },
    }))

    api.success({
      message: 'AI hoàn tất',
      description: 'Đã tạo mô tả từ ảnh.',
    })

    setShowAIPrompt(false)
    setAIPrompt('')
  } catch (err) {
    api.error({
      message: 'Lỗi AI',
      description: 'Không thể tạo mô tả bằng AI Gateway.',
    })
  } finally {
    setAILoading(false)
  }
}

  const handleSave = async () => {
    if (!file) {
      api.error({
        message: 'Thiếu ảnh',
        description: 'Bạn cần chọn ảnh để tải lên.',
      })
      return
    }

    if (loading) return
    setLoading(true)

    try {
      const cd = Number(metadata.values.chieu_dai)
      const cr = Number(metadata.values.chieu_rong)

      let kichThuoc = ''

      if (cd > 0 && cr > 0) {
        kichThuoc = `${cd} x ${cr}`
      } else {
        if (!imageRatio) {
          api.error({
            message: 'Lỗi',
            description: 'Không lấy được tỉ lệ ảnh.',
          })
          setLoading(false)
          return
        }
        const autoCR = 100
        const autoCD = Math.round(100 * imageRatio)
        kichThuoc = `${autoCD} x ${autoCR}`
      }

      const finalMeta: Record<string, any> = {}

      Object.entries(metadata.rawKeys).forEach(([key, label]) => {
        const finalKey = DEFAULT_KEYS.includes(key)
          ? key
          : normalizeKey(label)
        finalMeta[finalKey] = metadata.values[key]
      })

      finalMeta.kich_thuoc_trong_khong_gian = kichThuoc

      // 1️⃣ TẠO ẢNH (CHỈ UPLOAD FILE)
      const created = await ImageApi.create({
        title: finalMeta.tieu_de || 'Tranh không tên',
        file,
      })

      // 2️⃣ PATCH METADATA VÀO ID VỪA TẠO
      await ImageApi.updateMetadata(created.id, {
        metadata: finalMeta,
      })

      api.success({
        message: 'Thành công',
        description: 'Tạo tranh mới kèm metadata thành công.',
      })

      onSuccess?.()
      onClose()
    } catch (err: any) {
      if (err?.response?.status === 444) {
        api.error({
          message: 'Không thể tải ảnh',
          description: 'Ảnh này vi phạm chính sách của chúng tôi (ảnh nhạy cảm).',
        })
        return
      }

      api.error({
        message: 'Lỗi',
        description: err?.response?.data?.message 
          || err?.message 
          || 'Không thể tạo tranh.',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!open && previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
  }, [open])
  if (!open) {
  return null
}
  return (
    <>
      {contextHolder}
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
        <div className="bg-white w-[520px] p-6 relative shadow-lg">
          {/* ===== LOADING OVERLAY ===== */}
          {loading && (
            <div className="absolute inset-0 z-20 bg-white/70 flex flex-col items-center justify-center">
              <span className="w-8 h-8 border-4 border-gray-400 border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-sm text-gray-600">Đang xử lý…</p>
            </div>
          )}

          {/* CLOSE */}
          <button
            className="absolute right-3 top-3 text-gray-600 hover:text-black"
            onClick={onClose}
          >
            <MdClose size={22} />
          </button>

          <h2 className="text-xl font-bold mb-4 text-[#2e2e2e] uppercase">
            Tạo tranh mới
          </h2>

          {/* FILE */}
          <label className="font-medium">Chọn ảnh</label>
          <input
  type="file"
  accept="image/*"
  className="w-full border px-3 py-2 mt-1 mb-4"
  onChange={(e) => {
    const f = e.target.files?.[0]
    if (!f) return

    setFile(f)

    // 👉 preview ảnh
    const url = URL.createObjectURL(f)
    setPreviewUrl(url)

    // 👉 lấy tỉ lệ ảnh
    const img = new Image()
    img.onload = () =>
      setImageRatio(img.naturalWidth / img.naturalHeight)
    img.src = url
  }}
/>

{previewUrl && (
  <div className="mb-4 border rounded overflow-hidden">
    <img
      src={previewUrl}
      alt="Preview"
      className="w-full max-h-[300px] object-contain bg-gray-100"
    />
  </div>
)}

          {/* METADATA */}
          <div className="space-y-3 max-h-[300px] overflow-auto border-t pt-4">
            {Object.keys(metadata.rawKeys).map((k) => (
              <div key={k} className="flex gap-3 items-center">
                <input
                  className="w-1/3 border px-2 py-1"
                  value={metadata.rawKeys[k]}
                  onChange={(e) =>
                    setMetadata((prev) => ({
                      rawKeys: { ...prev.rawKeys, [k]: e.target.value },
                      values: prev.values,
                    }))
                  }
                />
                <input
                  className="flex-1 border px-2 py-1"
                  type={
                    ['chieu_dai', 'chieu_rong'].includes(k)
                      ? 'number'
                      : 'text'
                  }
                  value={metadata.values[k]}
                  onChange={(e) =>
                    setMetadata((prev) => ({
                      rawKeys: prev.rawKeys,
                      values: { ...prev.values, [k]: e.target.value },
                    }))
                  }
                />
                {!DEFAULT_KEYS.includes(k) && (
                  <button
                    className="px-2 bg-red-500 text-white"
                    onClick={() =>
                      setMetadata((prev) => {
                        const r = { ...prev.rawKeys }
                        const v = { ...prev.values }
                        delete r[k]
                        delete v[k]
                        return { rawKeys: r, values: v }
                      })
                    }
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>

          <button
            className="secondary-button mt-3"
            onClick={addField}
          >
            + Thêm thuộc tính
          </button>

          {/* ===== AI DESCRIPTION ===== */}
<div className="mt-4 border-t pt-4">
  {!showAIPrompt ? (
    <button
      className="secondary-button"
      onClick={() => setShowAIPrompt(true)}
      disabled={!file}
    >
      ✨ Tạo mô tả bằng AI
    </button>
  ) : (
    <div className="space-y-2">
      <textarea
        className="w-full border px-3 py-2 text-sm"
        rows={3}
        placeholder="Nhập prompt cho AI (ví dụ: mô tả triển lãm, mỹ thuật, cảm xúc...)"
        value={aiPrompt}
        onChange={(e) => setAIPrompt(e.target.value)}
      />

      <div className="flex gap-2">
        <button
          className="primary-button"
          disabled={aiLoading}
          onClick={handleGenerateAI}
        >
          {aiLoading ? 'AI đang xử lý…' : 'Tạo mô tả'}
        </button>
        <button
          className="secondary-button"
          onClick={() => {
            setShowAIPrompt(false)
            setAIPrompt('')
          }}
        >
          Hủy
        </button>
      </div>
    </div>
  )}
</div>

          {/* ACTION */}
          <div className="flex justify-end gap-3 mt-6">
            <button className="secondary-button" onClick={onClose}>
              Hủy
            </button>
            <button
              className="primary-button"
              onClick={handleSave}
              disabled={loading}
            >
              {loading ? 'Đang lưu...' : 'Lưu'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
