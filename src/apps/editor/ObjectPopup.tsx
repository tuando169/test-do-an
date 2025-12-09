import React, { useState, useEffect } from "react";
import "./ObjectPopup.css";
import { HexColorPicker } from "react-colorful";

interface ObjectPopupProps {
  images?: { id: string; title?: string; src: string }[];
  visible: boolean;
  mousePosition: { x: number; y: number };
  objects: { id: string; type: string; color?: string; src?: string; title?: string; intensity?: number; angle?: number; penumbra?: number }[];
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  onClose: () => void;
  setGizmoMode: (mode: string) => void;
  onDelete: () => void;
  onColorChange: (color: string) => void;
  wallTextureList: {
    id: string;
    name: string;
    alb: string;
    nor: string;
    orm: string;
  }[];
  onTextureChange: (texture: {
    id: string;
    name: string;
    alb: string;
    nor: string;
    orm: string;
  }) => void;
  frameList: {
    id: string;
    name: string;
    src: string;   // ảnh frame PNG
  }[];
  onFrameChange: (frame: {
    id: string;
    name: string;
    src: string;
  }) => void;
  onLightChange?: (id: string, changes: Partial<{ intensity: number; angle: number; penumbra: number }>) => void;
  replaceImageOnFrame?: (frameId: string, newImage: { id: string; title?: string; src: string }) => void;
  handleCreateSpotLightForImage?: (imageId: string) => void;
  handleAddOrReplaceAudio?: (selectedId: string, audioUrl: string) => void;
  soundController?: any; // SoundController instance
  // Tour marker props
  tourMarkers?: Array<{ id: string; imageId?: string; audio?: string; index?: number }>;
  onUpdateTourMarkers?: (markers: Array<{ id: string; imageId?: string; audio?: string; index?: number }>) => void;
  uploadedAudioFiles?: Array<{ id: string; src: string; title?: string }>;
  onSave?: () => void; // Function to trigger save after tour marker updates
  onTempTourIndexChange?: (imageId: string, index: number) => void; // Function to update temp tour indices
}

const ObjectPopup: React.FC<ObjectPopupProps> = (props) => {
  const {
    visible,
    mousePosition,
    objects,
    selectedId,
    setSelectedId,
    onClose,
    setGizmoMode,
    onDelete,
    wallTextureList,
  } = props;

  const [showColorPicker, setShowColorPicker] = useState(false);
  const [currentColor, setCurrentColor] = useState("#ffffff");
  const [showTexturePicker, setShowTexturePicker] = useState(false);
  const [textureCenter, setTextureCenter] = useState<{ x: number; y: number } | null>(null);
  const [showFramePicker, setShowFramePicker] = useState(false);
  const [frameCenter, setFrameCenter] = useState<{ x: number; y: number } | null>(null);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [activeSlider, setActiveSlider] = useState<null | "intensity" | "angle" | "penumbra">(null);
  const [sliderValue, setSliderValue] = useState<number>(1);
  const [showAddSubmenu, setShowAddSubmenu] = useState(false);
  const [addMenuCenter, setAddMenuCenter] = useState<{ x: number; y: number } | null>(null);
  const [showAudioPicker, setShowAudioPicker] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  // Extract soundController from props
  const soundController = props.soundController;



  const startAngle = -90;
  const currentObject = objects.find((obj) => obj.id === selectedId);

  useEffect(() => {
    if (currentObject?.color) {
      setCurrentColor(currentObject.color);
    }
  }, [currentObject?.color, selectedId, showColorPicker]);

  // Cleanup audio when popup closes or component unmounts
  useEffect(() => {
    return () => {
      if (soundController && selectedId) {
        const audioId = `object_audio_${selectedId}`;
        soundController.stopAudio?.(audioId);
      }
      setIsPlaying(false);
    };
  }, [selectedId, soundController]);

  // Stop audio when popup becomes invisible
  useEffect(() => {
    if (!visible && isPlaying && soundController && selectedId) {
      const audioId = `object_audio_${selectedId}`;
      soundController.stopAudio?.(audioId);
      setIsPlaying(false);
    }
  }, [visible, isPlaying, soundController, selectedId]);

  const getAttributesByType = (type: string, src: string): string[] => {
    switch (type) {
      case "wall":
        return ["Position", "Rotation", "Scale", "Color", "Texture", "Delete"];

      case "image": {
        // Nếu là frame (ảnh khung PNG)
        if (src?.includes("imageFrame")) {
          return ["Position", "Rotation", "Select image", "Delete"];
        }
        // Nếu là ảnh bình thường
        return ["Position", "Rotation", "Scale", "Color", "Add", "Delete"];
      }

      case "spotLight":
        return ["Position", "Rotation", "intensity", "Color", "Angle", "Penumbra", "Delete"];

      case "spawn":
        return ["Position", "Rotation"];

      default:
        return [];
    }
  };

  const menuItems = currentObject ? getAttributesByType(currentObject.type, currentObject.src || '') : [];

  if (!selectedId || !currentObject) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="popup-overlay"
        onClick={() => {
          setGizmoMode("");
          onClose();
        }}
      ></div>

      {/* Popup chính */}
      <div
        className={`object-popup ${visible ? "show" : "hide"}`}
        style={{
          left: `${mousePosition.x - 25}px`,
          top: `${mousePosition.y - 20}px`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="popup-circle-menu">
          {/* Menu chính */}
          {!showTexturePicker && !showFramePicker && !showAddSubmenu &&
            menuItems.map((item, index) => {
              const angle = startAngle + (360 / menuItems.length) * index;
              const radius = 100;
              const x = radius * Math.cos((angle * Math.PI) / 180);
              const y = radius * Math.sin((angle * Math.PI) / 180);

              return (
                <button
                  key={item}
                  className="circle-button"
                  style={{
                    transform: `translate(${x}px, ${y}px)`,
                    animationDelay: `${index * 50}ms`,
                    "--x": `${x}px`,
                    "--y": `${y}px`,
                  } as React.CSSProperties & { [key: string]: string }}
                  title={item}
                  onClick={(e) => {
                    switch (item) {
                      case "Position":
                        setGizmoMode("translate");
                        onClose();
                        break;
                      case "Rotation":
                        setGizmoMode("rotate");
                        onClose();
                        break;
                      case "Scale":
                        setGizmoMode("scale");
                        onClose();
                        break;
                      case "Color":
                        setShowColorPicker(!showColorPicker);
                        break;
                      case "Texture": {
                        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                        const cx = rect.left + rect.width / 2;
                        const cy = rect.top + rect.height / 2;
                        console.log("Texture center:", cx, cy);
                        setTextureCenter({ x: cx, y: cy });
                        setShowTexturePicker(true);
                        break;
                      }
                      case "Add": {
                        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                        const cx = rect.left + rect.width / 2;
                        const cy = rect.top + rect.height / 2;
                        setAddMenuCenter({ x: cx, y: cy });
                        setShowAddSubmenu(true);
                        break;
                      }
                      case "intensity":
                        setActiveSlider("intensity");
                        setSliderValue(currentObject?.intensity ?? 1);
                        break;
                      case "Angle":
                        setActiveSlider("angle");
                        setSliderValue(currentObject?.angle ?? 30);
                        break;
                      case "Penumbra":
                        setActiveSlider("penumbra");
                        setSliderValue(currentObject?.penumbra ?? 0.5);
                        break;
                      case "Delete":
                        onDelete();
                        onClose();
                        break;
                      case "Select image":
                        setShowImagePicker(!showImagePicker);
                        break;
                      default:
                        setSelectedId(null);
                        onClose();
                        break;
                    }
                  }}
                >
                  {item}
                </button>
              );
            })}
        </div>
      </div>

      {/* Menu con Texture */}
      {showTexturePicker &&
        textureCenter &&
        wallTextureList.map((texture, index) => {
          const angle = startAngle + (360 / wallTextureList.length) * index;
          const radius = 80;

          const x = textureCenter.x + radius * Math.cos((angle * Math.PI) / 180);
          const y = textureCenter.y + radius * Math.sin((angle * Math.PI) / 180);

          return (
            <button
              key={texture.id}
              className="circle-button"
              style={{
                position: "fixed",
                zIndex: 10001,
                left: `${x-25}px`,
                top: `${y-20}px`,
                transform: "translate(-50%, -50%)",
                animationDelay: `${index * 50}ms`,
              }}
              title={texture.name}
              onClick={() => {
                if (props.selectedId) {
                  props.onTextureChange?.(texture);
                }
                setShowTexturePicker(false);
                onClose();
              }}
            >
              {texture.name}
            </button>
          );
        })
      }

      {showAddSubmenu && addMenuCenter && (
        ["Frame", "Text", "Light", "Audio"].map((item, index) => {
          const angle = startAngle + (360 / 4) * index;
          const radius = 80;
          const x = addMenuCenter.x + radius * Math.cos((angle * Math.PI) / 180);
          const y = addMenuCenter.y + radius * Math.sin((angle * Math.PI) / 180);

          return (
            <button
              key={item}
              className="circle-button"
              style={{
                position: "fixed",
                zIndex: 10001,
                left: `${x - 25}px`,
                top: `${y - 20}px`,
                transform: "translate(-50%, -50%)",
                animationDelay: `${index * 50}ms`,
              }}
              title={item}
              onClick={(e) => {
                switch (item) {
                  case "Frame":
                    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                    const cx = rect.left + rect.width / 2;
                    const cy = rect.top + rect.height / 2;
                    setFrameCenter({ x: cx, y: cy });
                    setShowFramePicker(true);
                    setShowAddSubmenu(false);
                    break;
                  case "Text":
                    alert("👉 TODO: Open text creation popup here");
                    setShowAddSubmenu(false);
                    break;
                  case "Light":
                    if (props.selectedId) {
                      // Gọi hàm Scene qua ref cha
                      props.handleCreateSpotLightForImage?.(props.selectedId);
                    }
                    setShowAddSubmenu(false);
                    onClose();
                    break;
                  case "Audio": {
                    setShowAddSubmenu(false);
                    setShowAudioPicker(true);
                    break;
                  }
                  default:
                    setShowAddSubmenu(false);
                }
              }}
            >
              {item}
            </button>
          );
        })
      )}
      
      {showFramePicker && frameCenter &&
        props.frameList.map((frame, index) => {
          const angle = startAngle + (360 / props.frameList.length) * index;
          const radius = 80;
          const x = frameCenter.x + radius * Math.cos((angle * Math.PI) / 180);
          const y = frameCenter.y + radius * Math.sin((angle * Math.PI) / 180);

          return (
            <button
              key={frame.id}
              className="circle-button"
              style={{
                position: "fixed",
                zIndex: 10001,
                left: `${x-25}px`,
                top: `${y-20}px`,
                transform: "translate(-50%, -50%)",
                animationDelay: `${index * 50}ms`,
              }}
              title={frame.id}
              onClick={() => {
                props.onFrameChange?.(frame);
                setShowFramePicker(false);
                onClose();
              }}
            >
              {frame.id}
            </button>
          );
        })}

      {/* Color Picker */}
      {showColorPicker && (
        <div
          style={{
            position: "fixed",
            left: `${mousePosition.x + 140}px`,
            top: `${mousePosition.y + 100}px`,
            transform: "translateX(-50%)",
            background: "#fff",
            padding: "10px",
            borderRadius: "8px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
            zIndex: 10000,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <HexColorPicker
            color={currentColor}
            onChange={(newColor) => {
              setCurrentColor(newColor);

              if (currentObject?.type === "wall") {
                props.onColorChange?.(newColor); // đổi màu tường
              } else if (currentObject?.type === "image") {
                props.onTextureChange?.({
                  id: currentObject.id,
                  name: currentObject.title || "image",
                  alb: "",
                  nor: "",
                  orm: "",
                }); // giữ nguyên nếu muốn đổi texture frame
                // thêm callback riêng cho frameColor
                props.onColorChange?.(newColor); // đổi màu khung
              } else if (currentObject?.type === "spotLight") {
                props.onColorChange?.(newColor); // đổi màu đèn
              }
            }}
          />
        </div>
      )}
      {/* Image Picker (tab cuộn danh sách ảnh) */}
      {showImagePicker && (
        <div
          style={{
            position: "fixed",
            left: `${mousePosition.x + 45}px`,
            top: `${mousePosition.y + 50}px`,
            width: "320px",
            height: "300px",
            background: "rgba(255, 255, 255, 0.97)",
            borderRadius: "8px",
            boxShadow: "0 4px 10px rgba(0,0,0,0.25)",
            overflowY: "auto",
            padding: "10px",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            zIndex: 10001,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <h4 style={{ margin: "0 0 8px 0", fontSize: "14px", fontWeight: "600" }}>
            Select an image
          </h4>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))",
              gap: "8px",
            }}
          >
            {props.images && props.images.length > 0 ? (
              props.images.map((img) => (
                <div
                  key={img.id}
                  style={{
                    border: "2px solid transparent",
                    borderRadius: "6px",
                    cursor: "pointer",
                    overflow: "hidden",
                    background: "#f9f9f9",
                  }}
                  onClick={() => {
                    // Đổi ảnh của frame đang chọn
                    if (props.selectedId) {
                      props.replaceImageOnFrame?.(props.selectedId, img);
                    }
                    setShowImagePicker(false);
                    onClose();
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.border = "2px solid #4cc9f0")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.border = "2px solid transparent")
                  }
                >
                  <img
                    src={img.src}
                    alt={img.title || "image"}
                    style={{
                      width: "100%",
                      height: "70px",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                  <p
                    style={{
                      fontSize: "10px",
                      textAlign: "center",
                      color: "#333",
                      margin: "4px 0",
                    }}
                  >
                    {img.title || "image"}
                  </p>
                </div>
              ))
            ) : (
              <p style={{ color: "#666", fontSize: "12px" }}>No images available</p>
            )}
          </div>
        </div>
      )}

      {/* Audio Picker */}
      {showAudioPicker && currentObject && currentObject.type === "image" && (
        <div
          style={{
            position: "fixed",
            left: `${mousePosition.x + 170}px`,
            top: `${mousePosition.y + 100}px`,
            transform: "translateX(-50%)",
            background: "#fff",
            padding: "12px",
            borderRadius: "8px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
            zIndex: 10000,
            width: "260px",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <h4 style={{ margin: "0 0 8px", fontSize: "14px" }}>🎧 Audio for image</h4>

          {(() => {
            // Find existing tour marker for this image
            const existingMarker = props.tourMarkers?.find(marker => marker.imageId === selectedId);
            const hasAudio = existingMarker?.audio;

            return (
              <>
                {/* Display current audio status */}
                {hasAudio ? (
                  <p style={{ fontSize: "13px", marginBottom: "8px" }}>
                    Current: <a href={existingMarker.audio} target="_blank" rel="noreferrer">
                      {existingMarker.audio?.split('/').pop()}
                    </a>
                  </p>
                ) : (
                  <p style={{ fontSize: "13px", color: "#666", marginBottom: "8px" }}>No audio assigned</p>
                )}

                {/* Play/Pause controls if audio exists */}
                {hasAudio && (
                  <div style={{ marginBottom: "8px" }}>
                    <button
                      style={{
                        padding: "5px 10px",
                        borderRadius: "6px",
                        border: "1px solid #ccc",
                        background: "#f3f3f3",
                        cursor: "pointer",
                      }}
                      onClick={async () => {
                        const audioId = `object_audio_${selectedId}`;
                        
                        if (isPlaying) {
                          if (soundController) {
                            soundController.stopAudio?.(audioId);
                          }
                          setIsPlaying(false);
                        } else {
                          if (soundController && existingMarker?.audio) {
                            try {
                              await soundController.ensureInitialized?.();
                              await soundController.playAudio(existingMarker.audio, {
                                id: audioId,
                                volume: 0.7,
                                onEnded: () => setIsPlaying(false)
                              });
                              setIsPlaying(true);
                            } catch (error) {
                              console.warn("Failed to play object audio:", error);
                              setIsPlaying(false);
                            }
                          }
                        }
                      }}
                    >
                      {isPlaying ? "⏸ Pause" : "▶ Play"}
                    </button>
                  </div>
                )}

                {/* Remove audio button if audio exists */}
                {hasAudio && (
                  <div style={{ marginBottom: "8px" }}>
                    <button
                      style={{
                        padding: "5px 10px",
                        borderRadius: "6px",
                        border: "1px solid #dc3545",
                        background: "#fff",
                        color: "#dc3545",
                        cursor: "pointer",
                      }}
                      onClick={() => {
                        console.log('🗑 Remove Audio clicked for existingMarker:', existingMarker);
                        if (props.onUpdateTourMarkers && props.tourMarkers && existingMarker) {
                          if (existingMarker.index === -1) {
                            console.log('🔥 Removing inactive marker completely:', existingMarker.id, 'for image:', existingMarker.imageId);
                            // For inactive markers (index -1), remove the marker completely
                            const updatedMarkers = props.tourMarkers.filter(marker => 
                              marker.id !== existingMarker.id
                            );
                            console.log('🔥 Updated markers after removal:', updatedMarkers.length, 'markers remaining');
                            props.onUpdateTourMarkers(updatedMarkers);
                            
                            // Also remove from tempTourIndices by calling onTempTourIndexChange with deletion
                            if (props.onTempTourIndexChange && existingMarker.imageId) {
                              console.log('🔥 Calling onTempTourIndexChange with -999 for imageId:', existingMarker.imageId);
                              // Use a special value to indicate deletion from tempTourIndices
                              props.onTempTourIndexChange(existingMarker.imageId, -999); // -999 signals complete removal
                            }
                          } else {
                            console.log('🔧 Removing audio from active marker:', existingMarker.id, 'index:', existingMarker.index);
                            // For active markers, just remove the audio and update tempTourIndices
                            const updatedMarkers = props.tourMarkers.map(marker => 
                              marker.id === existingMarker.id 
                                ? { ...marker, audio: undefined }
                                : marker
                            );
                            props.onUpdateTourMarkers(updatedMarkers);
                            
                            // Update tempTourIndices to reflect the change without saving
                            if (props.onTempTourIndexChange && existingMarker.imageId && existingMarker.index !== undefined) {
                              props.onTempTourIndexChange(existingMarker.imageId, existingMarker.index);
                            }
                          }
                          
                          setShowAudioPicker(false);
                        }
                      }}
                    >
                      🗑 Remove Audio
                    </button>
                  </div>
                )}

                {/* Audio selection from uploaded files */}
                {props.uploadedAudioFiles && props.uploadedAudioFiles.length > 0 && (
                  <div style={{ marginBottom: "10px" }}>
                    <label style={{ display: "block", fontSize: "12px", marginBottom: "4px", color: "#444" }}>
                      Select from uploaded audio:
                    </label>
                    <select
                      style={{
                        width: "100%",
                        padding: "5px",
                        fontSize: "12px",
                        border: "1px solid #ccc",
                        borderRadius: "4px",
                        marginBottom: "8px",
                      }}
                      value={audioUrl || ""}
                      onChange={(e) => setAudioUrl(e.target.value)}
                    >
                      <option value="">Select audio file...</option>
                      {props.uploadedAudioFiles.map((audio) => (
                        <option key={audio.id} value={audio.src}>
                          {audio.title || audio.src.split('/').pop()}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Manual URL input */}
                <div style={{ marginTop: "10px" }}>
                  <label style={{ display: "block", fontSize: "12px", marginBottom: "4px", color: "#444" }}>
                    Or paste audio URL:
                  </label>
                  <input
                    type="text"
                    placeholder="https://example.com/audio.mp3"
                    value={audioUrl || ""}
                    onChange={(e) => setAudioUrl(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "5px",
                      fontSize: "12px",
                      border: "1px solid #ccc",
                      borderRadius: "4px",
                      marginBottom: "8px",
                    }}
                  />

                  <button
                    style={{
                      background: "#4cc9f0",
                      border: "none",
                      color: "#fff",
                      padding: "6px 10px",
                      borderRadius: "4px",
                      cursor: "pointer",
                    }}
                    onClick={() => {
                      if (props.onUpdateTourMarkers && props.tourMarkers && selectedId && audioUrl) {
                        // Find or create tour marker for this image
                        let updatedMarkers = [...props.tourMarkers];
                        
                        if (existingMarker) {
                          // Update existing marker
                          updatedMarkers = updatedMarkers.map(marker => 
                            marker.id === existingMarker.id 
                              ? { ...marker, audio: audioUrl }
                              : marker
                          );
                          
                          // Update tempTourIndices to reflect the change without saving
                          if (props.onTempTourIndexChange && existingMarker.imageId && existingMarker.index !== undefined) {
                            props.onTempTourIndexChange(existingMarker.imageId, existingMarker.index);
                          }
                        } else {
                          // Create new inactive marker (index -1) for this image
                          const newMarker = {
                            id: `tourmarker-${selectedId}`,
                            imageId: selectedId,
                            type: 'image', // Add type field to identify as image marker
                            audio: audioUrl,
                            index: -1 // Inactive marker
                          };
                          updatedMarkers.push(newMarker);
                          console.log('✅ Created new inactive tour marker for image:', selectedId, 'with audio:', audioUrl);
                          
                          // Add to temp tour indices so it appears in tour management
                          if (props.onTempTourIndexChange) {
                            props.onTempTourIndexChange(selectedId, -1);
                          }
                        }
                        
                        props.onUpdateTourMarkers(updatedMarkers);
                        
                        setShowAudioPicker(false);
                        setAudioUrl(null);
                      }
                    }}
                    disabled={!audioUrl}
                  >
                    Save Audio
                  </button>
                </div>

                {/* Close button */}
                <div style={{ textAlign: "right", marginTop: "10px" }}>
                  <button
                    style={{
                      border: "none",
                      background: "transparent",
                      color: "#999",
                      cursor: "pointer",
                    }}
                    onClick={() => {
                      setShowAudioPicker(false);
                      setAudioUrl(null);
                    }}
                  >
                    Close
                  </button>
                </div>
              </>
            );
          })()}
        </div>
      )}

      {activeSlider && (
        <div
          style={{
            position: "fixed",
            left: `${mousePosition.x - 280}px`,
            top: `${mousePosition.y + 70}px`,
            background: "#fff",
            padding: "10px",
            borderRadius: "8px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
            zIndex: 10000,
            width: "200px"
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <label style={{ display: "block", marginBottom: "5px" }}>
            {activeSlider}: {sliderValue.toFixed(2)}
          </label>
          <input
            type="range"
            max={activeSlider === "angle" ? 180 : activeSlider === "intensity" ? 1000 : 1}
            step={0.01}
            value={sliderValue}
            onChange={(e) => {
              const newVal = parseFloat(e.target.value);
              setSliderValue(newVal);

              if (props.selectedId) {
                // thay bằng onLightChange
                if (props.onLightChange) {
                  props.onLightChange(props.selectedId, {
                    [activeSlider]: newVal,
                  });
                }
              }
            }}
          />
        </div>
      )}
    </>
  );
};

export default ObjectPopup;
