import './ExhibitionInfoPanel.css'
import './ImageSelectionModal.css'
import { useState, useRef, useEffect } from 'react'
import ImageSelectionModal from './ImageSelectionModal'
import { 
  Bold, 
  Italic, 
  Underline, 
  Strikethrough, 
  Palette, 
  Type, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  List, 
  ListOrdered, 
  Link, 
  Image,
  Save,
  X,
  Edit
} from 'lucide-react'

export default function ExhibitionInfoPanel({
  visible,
  exhibition,
  mode = 'view',
  onClose,
  onUpdateDescription,
  images = [],
  pagination,
  setPage
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [showImageSelection, setShowImageSelection] = useState(false)
  const [enlargedImage, setEnlargedImage] = useState(null)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [showSizeDropdown, setShowSizeDropdown] = useState(false)
  const [showLinkInput, setShowLinkInput] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [linkText, setLinkText] = useState('')
  const editorRef = useRef(null)

  // Init edit text
  useEffect(() => {
    if (visible && exhibition) {
      setEditText(exhibition.description || '')
    }
  }, [visible, exhibition])

  // Auto-resize and handle click outside
  useEffect(() => {
    // Close dropdowns when clicking outside
    const handleClickOutside = (event) => {
      if (!event.target.closest('.format-control')) {
        setShowColorPicker(false)
        setShowSizeDropdown(false)
        setShowLinkInput(false)
      }
    }
    
    if (showColorPicker || showSizeDropdown || showLinkInput) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showColorPicker, showSizeDropdown, showLinkInput])

  if (!visible || !exhibition) return null

  const handleStartEdit = () => {
    setIsEditing(true)
    setTimeout(() => {
      if (editorRef.current) {
        editorRef.current.focus()
        // Set initial content
        const processedHtml = processContentForEditing(editText)
        editorRef.current.innerHTML = processedHtml
      }
    }, 0)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setShowColorPicker(false)
    setShowSizeDropdown(false)
    setShowLinkInput(false)
    setLinkUrl('')
    setLinkText('')
    setEditText(exhibition.description || '')
  }

  const handleSaveEdit = async () => {
    try {
      setIsSaving(true)
      const content = editorRef.current?.innerHTML || ''
      await onUpdateDescription(content.trim())
      setIsEditing(false)
      setShowColorPicker(false)
      setShowSizeDropdown(false)
      setShowLinkInput(false)
      setLinkUrl('')
      setLinkText('')
    } catch (err) {
      console.error(err)
    } finally {
      setIsSaving(false)
    }
  }

  const insertImageCode = (imageHtml) => {
    if (!editorRef.current) return
    
    editorRef.current.focus()
    const selection = window.getSelection()
    
    if (selection.rangeCount === 0) return
    
    const range = selection.getRangeAt(0)
    
    // Create image element
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = imageHtml
    const imgElement = tempDiv.firstChild
    
    range.insertNode(imgElement)
    
    // Move cursor after the image
    range.setStartAfter(imgElement)
    range.setEndAfter(imgElement)
    selection.removeAllRanges()
    selection.addRange(range)
  }

  const handleImageSelect = (image) => {
    insertImageCode(`<img src="${image.file_url}" alt="" class="description-image" />`)
    setShowImageSelection(false)
  }

  const processContentForEditing = (content) => {
    if (!content) return '<p><br></p>'
    
    // Convert [IMG:url] syntax to HTML img tags for editing
    let processed = content.replace(/\[IMG:(.*?)\]/g, '<img src="$1" alt="" class="description-image" />')
    
    // If content doesn't have HTML structure, wrap in paragraphs
    if (!processed.includes('<') || !processed.match(/<(p|div|ul|ol|h[1-6])/)) {
      const lines = processed.split('\n').filter(line => line.trim())
      if (lines.length === 0) return '<p><br></p>'
      processed = lines.map(line => `<p>${line}</p>`).join('')
    }
    
    return processed
  }

  const insertTextFormat = (htmlTag, attributes = '') => {
    if (!editorRef.current) return
    
    editorRef.current.focus()
    const selection = window.getSelection()
    
    if (selection.rangeCount === 0) return
    
    const range = selection.getRangeAt(0)
    const selectedText = range.toString()
    
    // Create the HTML element
    const element = document.createElement(htmlTag)
    if (attributes) {
      const attrMatch = attributes.match(/([^=]+)="([^"]+)"/)
      if (attrMatch) {
        element.setAttribute(attrMatch[1], attrMatch[2])
      }
    }
    
    if (selectedText) {
      // Wrap selected content
      element.textContent = selectedText
      range.deleteContents()
      range.insertNode(element)
    } else {
      // Insert empty formatted element
      element.innerHTML = '&nbsp;'
      range.insertNode(element)
      // Position cursor inside the element
      range.setStart(element.firstChild, 1)
      range.setEnd(element.firstChild, 1)
    }
    
    selection.removeAllRanges()
    selection.addRange(range)
  }

  const insertLink = () => {
    if (!editorRef.current) return
    
    const selection = window.getSelection()
    if (selection.rangeCount === 0) return
    
    const selectedText = selection.toString()
    
    setLinkText(selectedText)
    setLinkUrl('')
    setShowLinkInput(true)
    setShowColorPicker(false)
    setShowSizeDropdown(false)
  }

  const applyLink = () => {
    if (linkUrl.trim() && editorRef.current) {
      const displayText = linkText.trim() || linkUrl
      
      editorRef.current.focus()
      const selection = window.getSelection()
      
      if (selection.rangeCount === 0) return
      
      const range = selection.getRangeAt(0)
      
      const linkElement = document.createElement('a')
      linkElement.href = linkUrl
      linkElement.target = '_blank'
      linkElement.rel = 'noopener noreferrer'
      linkElement.textContent = displayText
      
      range.deleteContents()
      range.insertNode(linkElement)
      
      setShowLinkInput(false)
      setLinkUrl('')
      setLinkText('')
    }
  }

  const applyColor = (color) => {
    insertTextFormat('span', `style="color: ${color}"`)
    setShowColorPicker(false)
  }

  const applySize = (size) => {
    insertTextFormat('span', `style="font-size: ${size}"`)
    setShowSizeDropdown(false)
  }

  const insertList = (listType) => {
    if (!editorRef.current) return
    
    editorRef.current.focus()
    const selection = window.getSelection()
    
    if (selection.rangeCount === 0) return
    
    const range = selection.getRangeAt(0)
    const selectedText = range.toString()
    
    const listElement = document.createElement(listType)
    
    if (selectedText) {
      const items = selectedText.split('\n').filter(item => item.trim())
      items.forEach(item => {
        const li = document.createElement('li')
        li.textContent = item.trim()
        listElement.appendChild(li)
      })
    } else {
      // Create empty list with one item
      const li = document.createElement('li')
      li.innerHTML = '&nbsp;'
      listElement.appendChild(li)
    }
    
    range.deleteContents()
    range.insertNode(listElement)
    
    // Position cursor in first list item
    const firstLi = listElement.querySelector('li')
    if (firstLi) {
      range.setStart(firstLi.firstChild, 1)
      range.setEnd(firstLi.firstChild, 1)
      selection.removeAllRanges()
      selection.addRange(range)
    }
  }

  const renderDescription = (text) => {
    if (!text) return null

    // Simple HTML sanitization to prevent XSS
    const sanitizeHtml = (html) => {
      // Allow safe HTML tags
      const allowedTags = ['p', 'strong', 'em', 'u', 's', 'span', 'div', 'ul', 'ol', 'li', 'a', 'br']
      const allowedAttributes = ['style', 'href', 'target', 'rel']
      
      // Basic sanitization - in production, consider using DOMPurify
      let sanitized = html
      
      // Remove script tags and other potentially dangerous elements
      sanitized = sanitized.replace(/<script[^>]*>.*?<\/script>/gi, '')
      sanitized = sanitized.replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
      sanitized = sanitized.replace(/on\w+="[^"]*"/gi, '') // Remove event handlers
      
      return sanitized
    }

    // Process the text to handle images and convert to proper HTML structure
    const processContent = (content) => {
      const lines = content.split('\n')
      const processedLines = []
      
      for (let line of lines) {
        // Check for image syntax
        const imgMatch = line.match(/\[IMG:(.*?)\]/)
        if (imgMatch) {
          const fileUrl = imgMatch[1]
          processedLines.push(`<img src="${fileUrl}" alt="" class="description-image" />`)
        } else if (line.trim()) {
          // Wrap non-empty lines that aren't already HTML in paragraphs
          if (!line.trim().match(/^<(p|div|ul|ol|h[1-6])/)) {
            processedLines.push(`<p>${line}</p>`)
          } else {
            processedLines.push(line)
          }
        } else {
          processedLines.push('<br>')
        }
      }
      
      return processedLines.join('\n')
    }

    const processedHtml = processContent(text)
    const sanitizedHtml = sanitizeHtml(processedHtml)

    return (
      <div 
        dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
        onClick={(e) => {
          // Handle image clicks for enlargement
          if (e.target.tagName === 'IMG' && e.target.classList.contains('description-image')) {
            setEnlargedImage({ url: e.target.src })
          }
        }}
      />
    )
  }

  return (
    <>
      <div className="overlay exhibition-overlay" onClick={onClose}></div>

      <div className="exhibition-info-panel" onClick={(e) => e.stopPropagation()}>
        <div className="panel-header">
          {mode === "edit" && !isEditing && (
            <button className="edit-btn" onClick={handleStartEdit}>
              <Edit size={16} />
            </button>
          )}
          <h2>{exhibition.title}</h2>
          <button className="panel-close-btn" onClick={onClose}>×</button>
        </div>

        <div className="panel-content">
          <div className="description-section">
            <div className="description-header">
            </div>

            <div className="description-content">
              {isEditing ? (
                <div className="editor-container">

                  <div className="editor-toolbar">
                    <div className="toolbar-group">
                      <button 
                        onClick={() => insertTextFormat('strong')} 
                        className="format-btn"
                        title="Bold"
                      >
                        <Bold size={16} />
                      </button>
                      <button 
                        onClick={() => insertTextFormat('em')} 
                        className="format-btn"
                        title="Italic"
                      >
                        <Italic size={16} />
                      </button>
                      <button 
                        onClick={() => insertTextFormat('u')} 
                        className="format-btn"
                        title="Underline"
                      >
                        <Underline size={16} />
                      </button>
                      <button 
                        onClick={() => insertTextFormat('s')} 
                        className="format-btn"
                        title="Strikethrough"
                      >
                        <Strikethrough size={16} />
                      </button>
                    </div>
                    
                    <div className="toolbar-group">
                      <div className="format-control">
                        <button 
                          onClick={() => {
                            setShowColorPicker(!showColorPicker)
                            setShowSizeDropdown(false)
                            setShowLinkInput(false)
                          }} 
                          className={`format-btn color-btn ${showColorPicker ? 'active' : ''}`}
                          title="Text Color"
                        >
                          <Palette size={16} />
                        </button>
                        {showColorPicker && (
                          <div className="color-picker-dropdown">
                            <div className="color-grid">
                              {[
                                // Grayscale
                                '#000000', '#333333', '#666666', '#999999', '#CCCCCC', '#FFFFFF',
                                // Reds
                                '#8B0000', '#DC143C', '#FF0000', '#FF6B6B', '#FF9999', '#FFCCCC',
                                // Oranges & Yellows
                                '#FF8C00', '#FFA500', '#FFD700', '#FFFF00', '#FFFF99', '#FFFFCC',
                                // Greens
                                '#006400', '#32CD32', '#00FF00', '#90EE90', '#98FB98', '#CCFFCC',
                                // Cyans & Blues
                                '#008B8B', '#48D1CC', '#00FFFF', '#87CEEB', '#6495ED', '#0000FF',
                                // Blues & Purples
                                '#000080', '#4169E1', '#8B008B', '#BA55D3', '#FF00FF', '#DDA0DD',
                                // Browns & Special
                                '#8B4513', '#D2691E', '#CD853F', '#DEB887', '#F5DEB3', '#FFF8DC'
                              ].map(color => (
                                <button
                                  key={color}
                                  className="color-option"
                                  style={{ backgroundColor: color }}
                                  onClick={() => applyColor(color)}
                                  title={color}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="format-control">
                        <button 
                          onClick={() => {
                            setShowSizeDropdown(!showSizeDropdown)
                            setShowColorPicker(false)
                            setShowLinkInput(false)
                          }} 
                          className={`format-btn size-btn ${showSizeDropdown ? 'active' : ''}`}
                          title="Font Size"
                        >
                          <Type size={16} />
                        </button>
                        {showSizeDropdown && (
                          <div className="size-dropdown">
                            {[10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48].map(size => (
                              <button
                                key={size}
                                className="size-option"
                                onClick={() => applySize(`${size}px`)}
                              >
                                {size}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="toolbar-group">
                      <button 
                        onClick={() => insertTextFormat('div', 'style="text-align: left"')} 
                        className="format-btn align-btn"
                        title="Align Left"
                      >
                        <AlignLeft size={16} />
                      </button>
                      <button 
                        onClick={() => insertTextFormat('div', 'style="text-align: center"')} 
                        className="format-btn align-btn"
                        title="Align Center"
                      >
                        <AlignCenter size={16} />
                      </button>
                      <button 
                        onClick={() => insertTextFormat('div', 'style="text-align: right"')} 
                        className="format-btn align-btn"
                        title="Align Right"
                      >
                        <AlignRight size={16} />
                      </button>
                    </div>
                    
                    <div className="toolbar-group">
                      <button 
                        onClick={() => insertList('ul')} 
                        className="format-btn list-btn"
                        title="Bullet List"
                      >
                        <List size={16} />
                      </button>
                      <button 
                        onClick={() => insertList('ol')} 
                        className="format-btn list-btn"
                        title="Numbered List"
                      >
                        <ListOrdered size={16} />
                      </button>
                    </div>
                    
                    <div className="toolbar-group">
                      <div className="format-control">
                        <button 
                          onClick={() => {
                            setShowLinkInput(!showLinkInput)
                            setShowColorPicker(false)
                            setShowSizeDropdown(false)
                            if (!showLinkInput) insertLink()
                          }} 
                          className={`format-btn link-btn ${showLinkInput ? 'active' : ''}`}
                          title="Insert Link"
                        >
                          <Link size={16} />
                        </button>
                        {showLinkInput && (
                          <div className="link-input-dropdown">
                            <input
                              type="url"
                              placeholder="URL (https://example.com)"
                              value={linkUrl}
                              onChange={(e) => setLinkUrl(e.target.value)}
                              className="link-url-input"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault()
                                  applyLink()
                                } else if (e.key === 'Escape') {
                                  setShowLinkInput(false)
                                  setLinkUrl('')
                                  setLinkText('')
                                }
                              }}
                            />
                            <input
                              type="text"
                              placeholder="Display text (optional)"
                              value={linkText}
                              onChange={(e) => setLinkText(e.target.value)}
                              className="link-text-input"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault()
                                  applyLink()
                                } else if (e.key === 'Escape') {
                                  setShowLinkInput(false)
                                  setLinkUrl('')
                                  setLinkText('')
                                }
                              }}
                            />
                            <div className="link-actions">
                              <button 
                                onClick={applyLink}
                                className="apply-link-btn"
                                disabled={!linkUrl.trim()}
                              >
                                Apply
                              </button>
                              <button 
                                onClick={() => {
                                  setShowLinkInput(false)
                                  setLinkUrl('')
                                  setLinkText('')
                                }}
                                className="cancel-link-btn"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <button 
                        onClick={() => setShowImageSelection(true)} 
                        className="format-btn image-btn"
                        title="Insert Image"
                      >
                        <Image size={16} />
                      </button>
                    </div>
                  </div>

                  <div 
                    ref={editorRef}
                    contentEditable={true}
                    className="description-live-editor"
                    onInput={(e) => {
                      // Update editText to keep track of content for saving
                      setEditText(e.target.innerHTML)
                    }}
                    onClick={(e) => {
                      // Handle image clicks for enlargement
                      if (e.target.tagName === 'IMG' && e.target.classList.contains('description-image')) {
                        e.preventDefault()
                        setEnlargedImage({ url: e.target.src })
                      }
                    }}
                    suppressContentEditableWarning={true}
                  />

                  <div className="editor-actions">
                    <button 
                      onClick={handleSaveEdit} 
                      disabled={isSaving}
                      className="save-btn"
                    >
                      <Save size={18} />
                      {isSaving ? "Đang Lưu..." : "Lưu"}
                    </button>
                    <button 
                      onClick={handleCancelEdit}
                      className="cancel-btn"
                    >
                      <X size={18} />
                      Hủy
                    </button>
                  </div>

                </div>
              ) : (
                <div className="description-text">
                  {renderDescription(exhibition.description)}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Image enlarge modal */}
      {enlargedImage && (
        <div className="image-modal-overlay" onClick={() => setEnlargedImage(null)}>
          <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="image-modal-close" onClick={() => setEnlargedImage(null)}>×</button>
            <img src={enlargedImage.url} alt={enlargedImage.alt} className="enlarged-image" />
          </div>
        </div>
      )}

      {/* Simple Pagination Image Picker */}
      <ImageSelectionModal
        visible={showImageSelection}
        onClose={() => setShowImageSelection(false)}
        onSelectImage={handleImageSelect}
        images={images}
        pagination={pagination}
        setPage={setPage}
      />
    </>
  )
}
