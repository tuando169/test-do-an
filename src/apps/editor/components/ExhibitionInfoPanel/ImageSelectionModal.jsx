import { useState, useMemo } from 'react'
import MetadataCreateModal from '@/components/MetadataCreateModal'
import './ImageSelectionModal.css'

export default function ImageSelectionModal({
  visible,
  onClose,
  onSelectImage,
  images = [],
  pagination,
  setPage
}) {
  // Hooks MUST ALWAYS RUN
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)

  // Modal hidden style
  const hiddenStyle = visible ? {} : { display: "none" }

  // Filter only current page images
  const filteredImages = useMemo(() => {
    const s = searchTerm.toLowerCase()
    return images.filter(img => {
      const t = img.metadata?.tieu_de || img.title || ''
      const a = img.metadata?.tac_gia || ''
      return (
        t.toLowerCase().includes(s) ||
        a.toLowerCase().includes(s)
      )
    })
  }, [images, searchTerm])

  const handleImageSelect = (img) => {
    onSelectImage(img)
    console.log(img);
  }

  return (
    <>
      <div 
        className="image-selection-overlay" 
        style={hiddenStyle} 
        onClick={onClose}
      >
        <div className="image-selection-modal" onClick={e => e.stopPropagation()}>
          
          <div className="modal-header">
            <h3>Chọn Hình Ảnh</h3>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>

          <div className="modal-controls">
            <input
              type="text"
              placeholder="Tìm kiếm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />

            <button 
              className="create-new-btn"
              onClick={() => setShowCreateModal(true)}
            >
              + Thêm
            </button>
          </div>

          <div className="modal-content">
            {filteredImages.length === 0 ? (
              <div className="empty-state">Không có hình ảnh</div>
            ) : (
              <div className="images-grid">
                {filteredImages.map(img => {
                  const isVideo = /\.(mp4|webm|mov)$/i.test(img.file_url)
                  const title = img.metadata?.tieu_de || img.title

                  return (
                    <div 
                      key={img.id}
                      className="image-item"
                      onClick={() => handleImageSelect(img)}
                    >
                      <div className="image-preview2">
                        {isVideo
                          ? <video src={img.file_url} muted preload="metadata"/>
                          : <img src={img.metadata?.thumbnail ? `${img.metadata.thumbnail}&width=160` : img.file_url} alt={title}/>
                        }
                      </div>
                      <div className="image-info">{img.metadata?.tieu_de}</div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* ========== PAGINATION ========== */}
          {pagination && (
            <div className="toolbox-pagination">
              <button
                disabled={!pagination.has_prev}
                className={`pagination-btn ${pagination.has_prev ? '' : 'disabled'}`}
                onClick={() => setPage(prev => Math.max(prev - 1, 1))}
              >
                ◀ Trước
              </button>

              <span className="pagination-info">
                Trang {pagination.page} / {pagination.total_pages}
              </span>

              <button
                disabled={!pagination.has_next}
                className={`pagination-btn ${pagination.has_next ? '' : 'disabled'}`}
                onClick={() => setPage(prev => prev + 1)}
              >
                Tiếp ▶
              </button>
            </div>
          )}

        </div>
      </div>

      <MetadataCreateModal
        show={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => setShowCreateModal(false)}
      />
    </>
  )
}
