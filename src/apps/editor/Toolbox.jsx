import { useState, useEffect, useRef } from 'react';
import './Toolbox.css';;
import { Box, Plus, Menu, X, Video, GripVertical, Leaf } from "lucide-react";
import * as THREE from 'three';
import ArtworkCreateModal from "@/components/MetadataCreateModal";
import ArtworkEditModal from "@/components/MetadataEditModal";

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

// Helper function to calculate position for image tour markers
const calculateImageMarkerPosition = (linkedImage, objects) => {
  if (!linkedImage || !linkedImage.position) {
    return [0, 1.7, 0]; // Default position at camera height if no linked image
  }

  // Find the parent wall if the image has one
  const parentWall = linkedImage.parent ? objects.find(obj => obj.id === linkedImage.parent) : null;
  
  if (!parentWall) {
    // If no parent wall, use simple offset (fallback for standalone images)
    const [x, y, z] = linkedImage.position;
    return [x, 1.7, z + 2]; // Simple 2 units forward in Z direction at camera height
  }

  // Use the same logic as TourMarker component for proper 3D calculation
  const MARKER_DISTANCE = 2;
  const CAMERA_HEIGHT = 1.7; // Camera/tour marker height level
  
  const wallPosition = parentWall.position || [0, 0, 0];
  const wallRotation = parentWall.rotation || [0, 0, 0];
  const wallScale = parentWall.scale || [1, 1, 1];
  const imagePosition = linkedImage.position;
  const imageRotation = linkedImage.rotation || [0, 0, 0];

  // Calculate image world position and move forward along its normal
  const wallPos = new THREE.Vector3(...wallPosition);
  const wallRot = new THREE.Euler(
    THREE.MathUtils.degToRad(wallRotation[0]),
    THREE.MathUtils.degToRad(wallRotation[1]),
    THREE.MathUtils.degToRad(wallRotation[2])
  );
  const wallQuat = new THREE.Quaternion().setFromEuler(wallRot);
  
  // Transform image position from wall-local to world space
  const imageLocalPos = new THREE.Vector3(...imagePosition);
  const imageWorldPos = imageLocalPos.clone();
  imageWorldPos.applyQuaternion(wallQuat);
  imageWorldPos.multiply(new THREE.Vector3(...wallScale));
  imageWorldPos.add(wallPos);
  
  // Calculate the image's forward direction (normal vector pointing away from wall)
  const imageRot = new THREE.Euler(
    THREE.MathUtils.degToRad(imageRotation[0]),
    THREE.MathUtils.degToRad(imageRotation[1]),
    THREE.MathUtils.degToRad(imageRotation[2])
  );
  const imageQuat = new THREE.Quaternion().setFromEuler(imageRot);
  
  // Combine wall and image rotations
  const combinedQuat = wallQuat.clone().multiply(imageQuat);
  
  // Forward direction (positive Z to point away from image surface)
  const forward = new THREE.Vector3(0, 0, 1);
  forward.applyQuaternion(combinedQuat);
  forward.multiplyScalar(MARKER_DISTANCE);
  
  // Final marker position = image world position + forward offset
  const markerPos = imageWorldPos.clone().add(forward);
  
  // Force Y position to camera height level
  return [markerPos.x, CAMERA_HEIGHT, markerPos.z];
};

const Toolbox = ({ onCreateWall, onCreateSpotLight, onCreateImageFrame, onCreatePhysicPlane, images, setImages, pagination, setPage, audios, setAudios, room3DData, imageFrameList, onImageDragStart, onTempTourIndexChange, onCreateCameraTourMarker, onUpdateTourMarkers, setIsImageEditModalOpen, uploadMedia, deleteMedia, updateMedia, uploadAudio, deleteAudio, selectedId, setSelectedId, onTransformChange, objects, skySettings, setSkySettings, groundSettings, setGroundSettings, bloomSettings, setBloomSettings, imageFrame, physicPlane, skySettingMode, setSkySettingMode, groundSettingMode, setGroundSettingMode, wallTextureList, groundTextureList, glbTextureList, hdri, setHdri, groundTexture, setGroundTexture, onSceneChange, onSaveScene, currentSceneFile, isEditRoom, setIsEditRoom, onShowTransparentWallsChange, tourMarkers = [], tempTourIndices, setTempTourIndices, uploadedAudioFiles = [], onAddAudio, onRemoveAudio, importGLB, typeRoom, backgroundAudio, backgroundAudioLoading, onBackgroundAudioChange }) => {
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('toolboxActiveTab') || 'objects');
  const [isCollapsed, setIsCollapsed] = useState(false); // Track if the toolbox is collapsed
  const [showTransparentWalls, setShowTransparentWalls] = useState(false); // Track transparent walls visibility

  // Add state for subtabs
  const [activeSubTab, setActiveSubTab] = useState(() => localStorage.getItem('toolboxActiveSubTab') || null);
  
  // Tour management state
  const [showImageDropdown, setShowImageDropdown] = useState(false); // Show/hide dropdown
  // tempTourIndices now comes from props
  const [draggedItemId, setDraggedItemId] = useState(null); // Track which item is being dragged
  const [dragOverIndex, setDragOverIndex] = useState(null); // Track which position we're dragging over

  // tempTourIndices and setTempTourIndices now come from props

  // Audio management state
  const [currentPlayingAudio, setCurrentPlayingAudio] = useState(null);
  const audioFileInputRef = useRef(null);
  const currentAudioRef = useRef(null);

  // Track previous tab for restoration when deselecting objects
  const previousTabRef = useRef(null);

  const [showCreateArtwork, setShowCreateArtwork] = useState(false);
  const [showEditArtwork, setShowEditArtwork] = useState(false);
  const [editingArtwork, setEditingArtwork] = useState(null);

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
    { id: 'objects', label: 'Tạo', icon: Plus },
    { id: 'object', label: 'Vật Thể', icon: Box },
    { id: 'settings', label: 'Môi Trường', icon: Leaf },
    { id: 'tour', label: 'Tour', icon: Video },
    { id: 'debug', label: 'Debug', icon: Menu }
  ];

  // Define subtabs for each main tab
  const getSubTabs = (mainTabId) => {
    if (mainTabId === 'objects') {
      return [
        { id: 'walls', label: 'Cơ Bản' },
        { id: 'images', label: 'Hình Ảnh' },
        { id: 'audio', label: 'Âm Thanh' }
      ];
    } else if (mainTabId === 'object') {
      // Object settings - no subtabs needed, content depends on selected object
      return [];
    } else if (mainTabId === 'settings') {
      return [
        { id: 'sky', label: 'Bầu Trời' },
        { id: 'ground', label: 'Mặt Đất' },
        { id: 'scene', label: 'Hậu kì' }
      ];
    } else if (mainTabId === 'debug') {
      return [
        { id: 'scenes', label: 'Hậu kì' },
        { id: 'settings', label: 'Cài Đặt' }
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
    } else if (activeSubTab === 'scene') {
      return renderSceneSettings();
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
    // Exclude physic planes (objects with src="/images/entry.jpg")
    const imageObjects = objects.filter(obj => obj.type === 'image' && obj.src !== '/images/entry.jpg');
    
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
        console.log('Updated existing inactive marker for image:', image.id, 'to index:', newIndex);
      } else if (onUpdateTourMarkers) {
        // Create a new tour marker for this image if none exists
        const newImageMarker = {
          id: `tourmarker-image-${image.id}-${Date.now()}`,
          type: 'image',
          imageId: image.id,
          index: newIndex,
          audio: null, // No audio initially
          position: null, // Image position will be used from scene
          rotation: null, // No specific camera rotation for image-only markers
          isImageMarker: true
        };
        
        const updatedTourMarkers = [...tourMarkers, newImageMarker];
        onUpdateTourMarkers(updatedTourMarkers);
        console.log('Created new image tour marker for image:', image.id, 'at index:', newIndex);
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
        
        // For camera markers, remove from tourMarkers array
        if (itemToRemove && itemToRemove.itemType === 'camera') {
          const markerId = `tourmarker-${itemId}`;
          const updatedTourMarkers = tourMarkers.filter(marker => marker.id !== markerId);
          
          if (onUpdateTourMarkers) {
            onUpdateTourMarkers(updatedTourMarkers);
          }
        }
        
        // For image markers without audio, also remove from tourMarkers array
        if (itemToRemove && itemToRemove.itemType === 'image' && !hasAudio) {
          // For image markers, find the marker by imageId (not by constructing marker ID)
          const updatedTourMarkers = tourMarkers.filter(marker => marker.imageId !== itemId);
          
          console.log('Toolbox: Removing image tour marker for imageId:', itemId);
          console.log('Tour markers before:', tourMarkers.length);
          console.log('Tour markers after:', updatedTourMarkers.length);
          
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
          // For items without audio (images or camera markers), remove completely
          // Use special value -999 to indicate complete removal
          onTempTourIndexChange(itemId, -999);
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
          Quản Lý Tour
        </div>
        
        <div className="tour-management-container">
          {/* Tour Images Table */}
          <div className="tour-table-container">
            {/* Table Header */}
            <div className="tour-table-header">
              Thứ Tự Tour
            </div>
            
            {/* Table Content */}
            <div className="tour-table-content">
              {tourItemsFromTemp.length === 0 ? (
                <div className="tour-empty-message">
                  Không có điểm Tour trong Tour
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
                      <GripVertical className="tour-drag-icon" />
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
                          <div className="tour-item-title">Điểm Camera</div>
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
                      <X size={12} />
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
                    Thêm Điểm Tranh {unindexedImages.length > 0 ? `(${unindexedImages.length})` : '(0)'}
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
                    Thêm Điểm Camera
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
          Tạo Tường
        </div>
        <img
          className="create-wall-image"
          src="https://placehold.co/125"
          title="Create a wall to ground"
          onClick={onCreateWall}
        />
      </div>
      <div className="image-frame-container">
        <div className='create-title'>
          Tạo Mặt Phẳng Vật Lý
        </div>
        <img
          className="create-wall-image"
          src={physicPlane.src}
          alt={physicPlane.alt}
          title="Drag a Image Frame to Wall"
          draggable
          onDragStart={e => {
            e.dataTransfer.setData('imageSrc', physicPlane.src);
            if (onImageDragStart) onImageDragStart(physicPlane);
          }}
          onClick={() => {
            if (onCreatePhysicPlane) {
              onCreatePhysicPlane();
            }
          }}
        />  
      </div>
      <div className="light-section">
        <div className='create-title'>
          Tạo Đèn
        </div>
        <button
          className="add-image-button"
          onClick={onCreateSpotLight}
        >
          + Thêm Đèn Chiếu
        </button>
      </div>
      {typeRoom === "template" && (
        <div className="light-section">
          <div className="create-title">
            Chọn Phòng GLB
          </div>

          <select
            defaultValue=""
            onChange={(e) => {
              const glbUrl = e.target.value;
              if (glbUrl) {
                importGLB(glbUrl); 
              }
            }}
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            <option value="">-- Chọn phòng --</option>

            {room3DData.map(room => (
              <option key={room.id} value={room.file_url}>
                {room.title}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );

  const renderImageTools = () => (
  <div>
      <div className="image-frame-container">
        <div className='create-title'>
          Tạo Khung Hình
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
          onClick={() => onCreateImageFrame && onCreateImageFrame()}
        />  
      </div>

      {/* ========== BUTTON CREATE IMAGE ========== */}
      <button
        className="add-image-button"
        onClick={() => setShowCreateArtwork(true)}
      >
        + Thêm Hình Ảnh
      </button>



      {/* ========== LIST IMAGE ========== */}
      <div className="image-buttons">
        {images.map((media) => {
          const isVideo = /\.(mp4|webm|ogg|mov)$/i.test(media.file_url);
          return (
            <>
              {isVideo ? (
                <video
                  className="image-button"
                  key={media.id}
                  src={media.file_url}
                  muted
                  preload="metadata"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("imageSrc", media.file_url);
                    if (onImageDragStart) onImageDragStart(media);
                  }}
                  onClick={() => {
                    setEditingArtwork(media);
                    setShowEditArtwork(true);
                  }}
                  onMouseEnter={(e) => e.currentTarget.play()}
                  onMouseLeave={(e) => {
                    e.currentTarget.pause();
                    e.currentTarget.currentTime = 0;
                  }}
                />
              ) : (
                <img
                  className="image-button"
                  key={media.id}
                  src={media.thumbnail ? `${media.thumbnail}&width=200` : media.file_url}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("imageSrc", media.file_url);
                    if (onImageDragStart) onImageDragStart(media);
                  }}
                  onClick={() => {
                    setEditingArtwork(media);
                    setShowEditArtwork(true);
                  }}
                />
              )}
            </>
          );
        })}
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
  );

  const renderAudioTools = () => (
    <div>
      <div className="audio-upload-section">
        <div className='create-title'>
          Tải Lên Âm Thanh
        </div>
        <button
          className="add-image-button"
          onClick={handleAudioUpload}
        >
          + Tải Lên Âm Thanh
        </button>
        <input
          ref={audioFileInputRef}
          type="file"
          accept="audio/*"
          style={{ display: 'none' }}
          onChange={handleAudioFileSelect}
        />
      </div>
      
      {audios.length > 0 && (
        <div className="audio-files-section">
          <div className='create-title'>
            Các Tệp Âm Thanh Đã Tải Lên
          </div>
          <div className="audio-files-list">
            {audios.map((audio) => (
              <div key={audio.id} className="audio-file-item">
                <div className="audio-file-info">
                  <span className="audio-file-name">{audio?.title}</span>
                  <div className="audio-file-controls">
                    <button
                      className="audio-preview-btn"
                      onClick={() => handleAudioPreview(audio)}
                    >
                      {currentPlayingAudio === audio.id ? 'Stop' : 'Play'}
                    </button>
                    <button
                      className="audio-remove-btn"
                      onClick={async () => {
                        try {
                          if (!audio?.id) return;

                          //Gọi API xóa trên server
                          await deleteAudio(audio.id);

                          //Cập nhật lại danh sách ảnh ngay lập tức
                          setAudios((prev) => prev.filter(aud => aud.id !== audio.id));

                          //Đóng modal

                          console.log(`Đã xóa audio ${audio.id} và cập nhật UI.`);
                        } catch (err) {
                          console.error("Lỗi khi xóa audio:", err);
                          alert("Không thể xóa audio này.");
                        }
                      }}
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
          Chỉnh Sửa Vật Lý
        </label>
        <div className="debug-setting-description">
          Cho phép hiển thị các bức tường trong suốt và mặt phẳng vật lý trong chế độ chỉnh sửa. Khi bị vô hiệu hóa, các bức tường trong suốt không thể được chọn.
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
          Chỉnh Sửa Phòng
        </label>
        <div className="debug-setting-description">
          Kích hoạt chế độ chỉnh sửa phòng để thay đổi cấu trúc và bố cục phòng.
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
              setHdri('sunset');
            } else if (mode === 'file') {
              setHdri(glbTextureList[0].alb);
            } else if (mode === 'sky') {
              setHdri(null);
            }
          }}
        >
          <option value="sky">Cài Đặt Tự Động</option>
          <option value="preset">Sử Dụng Mẫu Có Sẵn</option>
          <option value="file">Sử Dụng Tệp</option>
        </select>
      </div>

      {skySettingMode === 'sky' && (
        <>
          <DraggableAxisInput
            label="Khoảng Cách"
            value={skySettings.distance}
            onChange={(v) => setSkySettings((prev) => ({ ...prev, distance: v }))}
            step={1000}
          />
          <DraggableAxisInput
            label="Vị Trí Mặt Trời X"
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
            label="Vị Trí Mặt Trời Y"
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
            label="Vị Trí Mặt Trời Z"
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
            label="Độ Nghiêng"
            value={skySettings.inclination}
            onChange={(v) => setSkySettings((prev) => ({ ...prev, inclination: v }))}
            step={0.01}
          />
          <DraggableAxisInput
            label="Góc Phương Vị"
            value={skySettings.azimuth}
            onChange={(v) => setSkySettings((prev) => ({ ...prev, azimuth: v }))}
            step={0.01}
          />
          <DraggableAxisInput
            label="Độ Đục"
            value={skySettings.turbidity}
            onChange={(v) => setSkySettings((prev) => ({ ...prev, turbidity: v }))}
            step={0.1}
          />
          <DraggableAxisInput
            label="Tán Xạ Rayleigh"
            value={skySettings.rayleigh}
            onChange={(v) => setSkySettings((prev) => ({ ...prev, rayleigh: v }))}
            step={0.1}
          />
          <DraggableAxisInput
            label="Hệ Số Mie"
            value={skySettings.mieCoefficient}
            onChange={(v) => setSkySettings((prev) => ({ ...prev, mieCoefficient: v }))}
            step={0.001}
          />
          <DraggableAxisInput
            label="Hướng G Mie"
            value={skySettings.mieDirectionalG}
            onChange={(v) => setSkySettings((prev) => ({ ...prev, mieDirectionalG: v }))}
            step={0.01}
          />
          <DraggableAxisInput
            label="Độ Phơi Sáng"
            value={skySettings.exposure}
            onChange={(v) => setSkySettings((prev) => ({ ...prev, exposure: v }))}
            step={0.01}
          />
        </>
      )}
      {skySettingMode === 'file' && (
        <>
          <select onChange={(e) => setHdri(e.target.value)} value={hdri}>
            {glbTextureList.map((hdri) => (
              <option key={hdri.id} value={hdri.alb}>
                {hdri.title}
              </option>
            ))}
          </select>
        </>
      )}
      {skySettingMode === 'preset' && (
        <>
          <select onChange={(e) => setHdri(e.target.value)} value={hdri}>
              <option value="sunset"a>Hoàng Hôn</option>
              <option value="dawn">Bình Minh</option>
              <option value="night">Đêm</option>
              <option value="warehouse">Kho Hàng</option>
              <option value="forest">Rừng</option>
              <option value="apartment">Căn Hộ</option>
              <option value="studio">Phòng Thu</option>
              <option value="city">Thành Phố</option>
              <option value="park">Công Viên</option>
              <option value="lobby">Sảnh</option>
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
          <option value="ground">Cài Đặt Tự Động</option>
          <option value="preset">Sử Dụng Mẫu Có Sẵn</option>
          <option value="file">Sử Dụng Tệp</option>
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
                image: `/groundTexture/${file.title}`
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
                {frame.title}
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

  const renderSceneSettings = () => {
    return (
      <div>
        {/* Post-process Section */}
        <div className="setting-section">
          <h3 className="setting-section-title">Hậu xử lý</h3>
          
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
              Hiệu ứng Bloom
            </label>
            <div className="debug-setting-description">
              Bật hiệu ứng hậu xử lý Bloom cho các vật thể phát sáng và vật liệu phát sáng.
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

        {/* Background Audio Section */}
        <div className="setting-section">
          <h3 className="setting-section-title">
            Âm Thanh Nền
            {backgroundAudioLoading && (
              <span className="loading-spinner" style={{ marginLeft: '8px' }}></span>
            )}
          </h3>
          
          <div className="setting-group">
            <label>Âm Thanh Nền Lặp Lại:</label>
            <div style={{ position: 'relative' }}>
              <select
                value={backgroundAudio}
                onChange={(e) => onBackgroundAudioChange(e.target.value)}
                style={{ 
                  padding: '8px', 
                  borderRadius: '4px', 
                  width: '100%',
                  opacity: backgroundAudioLoading ? 0.7 : 1,
                  cursor: backgroundAudioLoading ? 'wait' : 'pointer'
                }}
                disabled={backgroundAudioLoading}
              >
                <option value="">Không có âm thanh nền</option>
                {audios.map((audio) => (
                  <option key={audio.id} value={audio.file_url}>
                    {audio.title || audio.original_filename || audio.file_url.split('/').pop()}
                  </option>
                ))}
              </select>
              {backgroundAudioLoading && (
                <div style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none'
                }}>
                  <div className="audio-loading-dot"></div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderObjectSettings = () => {
    // If no object is selected, show default message
    if (!selectedId || selectedId === "null") {
      return (
        <div className="object-settings-empty">
          <p>Chọn một vật thể để xem thông tin của nó</p>
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
          } else if (fieldConfig.type === 'color') {
            return (
              <div className="setting-group-color" key={fieldConfig.field}>
                <label>{fieldConfig.label}:</label>
                <ColorInput
                  value={value || '#ffffff'}
                  onChange={(v) => handleFieldChange(fieldConfig.field, v)}
                />
              </div>
            );
          } else if (fieldConfig.type === 'dimension') {
            return (
              <div className="setting-group" key={fieldConfig.field}>
                <label>{fieldConfig.label}:</label>
                <DraggableAxisInput
                  label={fieldConfig.label}
                  value={value || 0}
                  onChange={(v) => handleFieldChange(fieldConfig.field, v)}
                  step={fieldConfig.step}
                  suffix={fieldConfig.suffix}
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
                  {frame.name}
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
                  {frame.title}
                </option>
              ))}
            </select>
          );
        } else if (fieldConfig.type === 'dropdown' && fieldConfig.field === "audio") {
          return (
            <div className="setting-group" key={fieldConfig.field}>
              <label>{fieldConfig.label}:</label>
              <select
                value={value || ''}
                onChange={(e) => handleFieldChange(fieldConfig.field, e.target.value)}
                style={{ padding: '5px', borderRadius: '4px', width: '100%' }}
              >
                <option value="">No Audio</option>
                {uploadedAudioFiles.map((audio) => (
                  <option key={audio.id} value={audio.src}>
                    {audio.title || audio.src.split('/').pop()}
                  </option>
                ))}
              </select>
            </div>
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
          } else if (fieldConfig.type === 'readonly') {
            // Handle readonly fields for tour markers
            let displayValue = value;
            if (fieldConfig.field === 'linkedImage' && currentObject.imageId) {
              // Find the linked image and show its title
              const linkedImage = images.find(img => img.id === currentObject.imageId);
              displayValue = linkedImage ? linkedImage.title || linkedImage.alt || 'Untitled Image' : 'No Image Found';
            } else if (fieldConfig.field === 'audio') {
              displayValue = value ? `Audio: ${value.split('/').pop()}` : 'No Audio';
            } else if (fieldConfig.field === 'position' && Array.isArray(value)) {
              displayValue = `X: ${value[0]?.toFixed(2) || 0}, Y: ${value[1]?.toFixed(2) || 0}, Z: ${value[2]?.toFixed(2) || 0}`;
            }
            
            return (
              <div className="setting-group" key={fieldConfig.field}>
                <label>{fieldConfig.label}:</label>
                <div style={{ 
                  padding: '8px', 
                  background: '#f5f5f5', 
                  borderRadius: '4px', 
                  color: '#666',
                  fontStyle: 'italic'
                }}>
                  {displayValue || 'Not set'}
                </div>
              </div>
            );
          } else {
            return null;
          }
        })}
        
        {/* Image description toggle for image objects */}
        {currentObject && currentObject.type === 'image' && (
          <div className="image-settings-section">
            <div className="debug-setting">
              <label className="debug-setting-label">
                <input
                  type="checkbox"
                  checked={currentTransform.showImageDescription ?? true}
                  onChange={(e) => {
                    handleFieldChange('showImageDescription', e.target.checked);
                  }}
                  className="debug-setting-checkbox"
                />
                Hiển Thị Mô Tả Hình Ảnh
              </label>
            </div>
          </div>
        )}
      </div>
    );
  };

  const [newImage, setNewImage] = useState({ src: '', alt: '', title: '', description: '' });

  //State for edit selected model
  const [currentTransform, setCurrentTransform] = useState({});
  const [editableFields, setEditableFields] = useState([]);

  const currentObject = objects.find(obj => obj.id === selectedId) || 
                        tourMarkers.find(marker => marker.id === selectedId);

  // Check if the current object is a tour marker
  const isTourMarker = tourMarkers.some(marker => marker.id === selectedId);

  useEffect(() => {
    if (currentObject) {
      // Set up currentTransform with enhanced data for tour markers
      if (isTourMarker) {
        let enhancedTransform = { 
          ...currentObject,
          // Ensure required fields exist with proper defaults
          position: currentObject.position || [0, 0, 0],
          rotation: currentObject.rotation || [0, 0, 0],
          audio: currentObject.audio
        };

        // For image tour markers, calculate initial position if not present
        if (currentObject.type === 'image' && currentObject.imageId && !currentObject.position) {
          const linkedImage = objects.find(obj => obj.id === currentObject.imageId);
          if (linkedImage) {
            // Calculate position 2 units in front of the linked image
            const calculatedPosition = calculateImageMarkerPosition(linkedImage, objects);
            enhancedTransform.position = calculatedPosition;
            
            // Store this calculated position in the tour marker for future use
            if (onUpdateTourMarkers && selectedId) {
              const updatedMarkers = tourMarkers.map(marker => 
                marker.id === selectedId 
                  ? { ...marker, position: calculatedPosition }
                  : marker
              );
              onUpdateTourMarkers(updatedMarkers);
            }
          } else {
            // If no linked image found in objects, check in images array
            const linkedImageData = images.find(img => img.id === currentObject.imageId);
            if (linkedImageData) {
              // Images might not have position, so use default
              enhancedTransform.position = [0, 1.5, 0];
            }
          }
        }

        // Ensure position is always a valid array
        if (!Array.isArray(enhancedTransform.position)) {
          enhancedTransform.position = [0, 0, 0];
        }

        setCurrentTransform(enhancedTransform);
      } else {
        // Ensure default values for image objects
        const objectWithDefaults = { 
          ...currentObject,
          canvasColor: currentObject.canvasColor || 'white',
          frameColor: currentObject.frameColor || 'white',
          showImageDescription: currentObject.showImageDescription ?? true
        };

        // Calculate width and height for image objects
        if (currentObject.type === "image") {
  // metadata dạng: "NGANG x CAO" (cm)
  const rawSize = currentObject.description?.kich_thuoc_trong_khong_gian || "";
  const parts = rawSize.split(/x|×/i).map(s => Number(s.trim()));

  // chiều ngang (trước x), chiều cao (sau x) tính theo mét
  let ngang = 1, cao = 1;

  if (parts.length >= 2) {
    ngang = (parts[0] || 100) / 100; // cm → m
    cao   = (parts[1] || 100) / 100; // cm → m
  }

  const scale = currentObject.scale?.[1] ?? 1;

  // height = Chiều ngang, width = Chiều cao (theo label đang dùng)
  objectWithDefaults.height = ngang * scale; // Chiều ngang
  objectWithDefaults.width  = cao   * scale; // Chiều cao
}

        setCurrentTransform(objectWithDefaults);
      }

      // Set editable fields based on object type
      if (isTourMarker) {
        // Handle tour markers - check if it's a camera or image marker
        const isImageMarker = currentObject.type === 'image';
        if (isImageMarker) {
          // Image Tour Marker - Position (X,Z only) and Audio only
          setEditableFields([
            { field: 'position', label: 'Position', type: 'vector3', step: 0.01, suffix: 'm', subFields: [0, 2] }, // Hide Y position
            { field: 'audio', label: 'Audio', type: 'dropdown' },
          ]);
        } else {
          // Camera Tour Marker - Position (X,Z only), Rotation (Y only), and Audio
          setEditableFields([
            { field: 'position', label: 'Position', type: 'vector3', step: 0.01, suffix: 'm', subFields: [0, 2] }, // Hide Y position
            { field: 'rotation', label: 'Rotation', type: 'vector3', step: 0.1, suffix: '°', subFields: [1] }, // Hide X,Z rotation, show only Y
            { field: 'audio', label: 'Audio', type: 'dropdown' },
          ]);
        }
      } else if (currentObject.type === 'spawn') {
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
            { field: 'position', label: 'Position', type: 'vector3', step: 0.01, suffix: 'm' }, // Show all axes
            { field: 'rotation', label: 'Rotation', type: 'vector3', step: 0.1, suffix: '°', subFields: [1, 2] }, // Hide X-axis rotation, show Y,Z
            { field: 'scale', label: 'Scale', type: 'vector3', step: 0.1, subFields: [1] }, // Show only Y-axis scale
            { field: 'height', label: 'Chiều ngang', type: 'dimension', step: 0.01, suffix: 'm' },
            { field: 'width', label: 'Chiều cao', type: 'dimension', step: 0.01, suffix: 'm' },
            { field: 'imageFrameId', label: 'Khung tranh', type: 'dropdown' },
            { field: 'frameColor', label: 'Màu khung', type: 'color' },
            { field: 'canvasColor', label: 'Màu nền', type: 'color' },
          ]);
        } else {
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
  }, [selectedId, objects, tourMarkers, images]);

  const handleMetaSave = async () => {
    try {
      if (!editingImage?.id) throw new Error("Thiếu ID ảnh để cập nhật");

      // Gọi API PUT update metadata
      const res = await updateMedia(editingImage.id, {
        alt: meta.alt?.trim() || "",
        title: meta.title?.trim() || "",
        description: meta.description?.trim() || "",
      });

      // Cập nhật lại ảnh trong danh sách
      setImages(prev =>
        prev.map(img =>
          img.id === editingImage.id
            ? {
                ...img,
                alt: meta.alt,
                title: meta.title,
                description: meta.description,
              }
            : img
        )
      );

      console.log("Đã cập nhật metadata:", res);
      setEditingImage(null);
      setIsImageEditModalOpen(false);
    } catch (err) {
      console.error("Lỗi khi cập nhật metadata:", err);
      alert("Không thể cập nhật metadata: " + err.message);
    }
  };

  const handleAddImageSave = async (newImage) => {
    try {
      if (!newImage?.file) throw new Error("Thiếu file để upload");

      // Tạo trước URL tạm để hiển thị ngay
      const tempUrl = URL.createObjectURL(newImage.file);

      //Hiển thị ảnh mới ngay trong UI (cache)
      const tempImage = {
        id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        src: tempUrl,
        alt: newImage.alt || "",
        title: newImage.title || "",
        description: newImage.description || "",
      };
      setImages((prev) => [...prev, tempImage]);

      //Gửi ảnh lên server (nếu có API)
      await uploadMedia(
        newImage.file,
        newImage.tags || [],
        newImage.alt || "",
        newImage.title || "",
        newImage.description || ""
      );

      //Đóng modal
      setIsImageEditModalOpen(false);

      console.log("Ảnh đã upload (cache):", tempImage);
    } catch (err) {
      console.error("Lỗi upload:", err);
      alert("Không thể upload ảnh: " + err.message);
    }
  };

  const handleAudioUpload = () => {
    audioFileInputRef.current?.click();
  };

  const handleAudioFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Tạo URL tạm để hiển thị ngay trong UI
      const tempUrl = URL.createObjectURL(file);
      const tempAudio = {
        id: `temp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        file_url: tempUrl,
        original_filename: file.name,
        isTemp: true,
      };
      setAudios((prev) => [...prev, tempAudio]);

      //Gọi API upload thật
      const result = await uploadAudio(file);

      // Khi có kết quả, thay temp bằng bản chính thức
      if (result && result.success) {
        setAudios((prev) =>
          prev.map((aud) =>
            aud.id === tempAudio.id
              ? { ...result, file_url: result.file_url || result.url }
              : aud
          )
        );
        console.log("Uploaded audio:", result);
      } else {
        console.warn("Upload audio API returned no file_url", result);
        alert("Tải file thất bại — không có file_url");
        // Xóa audio tạm nếu lỗi
        setAudios((prev) => prev.filter((a) => a.id !== tempAudio.id));
      }
    } catch (error) {
      console.error("Upload audio failed:", error);
      alert("Tải file âm thanh thất bại!");
    } finally {
      e.target.value = null; // reset input
    }
  };

  const handleAudioPreview = (audio) => {
    const url = audio.file_url;
    if (!url) return alert("Không có URL hợp lệ để phát");

    if (currentPlayingAudio === audio.id) {
      currentAudioRef.current?.pause();
      currentAudioRef.current = null;
      setCurrentPlayingAudio(null);
    } else {
      currentAudioRef.current?.pause();
      const audioEl = new Audio(url);
      audioEl.play();
      audioEl.onended = () => {
        currentAudioRef.current = null;
        setCurrentPlayingAudio(null);
      };
      currentAudioRef.current = audioEl;
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

  // Khi chọn object -> tự động mở tab object và lưu tab trước đó
  useEffect(() => {
    if (selectedId) {
      // Store previous tab only if not already on object tab
      if (activeTab !== "object") {
        previousTabRef.current = activeTab;
      }
      setActiveTab("object");
      localStorage.setItem("toolboxActiveTab", "object");
    } else {
      // When deselecting, restore previous tab immediately if available
      if (previousTabRef.current) {
        const tabToRestore = previousTabRef.current;
        previousTabRef.current = null;
        setActiveTab(tabToRestore);
        localStorage.setItem("toolboxActiveTab", tabToRestore);
      }
    }
  }, [selectedId]);

  // Khi đổi tab manually -> clear object và clear previous tab reference
  useEffect(() => {
    localStorage.setItem("toolboxActiveTab", activeTab);
    if (activeTab !== "object") {
      setSelectedId(null);
      // Clear previous tab reference when manually changing tabs
      previousTabRef.current = null;
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeSubTab) {
      localStorage.setItem('toolboxActiveSubTab', activeSubTab);
    }
  }, [activeSubTab]);

  const handleFieldChange = (field, value, subIndex = null) => {
  setCurrentTransform(prev => {
    let updated = { ...prev };

    // ===== 1. CẬP NHẬT GIÁ TRỊ CƠ BẢN THEO FIELD =====
    if (Array.isArray(prev[field]) && subIndex !== null) {
      // vector3: position, rotation, scale...
      const arr = [...prev[field]];
      arr[subIndex] = value;
      updated[field] = arr;
    } else {
      // scalar: intensity, angle, penumbra, color, frameColor, canvasColor...
      updated[field] = value;
    }

    // ===== 2. WIDTH / HEIGHT CHO IMAGE (version chuẩn) =====
if (prev.type === "image" && (field === "width" || field === "height")) {
  // đọc kích thước thật từ metadata: "NGANG x CAO" (cm)
  const rawSize = prev.description?.kich_thuoc_trong_khong_gian || "";
  const parts = rawSize.split(/x|×/i).map(s => Number(s.trim()));

  let ngang = 1, cao = 1;

  if (parts.length >= 2) {
    ngang = (parts[0] || 100) / 100; // m
    cao   = (parts[1] || 100) / 100; // m
  }

  if (field === "width") {
    // width = Chiều cao → scale theo chiều CAO (sau chữ x)
    const scale = value / cao;
    updated.width  = value;          // Chiều cao
    updated.height = ngang * scale;  // Chiều ngang
    updated.scale  = [1, scale, 1];
  }

  if (field === "height") {
    // height = Chiều ngang → scale theo chiều NGANG (trước chữ x)
    const scale = value / ngang;
    updated.height = value;         // Chiều ngang
    updated.width  = cao * scale;   // Chiều cao
    updated.scale  = [1, scale, 1];
  }
}

    // ===== 3. SCALE Y (kéo trực tiếp scale) =====
    if (field === "scale" && subIndex === 1) {
  const newScale = value;
  updated.scale = [1, newScale, 1];

  if (prev.type === "image") {
    const rawSize = prev.description?.kich_thuoc_trong_khong_gian || "";
    const parts = rawSize.split(/x|×/i).map(s => Number(s.trim()));

    let ngang = 1, cao = 1;

    if (parts.length >= 2) {
      ngang = (parts[0] || 100) / 100;
      cao   = (parts[1] || 100) / 100;
    }

    // height = Chiều ngang, width = Chiều cao
    updated.height = ngang * newScale;
    updated.width  = cao   * newScale;
  }
}

    // ===== 4. ĐẨY RA SCENE / TOUR =====
    const isSelectedTourMarker = tourMarkers.some(marker => marker.id === selectedId);

    if (isSelectedTourMarker) {
      // Update tour marker
      if (onUpdateTourMarkers && selectedId) {
        const updatedMarkers = tourMarkers.map(marker =>
          marker.id === selectedId
            ? { ...marker, [field]: updated[field] }
            : marker
        );
        onUpdateTourMarkers(updatedMarkers);
      }
    } else {
      // Update object bình thường
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
          canvasColor: updated.canvasColor,
          albedo: updated.albedo,
          normal: updated.normal,
          orm: updated.orm,
          transparent: updated.transparent,
          width: updated.width,
          height: updated.height,
          showImageDescription: updated.showImageDescription,
        });
      }
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
          {isCollapsed ? <Menu size={24} /> : <X size={24} />}
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

      {showCreateArtwork && (
        <ArtworkCreateModal
          show={showCreateArtwork}
          onClose={() => setShowCreateArtwork(false)}
          onSuccess={async () => {
            const list = await getMediaList();
            setImages(list);
          }}
        />
      )}

      {showEditArtwork && editingArtwork && (
        <ArtworkEditModal
          show={showEditArtwork}
          image={editingArtwork}
          onClose={() => {
            setEditingArtwork(null);
            setShowEditArtwork(false);
          }}
          onSuccess={(updatedMeta) => {
            setImages(prev =>
              prev.map(img =>
                img.id === editingArtwork.id
                  ? { ...img, metadata: updatedMeta }
                  : img
              )
            );
          }}
        />
      )}
    </div>
  );
};

export default Toolbox;