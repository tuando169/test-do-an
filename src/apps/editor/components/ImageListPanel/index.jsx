import './ImageListPanel.css'
import { useState, useEffect, useMemo } from 'react'

export default function ImageListPanel({
  visible,
  onClose,
  images = [],
  objects = [],
  onImageClick,
  mode = 'view' // Add mode prop with default value
}) {
  const [searchQuery, setSearchQuery] = useState('')

  // Reset search when panel closes
  useEffect(() => {
    if (!visible) {
      setSearchQuery('')
    }
  }, [visible])

  // Get image objects with position data from the scene
  const imageObjectsInScene = useMemo(() => {
    // Filter for image objects that exist in the scene, but exclude physic planes
    const imageObjs = objects.filter(obj => 
      obj.type === 'image' && 
      obj.src !== '/images/entry.jpg' // Exclude physic planes
    )
    
    // Map image objects to include their metadata from the images array
    return imageObjs.map(obj => {
      // Try multiple ways to match image data
      let imageData = null
      
      // Method 1: Try matching by imageId if it exists
      if (obj.imageId) {
        imageData = images.find(img => img.id === obj.imageId)
      }
      
      // Method 2: Try matching by src URL if imageId doesn't work
      if (!imageData && obj.src) {
        imageData = images.find(img => 
          img.file_url === obj.src || 
          img.src === obj.src ||
          img.file_url === (typeof obj.src === 'string' ? obj.src : obj.src?.file_url)
        )
      }
      
      // Method 3: Try matching by title if available
      if (!imageData && obj.title) {
        imageData = images.find(img => img.title === obj.title)
      }
      
      // Helper function to extract artist from various data structures
      const extractArtist = (imageData, objData) => {
        // Try different ways to find the artist/author
        if (imageData?.description?.tac_gia) {
          return imageData.description.tac_gia;
        }
        if (imageData?.artist) {
          return imageData.artist;
        }
        if (objData?.description?.tac_gia) {
          return objData.description.tac_gia;
        }
        if (objData?.artist) {
          return objData.artist;
        }
        // Try parsing description as JSON if it's a string
        if (typeof imageData?.description === 'string') {
          try {
            const parsed = JSON.parse(imageData.description);
            if (parsed.tac_gia) return parsed.tac_gia;
          } catch (e) {
            // Not JSON, ignore
          }
        }
        if (typeof objData?.description === 'string') {
          try {
            const parsed = JSON.parse(objData.description);
            if (parsed.tac_gia) return parsed.tac_gia;
          } catch (e) {
            // Not JSON, ignore
          }
        }
        return 'Nghệ Sĩ Không Xác Định';
      };
      
      // If no matching data found in images array, create basic info from object itself
      if (!imageData) {
        return {
          id: obj.id,
          imageId: obj.imageId || obj.id,
          src: typeof obj.src === 'string' ? obj.src : (obj.src?.file_url || obj.src?.src),
          title: obj.title || 'Untitled',
          artist: extractArtist(null, obj),
          description: obj.description || '',
          audio: obj.audio || null,
          alt: obj.alt || obj.title || 'Artwork',
          position: obj.position,
          parent: obj.parent
        }
      }
      
      return {
        id: obj.id,
        imageId: obj.imageId || imageData.id,
        src: imageData.file_url || obj.src || imageData.src,
        title: imageData.title || obj.title || 'Untitled',
        artist: extractArtist(imageData, obj),
        description: imageData.description || obj.description,
        audio: imageData.audio || obj.audio,
        alt: imageData.alt || obj.alt || imageData.title || 'Artwork',
        position: obj.position,
        parent: obj.parent
      }
    }).filter(Boolean) // Remove null entries
  }, [objects, images])

  // Filter and sort images alphabetically by title
  const filteredAndSortedImages = useMemo(() => {
    let filtered = imageObjectsInScene

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(img => 
        img.title.toLowerCase().includes(query) ||
        img.artist.toLowerCase().includes(query)
      )
    }

    // Sort alphabetically by title
    return filtered.sort((a, b) => a.title.localeCompare(b.title))
  }, [imageObjectsInScene, searchQuery])

  if (!visible) {
    return null
  }

  const handleImageItemClick = (imageItem) => {
    // Call the same onImageClick function that Scene.jsx uses
    onImageClick({
      id: imageItem.id,
      src: imageItem.src,
      title: imageItem.title,
      alt: imageItem.alt,
      description: imageItem.description,
      audio: imageItem.audio,
      showImageDescription: imageItem.showImageDescription ?? true
    })
    
    // Close the panel after clicking
    onClose()
  }

  return (
    <div className="image-list-overlay" onClick={onClose}>
      <div className={`image-list-panel ${mode === 'edit' ? 'edit-mode' : ''}`} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="image-list-header">
          <h2>Danh Sách Hình Ảnh</h2>
          <button 
            className="image-list-close-btn"
            onClick={onClose}
            title="Đóng"
          >
            ×
          </button>
        </div>

        {/* Search */}
        <div className="image-list-search">
          <input
            type="text"
            placeholder="Tìm kiếm theo tiêu đề hoặc nghệ sĩ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="image-list-search-input"
          />
        </div>

        {/* Image Count */}
        <div className="image-list-count">
          {filteredAndSortedImages.length} hình ảnh{filteredAndSortedImages.length !== 1 ? '' : ''} tìm thấy
        </div>

        {/* Image List */}
        <div className="image-list-content">
          {filteredAndSortedImages.length === 0 ? (
            <div className="image-list-empty">
              {imageObjectsInScene.length === 0 
                ? "Không có hình ảnh trong cảnh"
                : "Không có hình ảnh nào phù hợp với tìm kiếm của bạn"
              }
            </div>
          ) : (
            <div className="image-list-grid">
              {filteredAndSortedImages.map((imageItem) => (
                <div
                  key={imageItem.id}
                  className="image-list-item"
                  onClick={() => handleImageItemClick(imageItem)}
                  title={`Nhấp để xem ${imageItem.title}`}
                >
                  <div className="image-list-item-preview">
                    <img 
                      src={imageItem.src} 
                      alt={imageItem.alt}
                      loading="lazy"
                    />
                  </div>
                  <div className="image-list-item-info">
                    <h3 className="image-list-item-title">{imageItem.title}</h3>
                    <p className="image-list-item-artist">{imageItem.artist}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}