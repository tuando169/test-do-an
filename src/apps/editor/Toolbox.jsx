import { useState, useEffect, useRef } from 'react';
import './Toolbox.css';;
import { MdViewInAr, MdAdd, MdMenu, MdClose, MdVideocam, MdClear, MdDragIndicator } from "react-icons/md";
import { FaLeaf } from "react-icons/fa";

//Input Component
const DraggableAxisInput = ({ label, value, onChange, step = 0.01, suffix = '' }) => {
  const [internalValue, setInternalValue] = useState(value);
  const [editing, setEditing] = useState(false);
  const startX = useRef(0);
  const startValue = useRef(0);

  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  const handleMouseDown = (e) => {
    e.preventDefault();
    startX.current = e.clientX;
    startValue.current = internalValue;

    document.body.style.cursor = 'ew-resize';
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e) => {
    const delta = e.clientX - startX.current;
    const newValue = startValue.current + delta * step;
    setInternalValue(newValue);
    onChange(newValue);
  };

  const handleMouseUp = () => {
    document.body.style.cursor = 'default';
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  const handleDoubleClick = (e) => {
    e.preventDefault();
    setEditing(true);
  }; //Drag to change, double click to edit

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInternalValue(val);

    if (!isNaN(parseFloat(val)) && isFinite(val)) {
      onChange(parseFloat(val));
    }
  };

  const handleInputBlur = () => {
    setEditing(false);
  };

  return (
    <div className="axis-input">
      <span className="axis-label">{label}</span>
      {editing ? (
        <input
          type="text"
          value={internalValue}
          step={step}
          autoFocus
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'v')) {
              e.stopPropagation(); // ngăn sự kiện nổi lên Scene
            }
          }}
        />
      ) : (
        <div
          className="axis-value"
          onMouseDown={handleMouseDown}
          onDoubleClick={handleDoubleClick}
        >
          {typeof internalValue === 'number' ? internalValue.toFixed(2) : 'N/A'} {suffix}
        </div>
      )}
    </div>
  );
};

const ColorInput = ({ value, onChange }) => {
  return (
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="color-input"
      />
  );
};

const Toolbox = ({ onCreateWall, onCreateSpotLight, onCreateImageFrame, images = [], imageFrameList, onImageDragStart, onImageMetaChange, onTempTourIndexChange, onCreateCameraTourMarker, onUpdateTourMarkers, setIsImageEditModalOpen, onAddImage, selectedId, setSelectedId, onTransformChange, objects, skySettings, setSkySettings, groundSettings, setGroundSettings, bloomSettings, setBloomSettings, imageFrame, skySettingMode, setSkySettingMode, groundSettingMode, setGroundSettingMode, wallTextureList, groundTextureList, hdri, setHdri, groundTexture, setGroundTexture, onSceneChange, onSaveScene, currentSceneFile, isEditRoom, setIsEditRoom, onShowTransparentWallsChange, tourMarkers = [], tempTourIndices, setTempTourIndices, uploadedAudioFiles = [], onAddAudio, onRemoveAudio }) => {
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('toolboxActiveTab') || 'objects');
  const [settingActiveWall, setSettingActiveWall] = useState(true);
  const [settingActiveLight, setSettingActiveLight] = useState(true);
  const [settingActiveImage, setSettingActiveImage] = useState(true);
  const [settingActiveSky, setSettingActiveSky] = useState(true);
  const [settingActiveGround, setSettingActiveGround] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false); // Track if the toolbox is collapsed
  const [fileError, setFileError] = useState(''); // Track file upload errors
  const [showTransparentWalls, setShowTransparentWalls] = useState(false); // Track transparent walls visibility

  // Add state for subtabs
  const [activeSubTab, setActiveSubTab] = useState(() => localStorage.getItem('toolboxActiveSubTab') || null);
  
  // Tour management state
  const [tourImages, setTourImages] = useState([]); // Images in the tour table
  const [showImageDropdown, setShowImageDropdown] = useState(false); // Show/hide dropdown
  // tempTourIndices now comes from props
  const [draggedItemId, setDraggedItemId] = useState(null); // Track which item is being dragged
  const [dragOverIndex, setDragOverIndex] = useState(null); // Track which position we're dragging over

  // tempTourIndices and setTempTourIndices now come from props

  // Audio management state
  const [currentPlayingAudio, setCurrentPlayingAudio] = useState(null);
  const audioFileInputRef = useRef(null);
  const currentAudioRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showImageDropdown && !event.target.closest('.tour-dropdown-container')) {
        setShowImageDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showImageDropdown]);

  // Define main tabs structure
  const mainTabs = [
    { id: 'objects', label: 'Create', icon: MdAdd },
    { id: 'object', label: 'Object', icon: MdViewInAr },
    { id: 'settings', label: 'Environment', icon: FaLeaf },
    { id: 'tour', label: 'Tour', icon: MdVideocam },
    { id: 'debug', label: 'Debug', icon: MdMenu }
  ];

  // Define subtabs for each main tab
  const getSubTabs = (mainTabId) => {
    if (mainTabId === 'objects') {
      return [
        { id: 'walls', label: 'Basic' },
        { id: 'images', label: 'Images' },
        { id: 'audio', label: 'Audio' }
      ];
    } else if (mainTabId === 'object') {
      // Object settings - no subtabs needed, content depends on selected object
      return [];
    } else if (mainTabId === 'settings') {
      return [
        { id: 'sky', label: 'Sky' },
        { id: 'ground', label: 'Ground' },
        { id: 'bloom', label: 'Bloom' }
      ];
    } else if (mainTabId === 'debug') {
      return [
        { id: 'scenes', label: 'Scenes' },
        { id: 'settings', label: 'Settings' }
      ];
    }
    return [];
  };

  // Update activeSubTab when activeTab changes
  useEffect(() => {
    const subTabs = getSubTabs(activeTab);

    if (subTabs.length > 0) {
      // chỉ set lại nếu activeSubTab hiện tại không thuộc nhóm subTabs của tab mới
      if (!activeSubTab || !subTabs.some(s => s.id === activeSubTab)) {
        setActiveSubTab(subTabs[0].id);
      }
    } else {
      setActiveSubTab(null);
    }
  }, [activeTab]);

  // Render functions for different content areas
  const renderObjectsContent = () => {
    if (activeSubTab === 'walls') {
      return renderWallTools();
    } else if (activeSubTab === 'images') {
      return renderImageTools();
    } else if (activeSubTab === 'audio') {
      return renderAudioTools();
    }
    return null;
  };

  const renderSettingsContent = () => {
    // Environment tab always shows environment settings
    if (activeSubTab === 'sky') {
      return renderSkySettings();
    } else if (activeSubTab === 'ground') {
      return renderGroundSettings();
    } else if (activeSubTab === 'bloom') {
      return renderBloomSettings();
    }
    return null;
  };

  const renderObjectContent = () => {
    // Object tab shows selected object settings
    return renderObjectSettings();
  };

  const renderDebugContent = () => {
    if (activeSubTab === 'scenes') {
      return renderSceneSelector();
    } else if (activeSubTab === 'settings') {
      return renderDebugSettings();
    }
    return null;
  };

  const renderTourContent = () => {
    return renderTourManagement();
  };

  const renderTourManagement = () => {
    // Get image objects from the objects array that are unindexed or in tour
    const imageObjects = objects.filter(obj => obj.type === 'image');
    
    // Get images that are not in the active tour (excluding inactive markers with index -1)
    const unindexedImages = imageObjects.filter(img => {
      // Check if this image is in the temporary tour indices with an active index (>= 0)
      const tourIndex = tempTourIndices.get(img.id);
      // Only exclude if the image has an active tour index (>= 0)
      // Images with index -1 (inactive markers) should be available for adding to tour
      return tourIndex === undefined || tourIndex === -1;
    });
    
    // Build tour items from temporary indices (including both images and camera markers)
    // Filter out inactive markers (index -1) from tour sequence display
    const tourItemsFromTemp = Array.from(tempTourIndices.entries())
      .filter(([itemId, index]) => index !== -1) // Exclude inactive markers
      .sort((a, b) => a[1] - b[1]) // Sort by index
      .map(([itemId, index]) => {
        // Try to find image first
        const imageObj = imageObjects.find(img => img.id === itemId);
        if (imageObj) {
          return { ...imageObj, tourIndex: index, itemType: 'image', itemId: itemId };
        }
        
        // Try to find camera marker
        const cameraMarker = tourMarkers.find(m => {
          if (m.type === 'camera') {
            // Check both new itemId format and legacy id-based format
            return (m.itemId === itemId) || (m.id === `tourmarker-${itemId}`);
          }
          return false;
        });
        if (cameraMarker) {
          return { ...cameraMarker, tourIndex: index, itemType: 'camera', itemId: itemId };
        }
        
        return null;
      })
      .filter(Boolean);
    
    const handleAddImageToTour = (image) => {
      // Calculate new index by counting only active tour items (index >= 0)
      const activeTourItems = Array.from(tempTourIndices.values()).filter(index => index >= 0);
      const newIndex = activeTourItems.length;
      
      const newTempIndices = new Map(tempTourIndices);
      newTempIndices.set(image.id, newIndex);
      setTempTourIndices(newTempIndices);
      setShowImageDropdown(false);
      
      // Check if this image has an inactive marker reference (index -1) and reassign it
      const existingMarker = tourMarkers.find(marker => 
        marker.imageId === image.id && marker.index === -1
      );
      
      if (existingMarker && onUpdateTourMarkers) {
        // Update the marker's index from -1 to the new tour position
        const updatedTourMarkers = tourMarkers.map(marker => 
          marker.imageId === image.id && marker.index === -1
            ? { ...marker, index: newIndex }
            : marker
        );
        onUpdateTourMarkers(updatedTourMarkers);
      }
      
      // Notify parent component of temporary change
      if (onTempTourIndexChange) {
        onTempTourIndexChange(image.id, newIndex);
      }
    };

    const handleRemoveFromTour = (itemId) => {
      const newTempIndices = new Map(tempTourIndices);
      const removedIndex = newTempIndices.get(itemId);
      
      // Check if this item is an image with audio
      const itemToRemove = tourItemsFromTemp.find(item => item.itemId === itemId);
      const hasAudio = tourMarkers.find(marker => 
        marker.imageId === itemId && marker.audio
      );
      
      if (itemToRemove && itemToRemove.itemType === 'image' && hasAudio) {
        // For images with audio, set to inactive (index -1) instead of removing completely
        newTempIndices.set(itemId, -1);
        
        // Update the tour marker to inactive status
        if (onUpdateTourMarkers) {
          const updatedTourMarkers = tourMarkers.map(marker => 
            marker.imageId === itemId 
              ? { ...marker, index: -1 }
              : marker
          );
          onUpdateTourMarkers(updatedTourMarkers);
        }
      } else {
        // For camera markers or images without audio, remove completely
        newTempIndices.delete(itemId);
        
        // For camera markers, also remove from tourMarkers array immediately
        if (itemToRemove && itemToRemove.itemType === 'camera') {
          // Remove from parent tourMarkers state
          const markerId = `tourmarker-${itemId}`;
          const updatedTourMarkers = tourMarkers.filter(marker => marker.id !== markerId);
          
          // Update the tourMarkers state in parent using callback
          if (onUpdateTourMarkers) {
            onUpdateTourMarkers(updatedTourMarkers);
          }
        }
      }
      
      // Reorder remaining indices to fill the gap (exclude inactive markers)
      const reorderedIndices = new Map();
      let currentIndex = 0;
      
      Array.from(newTempIndices.entries())
        .filter(([id, index]) => index !== -1) // Exclude inactive markers from reordering
        .sort((a, b) => a[1] - b[1])
        .forEach(([id]) => {
          reorderedIndices.set(id, currentIndex++);
        });
      
      // Add back inactive markers with index -1
      Array.from(newTempIndices.entries())
        .filter(([id, index]) => index === -1)
        .forEach(([id]) => {
          reorderedIndices.set(id, -1);
        });
      
      setTempTourIndices(reorderedIndices);
      
      // Notify parent component of temporary changes
      if (onTempTourIndexChange) {
        if (hasAudio && itemToRemove && itemToRemove.itemType === 'image') {
          // Set to inactive instead of removing
          onTempTourIndexChange(itemId, -1);
        } else {
          // Remove completely
          onTempTourIndexChange(itemId, -1);
        }
        // Update indices for remaining active items
        reorderedIndices.forEach((index, id) => {
          if (index !== -1) { // Only update active items
            onTempTourIndexChange(id, index);
          }
        });
      }
    };

    const handleDragStart = (e, itemId, index) => {
      console.log('Drag start:', itemId, index); // Debug log
      e.dataTransfer.setData('text/plain', JSON.stringify({ itemId, index }));
      e.dataTransfer.effectAllowed = 'move';
      setDraggedItemId(itemId);
    };

    const handleDragOver = (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    };

    const handleDragEnter = (e, index) => {
      e.preventDefault();
      setDragOverIndex(index);
    };

    const handleDragLeave = (e) => {
      // Only clear if we're leaving the container entirely
      if (!e.currentTarget.contains(e.relatedTarget)) {
        setDragOverIndex(null);
      }
    };

    const handleDragEnd = (e) => {
      // Clear all drag states when drag operation ends
      setDraggedItemId(null);
      setDragOverIndex(null);
      console.log('Drag ended'); // Debug log
    };

    const handleDrop = (e, targetIndex) => {
      e.preventDefault();
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
      const { itemId, index: sourceIndex } = data;
      
      if (sourceIndex === targetIndex) return;
      
      // Get all tour items sorted by current index
      const sortedEntries = Array.from(tempTourIndices.entries())
        .sort((a, b) => a[1] - b[1]);
      
      // Find the dragged item
      const draggedEntry = sortedEntries.find(([id]) => id === itemId);
      if (!draggedEntry) return;
      
      // Remove the dragged item from its current position
      const filteredEntries = sortedEntries.filter(([id]) => id !== itemId);
      
      // Adjust target index if we're moving down (since we removed an item above)
      // If target index equals array length, we're dropping at the end
      let adjustedTargetIndex;
      if (targetIndex >= sortedEntries.length) {
        // Dropping at the end
        adjustedTargetIndex = filteredEntries.length;
      } else {
        adjustedTargetIndex = sourceIndex < targetIndex ? targetIndex - 1 : targetIndex;
      }
      
      // Insert at the new position
      filteredEntries.splice(adjustedTargetIndex, 0, draggedEntry);
      
      // Create new temp indices map with reassigned indices
      const newTempIndices = new Map();
      filteredEntries.forEach(([id], newIndex) => {
        newTempIndices.set(id, newIndex);
      });
      
      // Update the state
      setTempTourIndices(newTempIndices);
      
      // Notify parent component of all changes
      filteredEntries.forEach(([id], newIndex) => {
        if (onTempTourIndexChange) {
          onTempTourIndexChange(id, newIndex);
        }
      });

      // Clear drag states
      setDraggedItemId(null);
      setDragOverIndex(null);
      console.log('Drop completed'); // Debug log
    };

    return (
      <div>
        <div className='create-title'>
          Tour Management
        </div>
        
        <div className="tour-management-container">
          {/* Tour Images Table */}
          <div className="tour-table-container">
            {/* Table Header */}
            <div className="tour-table-header">
              Tour Sequence
            </div>
            
            {/* Table Content */}
            <div className="tour-table-content">
              {tourItemsFromTemp.length === 0 ? (
                <div className="tour-empty-message">
                  No images in tour sequence
                </div>
              ) : (
                tourItemsFromTemp.map((item, index) => (
                  <div 
                    key={`${item.id}-${index}`} 
                    className={`tour-item ${draggedItemId === item.itemId ? 'dragging' : ''} ${dragOverIndex === index ? 'drag-over' : ''} tour-item-container`}
                    onDragOver={handleDragOver}
                    onDragEnter={(e) => handleDragEnter(e, index)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => {
                      handleDrop(e, index);
                    }}
                  >
                    {/* Drag Indicator */}
                    <div
                      className="drag-handle tour-drag-handle"
                      draggable
                      onDragStart={(e) => {
                        handleDragStart(e, item.itemId, index);
                      }}
                      onDragEnd={handleDragEnd}
                    >
                      <MdDragIndicator className="tour-drag-icon" />
                    </div>
                    
                    <span className="tour-item-number">
                      {index + 1}.
                    </span>
                    
                    {/* Display different content based on item type */}
                    {item.itemType === 'camera' ? (
                      // Camera marker display
                      <>
                        <div 
                          className="tour-item-image"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: '#4CAF50',
                            borderRadius: '4px'
                          }}
                        >
                          <span style={{ fontSize: '16px' }}>🎥</span>
                        </div>
                        <div className="tour-item-info">
                          <div className="tour-item-title">Camera Position</div>
                          <div className="tour-item-alt">
                            [{item.position?.map(v => v.toFixed(1)).join(', ')}]
                          </div>
                        </div>
                      </>
                    ) : (
                      // Image display
                      <>
                        <img 
                          src={item.src} 
                          alt={item.alt}
                          className="tour-item-image"
                        />
                        <div className="tour-item-info">
                          <div className="tour-item-title">{item.title}</div>
                          <div className="tour-item-alt">{item.alt}</div>
                        </div>
                      </>
                    )}
                    
                    {/* X Button in top right corner */}
                    <button
                      className="tour-remove-btn tour-remove-button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleRemoveFromTour(item.itemId);
                      }}
                      title="Remove from tour"
                    >
                      <MdClear size={12} />
                    </button>
                  </div>
                ))
              )}
              
              {/* Bottom Drop Zone */}
              {tourItemsFromTemp.length > 0 && (
                <div
                  className={`bottom-drop-zone tour-bottom-drop-zone ${dragOverIndex === tourItemsFromTemp.length ? 'drag-over' : ''}`}
                  onDragOver={handleDragOver}
                  onDragEnter={(e) => handleDragEnter(e, tourItemsFromTemp.length)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => {
                    handleDrop(e, tourItemsFromTemp.length);
                  }}
                />
              )}
              
              {/* Add Buttons Row */}
              <div className="tour-dropdown-container">
                <div className="tour-buttons-row" style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <button
                    onClick={() => setShowImageDropdown(!showImageDropdown)}
                    disabled={unindexedImages.length === 0}
                    className={`tour-add-button ${unindexedImages.length > 0 ? 'enabled' : 'disabled'}`}
                    style={{ flex: 1, fontSize: '12px' }}
                    title={`Add image to tour sequence (${unindexedImages.length} available)`}
                  >
                    Add Image {unindexedImages.length > 0 ? `(${unindexedImages.length})` : '(0)'}
                  </button>

                  <button
                    onClick={() => {
                      if (onCreateCameraTourMarker) {
                        onCreateCameraTourMarker();
                      }
                    }}
                    className="tour-add-button enabled"
                    style={{ 
                      flex: 1,
                      fontSize: '12px',
                      backgroundColor: '#4CAF50',
                      border: '2px solid #2E7D32'
                    }}
                    title="Add a tour marker at current camera position"
                  >
                    Add Camera Position
                  </button>
                </div>
                
                {/* Dropdown */}
                {showImageDropdown && unindexedImages.length > 0 && (
                  <div className="tour-dropdown">
                    {unindexedImages.map((image) => (
                      <div
                        key={image.id}
                        onClick={() => handleAddImageToTour(image)}
                        className="tour-dropdown-item"
                      >
                        <img 
                          src={image.src} 
                          alt={image.alt}
                          className="tour-dropdown-image"
                        />
                        <div className="tour-dropdown-info">
                          <div className="tour-dropdown-title">{image.title}</div>
                          <div className="tour-dropdown-alt">{image.alt}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderWallTools = () => (
    <div>
      <div className="wall-section">
        <div className='create-title'>
          Create Wall
        </div>
        <img
          className="create-wall-image"
          src="https://placehold.co/125"
          title="Create a wall to ground"
          onClick={onCreateWall}
        />
      </div>
      <div className="light-section">
        <div className='create-title'>
          Create Light
        </div>
        <button
          className="add-image-button"
          onClick={onCreateSpotLight}
        >
          + Add Spot Light
        </button>
      </div>
    </div>
  );

  const renderImageTools = () => (
    <div>
      <div className="image-frame-container">
        <div className='create-title'>
          Create Image Frame
        </div>
        <img
          className="create-wall-image"
          src={imageFrame.src}
          alt={imageFrame.alt}
          title="Drag a Image Frame to Wall"
          draggable
          onDragStart={e => {
            e.dataTransfer.setData('imageSrc', imageFrame.src);
            if (onImageDragStart) onImageDragStart(imageFrame);
          }}
          onClick={() => {
            if (onCreateImageFrame) {
              onCreateImageFrame();
            }
          }}
        />  
      </div>
      <button
        className="add-image-button"
        onClick={handleAddImage}
      >
        + Add Image
      </button>
      <div className="image-buttons">
        {images.map((image) => (
          <img
            key={image.id}
            className="image-button"
            src={image.src}
            alt={image.alt}
            title={image.title}
            draggable
            onDragStart={e => {
              e.dataTransfer.setData('imageSrc', image.src);
              if (onImageDragStart) onImageDragStart(image);
            }}
            onClick={() => openMetaEditor(image)}
          />
        ))}
      </div>
    </div>
  );

  const renderAudioTools = () => (
    <div>
      <div className="audio-upload-section">
        <div className='create-title'>
          Upload Audio
        </div>
        <button
          className="add-image-button"
          onClick={handleAudioUpload}
        >
          + Upload Audio
        </button>
        <input
          ref={audioFileInputRef}
          type="file"
          accept="audio/*"
          style={{ display: 'none' }}
          onChange={handleAudioFileSelect}
        />
      </div>
      
      {uploadedAudioFiles.length > 0 && (
        <div className="audio-files-section">
          <div className='create-title'>
            Uploaded Audio Files
          </div>
          <div className="audio-files-list">
            {uploadedAudioFiles.map((audio) => (
              <div key={audio.id} className="audio-file-item">
                <div className="audio-file-info">
                  <span className="audio-file-name">{audio.title || audio.src.split('/').pop()}</span>
                  <div className="audio-file-controls">
                    <button
                      className="audio-preview-btn"
                      onClick={() => handleAudioPreview(audio)}
                    >
                      {currentPlayingAudio === audio.id ? 'Stop' : 'Play'}
                    </button>
                    <button
                      className="audio-remove-btn"
                      onClick={() => handleAudioRemove(audio.id)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderSceneSelector = () => {
    const availableScenes = [
      { id: 'object', name: 'Default Scene', file: 'object.json' },
      { id: 'room1', name: 'Room 1', file: 'room1.json' },
      { id: 'room2', name: 'Room 2', file: 'room2.json' },
      { id: 'room3', name: 'Room 3', file: 'room3.json' },
      { id: 'room4', name: 'Room 4', file: 'room4.json' }
    ];

    const handleSceneChange = async (sceneFile) => {
      try {
        // Fetch the scene file as JSON
        const response = await fetch(`/src/assets/${sceneFile}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const sceneData = await response.json();
        
        if (onSceneChange) {
          onSceneChange(sceneData, sceneFile);
        }
      } catch (error) {
        console.error('Error loading scene:', error);
        alert(`Failed to load scene: ${error.message}`);
      }
    };

    return (
      <div>
        <div className='create-title'>
          Scene Manager
        </div>
        
        {/* Current Scene Info */}
        <div className="scene-current-info">
          <strong>Current Scene:</strong>
          <br />
          <span style={{ fontSize: '14px', color: '#007bff' }}>{currentSceneFile}</span>
        </div>

        {/* Save Button */}
        <button
          onClick={onSaveScene}
          className="scene-save-button"
        >
          💾 Save Current Scene
        </button>

        {/* Load Scene Section */}
        <div className="scene-load-section">
          <p className="scene-load-description">
            Load a different scene:
          </p>
          {availableScenes.map((scene) => (
            <button
              key={scene.id}
              onClick={() => handleSceneChange(scene.file)}
              disabled={currentSceneFile === scene.file}
              className={`scene-load-button ${currentSceneFile === scene.file ? 'current' : ''}`}
            >
              {scene.name}
              {currentSceneFile === scene.file && ' (Current)'}
              <br />
              <small style={{ opacity: 0.7 }}>{scene.file}</small>
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderDebugSettings = () => (
    <div>
      <div className="debug-setting">
        <label className="debug-setting-label">
          <input
            type="checkbox"
            checked={showTransparentWalls}
            onChange={(e) => {
              const newValue = e.target.checked;
              setShowTransparentWalls(newValue);
              if (onShowTransparentWallsChange) {
                onShowTransparentWallsChange(newValue);
              }
            }}
            className="debug-setting-checkbox"
          />
          Show Transparent Walls
        </label>
        <div className="debug-setting-description">
          Enable rendering of transparent walls in edit mode. When disabled, transparent walls cannot be selected.
        </div>
      </div>
      
      <div className="debug-setting">
        <label className="debug-setting-label">
          <input
            type="checkbox"
            checked={isEditRoom}
            onChange={(e) => setIsEditRoom(e.target.checked)}
            className="debug-setting-checkbox"
          />
          Edit Room
        </label>
        <div className="debug-setting-description">
          Enable room editing mode for modifying room structure and layout.
        </div>
      </div>
    </div>
  );

  const renderSkySettings = () => (
    <div>
      <div>
        <select
          id="skySettingMode"
          value={skySettingMode}
          onChange={(e) => {
            const mode = e.target.value;
            setSkySettingMode(mode);

            if (mode === 'preset') {
              setHdri('apartment');
            } else if (mode === 'file') {
              setHdri('/hdri/rogland_clear_night_2k.hdr');
            } else if (mode === 'sky') {
              setHdri(null);
            }
          }}
        >
          <option value="sky">Self Setting</option>
          <option value="preset">Use Preset</option>
          <option value="file">Upload File</option>
        </select>
      </div>

      {skySettingMode === 'sky' && (
        <>
          <DraggableAxisInput
            label="Distance"
            value={skySettings.distance}
            onChange={(v) => setSkySettings((prev) => ({ ...prev, distance: v }))}
            step={1000}
          />
          <DraggableAxisInput
            label="Sun Position X"
            value={skySettings.sunPosition[0]}
            onChange={(v) =>
              setSkySettings((prev) => ({
                ...prev,
                sunPosition: [v, prev.sunPosition[1], prev.sunPosition[2]],
              }))
            }
            step={1}
          />
          <DraggableAxisInput
            label="Sun Position Y"
            value={skySettings.sunPosition[1]}
            onChange={(v) =>
              setSkySettings((prev) => ({
                ...prev,
                sunPosition: [prev.sunPosition[0], v, prev.sunPosition[2]],
              }))
            }
            step={1}
          />
          <DraggableAxisInput
            label="Sun Position Z"
            value={skySettings.sunPosition[2]}
            onChange={(v) =>
              setSkySettings((prev) => ({
                ...prev,
                sunPosition: [prev.sunPosition[0], prev.sunPosition[1], v],
              }))
            }
            step={1}
          />
          <DraggableAxisInput
            label="Inclination"
            value={skySettings.inclination}
            onChange={(v) => setSkySettings((prev) => ({ ...prev, inclination: v }))}
            step={0.01}
          />
          <DraggableAxisInput
            label="Azimuth"
            value={skySettings.azimuth}
            onChange={(v) => setSkySettings((prev) => ({ ...prev, azimuth: v }))}
            step={0.01}
          />
          <DraggableAxisInput
            label="Turbidity"
            value={skySettings.turbidity}
            onChange={(v) => setSkySettings((prev) => ({ ...prev, turbidity: v }))}
            step={0.1}
          />
          <DraggableAxisInput
            label="Rayleigh"
            value={skySettings.rayleigh}
            onChange={(v) => setSkySettings((prev) => ({ ...prev, rayleigh: v }))}
            step={0.1}
          />
          <DraggableAxisInput
            label="Mie Coefficient"
            value={skySettings.mieCoefficient}
            onChange={(v) => setSkySettings((prev) => ({ ...prev, mieCoefficient: v }))}
            step={0.001}
          />
          <DraggableAxisInput
            label="Mie Directional G"
            value={skySettings.mieDirectionalG}
            onChange={(v) => setSkySettings((prev) => ({ ...prev, mieDirectionalG: v }))}
            step={0.01}
          />
          <DraggableAxisInput
            label="Exposure"
            value={skySettings.exposure}
            onChange={(v) => setSkySettings((prev) => ({ ...prev, exposure: v }))}
            step={0.01}
          />
        </>
      )}
      {skySettingMode === 'file' && (
        <input
          type="file"
          accept=".hdr, .exr, .jpg, .png"
          onChange={(e) => {
            const file = e.target.files[0];
            console.log(file.name);
            setHdri(`/hdri/${file.name}`);
          }}
        />
      )}
      {skySettingMode === 'preset' && (
        <>
          <select onChange={(e) => setHdri(e.target.value)} value={hdri}>
            <optgroup label="Built-in Presets">
              <option value="sunset"a>Sunset</option>
              <option value="dawn">Dawn</option>
              <option value="night">Night</option>
              <option value="warehouse">Warehouse</option>
              <option value="forest">Forest</option>
              <option value="apartment">Apartment</option>
              <option value="studio">Studio</option>
              <option value="city">City</option>
              <option value="park">Park</option>
              <option value="lobby">Lobby</option>
            </optgroup>
            <optgroup label="Custom HDR Files">
              <option value="/textures/room/exr_room1_lightmap_compressed.exr">Room 1 Lightmap</option>
              <option value="/hdri/rogland_clear_night_2k.hdr">Rogland Clear Night</option>
            </optgroup>
          </select>
        </>
      )}
    </div>
  );

  const renderGroundSettings = () => (
    <div>
      <div>
        <select
          id="groundSettingMode"
          value={groundSettingMode}
          onChange={(e) => {
            const mode = e.target.value;
            setGroundSettingMode(mode);

            if (mode === 'preset') {
              return;
            } else if (mode === 'file') {
              return;
            } else if (mode === 'ground') {
              return;
            }
          }}
        >
          <option value="ground">Self Setting</option>
          <option value="preset">Use Preset</option>
          <option value="file">Upload File</option>
        </select>
      </div>
      
      {groundSettingMode === "ground" && (
        <>
          <DraggableAxisInput
            label="Blur X"
            value={groundSettings.blur[0]}
            onChange={(v) =>
              setGroundSettings((prev) => ({
                ...prev,
                blur: [v, prev.blur[1]],
              }))
            }
            step={1}
          />
          <DraggableAxisInput
            label="Blur Y"
            value={groundSettings.blur[1]}
            onChange={(v) =>
              setGroundSettings((prev) => ({
                ...prev,
                blur: [prev.blur[0], v],
              }))
            }
            step={1}
          />
          <DraggableAxisInput
            label="Resolution"
            value={groundSettings.resolution}
            onChange={(v) =>
              setGroundSettings((prev) => ({ ...prev, resolution: v }))
            }
            step={1}
          />
          <DraggableAxisInput
            label="Mix Blur"
            value={groundSettings.mixBlur}
            onChange={(v) =>
              setGroundSettings((prev) => ({ ...prev, mixBlur: v }))
            }
            step={0.01}
          />
          <DraggableAxisInput
            label="Mix Strength"
            value={groundSettings.mixStrength}
            onChange={(v) =>
              setGroundSettings((prev) => ({ ...prev, mixStrength: v }))
            }
            step={0.1}
          />
          <DraggableAxisInput
            label="Roughness"
            value={groundSettings.roughness}
            onChange={(v) =>
              setGroundSettings((prev) => ({ ...prev, roughness: v }))
            }
            step={0.01}
          />
          <DraggableAxisInput
            label="Depth Scale"
            value={groundSettings.depthScale}
            onChange={(v) =>
              setGroundSettings((prev) => ({ ...prev, depthScale: v }))
            }
            step={0.01}
          />
          <DraggableAxisInput
            label="Min Depth Threshold"
            value={groundSettings.minDepthThreshold}
            onChange={(v) =>
              setGroundSettings((prev) => ({ ...prev, minDepthThreshold: v }))
            }
            step={0.01}
          />
          <DraggableAxisInput
            label="Max Depth Threshold"
            value={groundSettings.maxDepthThreshold}
            onChange={(v) =>
              setGroundSettings((prev) => ({ ...prev, maxDepthThreshold: v }))
            }
            step={0.01}
          />
          <DraggableAxisInput
            label="Metalness"
            value={groundSettings.metalness}
            onChange={(v) =>
              setGroundSettings((prev) => ({ ...prev, metalness: v }))
            }
            step={0.01}
          />
          <ColorInput
            value={groundSettings.color}
            onChange={(v) =>
              setGroundSettings((prev) => ({ ...prev, color: v }))
            }
          />
        </>
      )}

      {groundSettingMode === "file" && (
        <>
          <input
            type="file"
            accept=".jpg, .png"
            onChange={(e) => {
              const file = e.target.files[0];
              setGroundTexture(prev => ({
                ...prev,
                image: `/groundTexture/${file.name}`
              }));
            }}
          />
        </>
      )}

      {groundSettingMode === "preset" && (
        <>
          <select
            value={groundTexture.id}
            onChange={(e) => {
              const selectedId = e.target.value;
              const selectedTexture = groundTextureList.find(frame => frame.id === selectedId);

              if (selectedTexture) {
                setGroundTexture(prev => ({
                  ...prev,
                  id: selectedTexture.id,
                  alb: selectedTexture.alb,
                  nor: selectedTexture.nor,
                  orm: selectedTexture.orm,
                }));
              }
            }}
            className="ground-settings-select"
          >
            {groundTextureList.map((frame) => (
              <option key={frame.id} value={frame.id}>
                {frame.name}
              </option>
            ))}
          </select>
          <ColorInput
            value={groundSettings.color}
            onChange={(v) =>
              setGroundSettings((prev) => ({ ...prev, color: v }))
            }
          />
        </>
      )}
    </div>
  );

  const renderBloomSettings = () => (
    <div>
      <div className="debug-setting">
        <label className="debug-setting-label">
          <input
            type="checkbox"
            checked={bloomSettings?.enabled || false}
            onChange={(e) => {
              setBloomSettings((prev) => ({ ...prev, enabled: e.target.checked }));
            }}
            className="debug-setting-checkbox"
          />
          Enable Bloom Effect
        </label>
        <div className="debug-setting-description">
          Enable bloom post-processing effect for glowing objects and emissive materials.
        </div>
      </div>

      {bloomSettings?.enabled && (
        <>
          <DraggableAxisInput
            label="Luminance Threshold"
            value={bloomSettings?.luminanceThreshold || 1.0}
            onChange={(v) => setBloomSettings((prev) => ({ ...prev, luminanceThreshold: v }))}
            step={0.1}
          />
          <DraggableAxisInput
            label="Luminance Smoothing"
            value={bloomSettings?.luminanceSmoothing || 0.9}
            onChange={(v) => setBloomSettings((prev) => ({ ...prev, luminanceSmoothing: v }))}
            step={0.01}
          />
          <DraggableAxisInput
            label="Intensity"
            value={bloomSettings?.intensity || 1.5}
            onChange={(v) => setBloomSettings((prev) => ({ ...prev, intensity: v }))}
            step={0.1}
          />
        </>
      )}
    </div>
  );

  const renderObjectSettings = () => {
    // If no object is selected, show default message
    if (!selectedId || selectedId === "null") {
      return (
        <div className="object-settings-empty">
          <p>Select an object to see its statistics</p>
        </div>
      );
    }

    // If object is selected, show settings without title
    return (
      <div>
        {editableFields.map(fieldConfig => {
          const value = currentTransform[fieldConfig.field];
          if (fieldConfig.type === 'vector3' && Array.isArray(value)) {
            return (
              <div className="setting-group" key={fieldConfig.field}>
                <label>{fieldConfig.label}:</label>
                {(fieldConfig.subFields ?? [0, 1, 2]).map(idx => (
                  <DraggableAxisInput
                    key={`${fieldConfig.field}-${idx}`}
                    label={['X', 'Y', 'Z'][idx]}
                    value={value[idx]}
                    onChange={(v) => handleFieldChange(fieldConfig.field, v, idx)}
                    step={fieldConfig.step}
                    suffix={fieldConfig.suffix}
                  />
                ))}
              </div>
            );
          } else if (fieldConfig.type === 'color' && typeof value === 'string') {
            return (
              <div className="setting-group-color" key={fieldConfig.field}>
                <label>{fieldConfig.label}:</label>
                <ColorInput
                  value={value}
                  onChange={(v) => handleFieldChange(fieldConfig.field, v)}
                />
              </div>
            );
          } else if (fieldConfig.type === 'dropdown' && fieldConfig.field === "imageFrameId") {
          return (
            <select
              value={value || ''}
              onChange={(e) => handleFieldChange(fieldConfig.field, e.target.value)}
              style={{ padding: '5px', borderRadius: '4px', width: '100%' }}
            >
              {imageFrameList.map((frame) => (
                <option key={frame.id} value={frame.id}>
                  {frame.id}
                </option>
              ))}
            </select>
          );
        } else if (fieldConfig.type === 'dropdown' && fieldConfig.field === "wallTextureId") {
          return (
            <select
              value={currentTransform.albedo}
              onChange={(e) => {
                  const selectedAlb = e.target.value;
                  const selectedTexture = wallTextureList.find(frame => frame.alb === selectedAlb);

                  if (selectedTexture) {
                    handleFieldChange("albedo", selectedTexture.alb)
                    handleFieldChange("normal", selectedTexture.nor)
                    handleFieldChange("orm", selectedTexture.orm)
                  }
                }}
              style={{ padding: '5px', borderRadius: '4px', width: '100%' }}
            >
              {wallTextureList.map((frame) => (
                <option key={frame.id} value={frame.alb}>
                  {frame.name}
                </option>
              ))}
            </select>
          );
        } else if (fieldConfig.type === 'boolean') {
          return (
            <div className="setting-group" key={fieldConfig.field}>
              <label>{fieldConfig.label}:</label>
              <input
                type="checkbox"
                checked={!!value} 
                onChange={(e) => handleFieldChange(fieldConfig.field, e.target.checked)}
              />
            </div>
          );
        } else if (typeof value === 'number') {
            return (
              <div className="setting-group" key={fieldConfig.field}>
                <label>{fieldConfig.label}:</label>
                <DraggableAxisInput
                  label={fieldConfig.label}
                  value={value}
                  onChange={(v) => handleFieldChange(fieldConfig.field, v)}
                  step={fieldConfig.step}
                  suffix={fieldConfig.suffix}
                />
              </div>
            );
          } else {
            return null;
          }
        })}
      </div>
    );
  };

  const renderAddImageModal = () => (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Add New Image</h3>
        <div className="modal-field">
          <label>
            Image URL:
            <input
              type="text"
              value={newImage.src}
              onChange={e => setNewImage({ ...newImage, src: e.target.value })}
              placeholder="https://example.com/image.jpg"
            />
          </label>
        </div>
        <div className="modal-field">
          <label>
            Alt:
            <input
              type="text"
              value={newImage.alt}
              onChange={e => setNewImage({ ...newImage, alt: e.target.value })}
            />
          </label>
        </div>
        <div className="modal-field">
          <label>
            Title:
            <input
              type="text"
              value={newImage.title}
              onChange={e => setNewImage({ ...newImage, title: e.target.value })}
            />
          </label>
        </div>
        <div className="modal-field">
          <label>
            Description:
            <textarea
              value={newImage.description || ''}
              onChange={e => setNewImage({ ...newImage, description: e.target.value })}
              rows={3}
              placeholder="Enter image description..."
            />
          </label>
        </div>
        <div className="modal-actions">
          <button
            className="modal-cancel"
            onClick={() => { setIsAddImageModalOpen(false); setIsImageEditModalOpen(false); }}
          >
            Cancel
          </button>
          <button
            className="modal-save"
            onClick={handleAddImageSave}
            disabled={!newImage.src}
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );

  const renderEditImageModal = () => (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Edit Image Metadata</h3>
        <div className="modal-field">
          <label>
            Alt:
            <input
              type="text"
              value={meta.alt}
              onChange={e => setMeta({ ...meta, alt: e.target.value })}
            />
          </label>
        </div>
        <div className="modal-field">
          <label>
            Title:
            <input
              type="text"
              value={meta.title}
              onChange={e => setMeta({ ...meta, title: e.target.value })}
            />
          </label>
        </div>
        <div className="modal-field">
          <label>
            Description:
            <textarea
              value={meta.description || ''}
              onChange={e => setMeta({ ...meta, description: e.target.value })}
              rows={3}
              placeholder="Enter image description..."
            />
          </label>
        </div>
        <div className="modal-actions">
          <button className="modal-cancel" onClick={() => { setEditingImage(null); setIsImageEditModalOpen(false); }}>Cancel</button>
          <button className="modal-save" onClick={handleMetaSave}>Save</button>
        </div>
      </div>
    </div>
  );

  const [editingImage, setEditingImage] = useState(null);
  const [meta, setMeta] = useState({ alt: '', title: '', description: '' });

  // State for adding a new image
  const [isAddImageModalOpen, setIsAddImageModalOpen] = useState(false);
  const [newImage, setNewImage] = useState({ src: '', alt: '', title: '', description: '' });

  //State for edit selected model
  const [currentTransform, setCurrentTransform] = useState({});
  const [editableFields, setEditableFields] = useState([]);

  const currentObject = objects.find(obj => obj.id === selectedId);

  useEffect(() => {
    if (currentObject) {
      setCurrentTransform({ ...currentObject });

      // Set editable fields based on object type
      if (currentObject.type === 'spawn') {
        setEditableFields([
          { field: 'position', label: 'Position', type: 'vector3', step: 0.01, suffix: 'm', subFields: [0, 2] },
        ]);
      } else if (currentObject.type === 'spotLight') {
        setEditableFields([
          { field: 'position', label: 'Position', type: 'vector3', step: 0.01, suffix: 'm' },
          { field: 'rotation', label: 'Rotation', type: 'vector3', step: 0.1, suffix: '°' },
          { field: 'intensity', label: 'Intensity', type: 'number', step: 1 },
          { field: 'angle', label: 'Angle', type: 'number', step: 1, suffix: '°' },
          { field: 'penumbra', label: 'Penumbra', type: 'number', step: 0.01 },
          { field: 'color', label: 'Color', type: 'color' },
        ]);
      } else if (currentObject.type === 'image'){
        setEditableFields([
          { field: 'position', label: 'Position', type: 'vector3', step: 0.01, suffix: 'm', subFields: [0, 1] },
          { field: 'rotation', label: 'Rotation', type: 'vector3', step: 0.1, suffix: '°', subFields: [2] },
          { field: 'scale', label: 'Scale', type: 'vector3', step: 0.1, subFields: [1] },
          { field: 'imageFrameId', label: 'Image Frame', type: 'dropdown' },
          { field: 'frameColor', label: 'Frame Color', type: 'color' },
        ]);
      }
       else {
        setEditableFields([
          { field: 'position', label: 'Position', type: 'vector3', step: 0.01, suffix: 'm' },
          { field: 'rotation', label: 'Rotation', type: 'vector3', step: 0.1, suffix: '°' },
          { field: 'scale', label: 'Scale', type: 'vector3', step: 0.01 },
          { field: 'wallTextureId', label: 'Texture', type: 'dropdown' },
          { field: 'transparent', label: 'Transparent', type: 'boolean' },
          { field: 'color', label: 'Color', type: 'color' },
        ]);
      }
    } else {
      setCurrentTransform({});
      setEditableFields([]);
    }
  }, [selectedId, objects]);

  const openMetaEditor = (image) => {
    setIsImageEditModalOpen(true);
    setEditingImage(image);
    setMeta({ alt: image.alt || '', title: image.title || '', description: image.description || '' });
  };

  const handleMetaSave = async () => {
    if (onImageMetaChange && editingImage) {
      await onImageMetaChange(editingImage.id, meta); // Update JSON and image instances
    }
    setEditingImage(null);
    setIsImageEditModalOpen(false);
  };

  const handleAddImage = () => {
    setIsAddImageModalOpen(true);
    setNewImage({ src: '', alt: '', title: '', description: '' });
    setIsImageEditModalOpen(true);
  };

  const handleAddImageSave = async () => {
    if (onAddImage && newImage.src) {
      await onAddImage(newImage);
    }
    setIsAddImageModalOpen(false);
    setIsImageEditModalOpen(false);
    setFileError('');
  };

  // Audio handler functions
  const handleAudioUpload = () => {
    audioFileInputRef.current?.click();
  };

  const handleAudioFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // For now, we'll just use a mock URL since actual upload will be implemented later
      const audioUrl = URL.createObjectURL(file);
      const newAudio = {
        id: `audio-${Date.now()}`,
        src: audioUrl,
        title: file.name,
        type: file.type,
        size: file.size
      };
      
      if (onAddAudio) {
        onAddAudio(newAudio);
      }
    }
    // Reset input
    e.target.value = '';
  };

  const handleAudioPreview = (audio) => {
    if (currentPlayingAudio === audio.id) {
      // Stop current audio
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
      setCurrentPlayingAudio(null);
    } else {
      // Stop any currently playing audio
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
      }
      
      // Start new audio
      const audioElement = new Audio(audio.src);
      audioElement.play();
      audioElement.onended = () => {
        setCurrentPlayingAudio(null);
        currentAudioRef.current = null;
      };
      
      currentAudioRef.current = audioElement;
      setCurrentPlayingAudio(audio.id);
    }
  };

  const handleAudioRemove = (audioId) => {
    // Stop audio if it's currently playing
    if (currentPlayingAudio === audioId && currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
      setCurrentPlayingAudio(null);
    }
    
    if (onRemoveAudio) {
      onRemoveAudio(audioId);
    }
  };

  //function to manage model parameters from input cell
  useEffect(() => {
    const currentObject = objects.find(obj => obj.id === selectedId);
    if (currentObject) {
      setCurrentTransform({ ...currentObject });
    } else {
      setCurrentTransform({});
    }
  }, [selectedId, objects]);

  // Khi chọn object -> tự động mở tab object
  useEffect(() => {
    if (selectedId) {
      setActiveTab("object");
      localStorage.setItem("toolboxActiveTab", "object");
    }
  }, [selectedId]);

  // Khi đổi tab -> clear object nếu rời khỏi tab object
  useEffect(() => {
    localStorage.setItem("toolboxActiveTab", activeTab);
    if (activeTab !== "object") {
      setSelectedId(null);
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeSubTab) {
      localStorage.setItem('toolboxActiveSubTab', activeSubTab);
    }
  }, [activeSubTab]);

  const handleFieldChange = (field, value, subIndex = null) => {
    setCurrentTransform(prev => {
      let newValue;
      if (Array.isArray(prev[field]) && subIndex != null) {
        newValue = [...prev[field]];
        newValue[subIndex] = value;
      } else {
        newValue = value;
      }

      const updated = {
        ...prev,
        [field]: Array.isArray(prev[field]) && subIndex != null ? newValue : newValue,
      };

      if (onTransformChange && selectedId) {
        onTransformChange(selectedId, {
          position: updated.position,
          rotation: updated.rotation,
          scale: updated.scale,
          intensity: updated.intensity,
          color: updated.color,
          angle: updated.angle,
          penumbra: updated.penumbra,
          imageFrameId: updated.imageFrameId,
          frameColor: updated.frameColor,
          albedo: updated.albedo,
          normal: updated.normal,
          orm: updated.orm,
          transparent: updated.transparent
        });
      }

      return updated;
    });
  };

  return (
    <div className={`toolbox ${isCollapsed ? 'collapsed' : ''}`}>
      {/* Main Tabs Sidebar */}
      <div className="toolbox-main-tabs">
        {/* Collapse/Expand Button */}
        <button
          className="menu-button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? 'Expand' : 'Collapse'}
        >
          {isCollapsed ? <MdMenu size={24} /> : <MdClose size={24} />}
        </button>
        
        {mainTabs.map((tab) => {
          const IconComponent = tab.icon;
          return (
            <button
              key={tab.id}
              className={`main-tab ${!isCollapsed && activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              title={tab.label}
            >
              <div className={`main-tab-icon ${!isCollapsed && activeTab === tab.id ? 'active' : ''}`}>
                <IconComponent size={35} />
              </div>
              <div style={{ fontSize: '10px', marginTop: '4px'}}>{tab.label}</div>
            </button>
          );
        })}
      </div>

      {/* Content Area */}
      <div className="toolbox-content-area">
        {/* Subtabs */}
        {getSubTabs(activeTab).length > 0 && (
          <div className="toolbox-subtabs">
            {getSubTabs(activeTab).map((subTab) => (
              <button
                key={subTab.id}
                className={`subtab ${activeSubTab === subTab.id ? 'active' : ''}`}
                onClick={() => setActiveSubTab(subTab.id)}
              >
                {subTab.label}
              </button>
            ))}
          </div>
        )}

        {/* Main Content */}
        <div className="toolbox-main-content">
          {activeTab === 'objects' && renderObjectsContent()}
          {activeTab === 'object' && renderObjectContent()}
          {activeTab === 'settings' && renderSettingsContent()}
          {activeTab === 'tour' && renderTourContent()}
          {activeTab === 'debug' && renderDebugContent()}
        </div>
      </div>

      {/* Modals */}
      {isAddImageModalOpen && renderAddImageModal()}
      {editingImage && renderEditImageModal()}
    </div>
  );
};

export default Toolbox;