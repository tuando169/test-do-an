import React, { useState, useEffect } from "react";
import "./ObjectPopup.css";
import { HexColorPicker } from "react-colorful";

const ObjectPopup = (props) => {
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
    pagination,
    setPage,
    page,
  } = props;

  const [showColorPicker, setShowColorPicker] = useState(false);
  const [currentColor, setCurrentColor] = useState("#ffffff");
  const [showTexturePicker, setShowTexturePicker] = useState(false);
  const [textureCenter, setTextureCenter] = useState(null);
  const [showFramePicker, setShowFramePicker] = useState(false);
  const [frameCenter, setFrameCenter] = useState(null);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [activeSlider, setActiveSlider] = useState(null);
  const [sliderValue, setSliderValue] = useState(1);
  const [showAddSubmenu, setShowAddSubmenu] = useState(false);
  const [addMenuCenter, setAddMenuCenter] = useState(null);
  const [showAudioPicker, setShowAudioPicker] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [searchText, setSearchText] = useState("");

  // Extract soundController from props  
  const soundController = props.soundController;

  const startAngle = -90;
  const selectedObject = objects.find((obj) => obj.id === selectedId);

  // Initialize audio URL when audio picker opens
  useEffect(() => {
    if (showAudioPicker && selectedObject) {
      let existingMarker;
      if (selectedObject.type === "tourmarker") {
        existingMarker = props.tourMarkers?.find(marker => marker.id === selectedId);
      } else {
        existingMarker = props.tourMarkers?.find(marker => marker.imageId === selectedId);
      }
      
      if (existingMarker?.audio) {
        setAudioUrl(existingMarker.audio);
      } else {
        setAudioUrl(null);
      }
    }
  }, [showAudioPicker, selectedObject, props.tourMarkers, selectedId]);

  useEffect(() => {
    if (selectedObject?.color) {
      setCurrentColor(selectedObject.color);
    }
  }, [selectedObject?.color, selectedId, showColorPicker]);

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

  const getAttributesByType = (type, src) => {
    switch (type) {
      case "wall":
        return ["Vị Trí", "Xoay", "Kích Thước", "Màu Sắc", "Kết Cấu", "Xóa"];

      case "image": {
        // Nếu là frame (ảnh khung PNG)
        if (src?.includes("imageFrame")) {
          return ["Vị Trí", "Xoay", "Chọn hình ảnh", "Xóa"];
        }
        // Nếu là ảnh bình thường
        return ["Vị Trí", "Xoay", "Kích Thước", "Màu Sắc", "Thêm", "Xóa"];
      }

      case "spotLight":
        return ["Vị Trí", "Xoay", "Độ Sáng", "Màu Sắc", "Góc", "Độ Mờ", "Xóa"];

      case "spawn":
        return ["Vị Trí", "Xoay"];

      case "tourmarker": {
        // Check if it's a camera marker or image marker
        const tourMarker = props.tourMarkers?.find(m => m.id === selectedId);
        if (tourMarker?.type === 'camera') {
          return ["Vị Trí", "Xoay", "Âm Thanh", "Xóa"];
        } else {
          // Image marker - position, audio and delete
          return ["Vị Trí", "Âm Thanh", "Xóa"];
        }
      }

      default:
        return [];
    }
  };

  const filteredImages = props.images?.filter((media) => {
    const name =
      media.metadata?.tieu_de ||
      media.title ||
      media.original_filename ||
      "";
    return name.toLowerCase().includes(searchText.toLowerCase());
  });

  const menuItems = selectedObject ? getAttributesByType(selectedObject.type, selectedObject.src || '') : [];

  if (!selectedId || !selectedObject) return null;

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
                  }}
                  title={item}
                  onClick={(e) => {
                    switch (item) {
                      case "Vị Trí":
                        setGizmoMode("translate");
                        onClose();
                        break;
                      case "Xoay":
                        setGizmoMode("rotate");
                        onClose();
                        break;
                      case "Kích Thước":
                        setGizmoMode("scale");
                        onClose();
                        break;
                      case "Màu Sắc":
                        setShowColorPicker(!showColorPicker);
                        break;
                      case "Kết Cấu": {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const cx = rect.left + rect.width / 2;
                        const cy = rect.top + rect.height / 2;
                        console.log("Texture center:", cx, cy);
                        setTextureCenter({ x: cx, y: cy });
                        setShowTexturePicker(true);
                        break;
                      }
                      case "Thêm": {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const cx = rect.left + rect.width / 2;
                        const cy = rect.top + rect.height / 2;
                        setAddMenuCenter({ x: cx, y: cy });
                        setShowAddSubmenu(true);
                        break;
                      }
                      case "Độ Sáng":
                        setActiveSlider("intensity");
                        setSliderValue(selectedObject?.intensity ?? 1);
                        break;
                      case "Góc":
                        setActiveSlider("angle");
                        setSliderValue(selectedObject?.angle ?? 30);
                        break;
                      case "Độ Mờ":
                        setActiveSlider("penumbra");
                        setSliderValue(selectedObject?.penumbra ?? 0.5);
                        break;
                      case "Xóa":
                        onDelete();
                        onClose();
                        break;
                      case "Chọn hình ảnh":
                        setShowImagePicker(!showImagePicker);
                        break;
                      case "Âm Thanh":
                        setShowAudioPicker(true);
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
              title={texture.title}
              onClick={() => {
                if (props.selectedId) {
                  props.onTextureChange?.(texture);
                }
                setShowTexturePicker(false);
                onClose();
              }}
            >
              {texture.title}
            </button>
          );
        })
      }

      {showAddSubmenu && addMenuCenter && (
        ["Khung", "Văn Bản", "Đèn", "Âm Thanh"].map((item, index) => {
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
                  case "Khung":
                    const rect = e.currentTarget.getBoundingClientRect();
                    const cx = rect.left + rect.width / 2;
                    const cy = rect.top + rect.height / 2;
                    setFrameCenter({ x: cx, y: cy });
                    setShowFramePicker(true);
                    setShowAddSubmenu(false);
                    break;
                  case "Văn Bản":
                    alert("👉 TODO: Mở popup tạo văn bản tại đây");
                    setShowAddSubmenu(false);
                    break;
                  case "Đèn":
                    if (props.selectedId) {
                      // Gọi hàm Scene qua ref cha
                      props.handleCreateSpotLightForImage?.(props.selectedId);
                    }
                    setShowAddSubmenu(false);
                    onClose();
                    break;
                  case "Âm Thanh": {
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

              if (selectedObject?.type === "wall") {
                props.onColorChange?.(newColor); // đổi màu tường
              } else if (selectedObject?.type === "image") {
                props.onTextureChange?.({
                  id: selectedObject.id,
                  name: selectedObject.title || "image",
                  alb: "",
                  nor: "",
                  orm: "",
                }); // giữ nguyên nếu muốn đổi texture frame
                // thêm callback riêng cho frameColor
                props.onColorChange?.(newColor); // đổi màu khung
              } else if (selectedObject?.type === "spotLight") {
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
            Chọn một hình ảnh
          </h4>
          <input
              type="text"
              placeholder="Tìm kiếm ảnh..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{
                padding: "6px 8px",
                border: "1px solid #ccc",
                borderRadius: "6px",
                marginBottom: "10px",
                fontSize: "12px",
              }}
            />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))",
              gap: "8px",
            }}
          >
            {filteredImages && filteredImages.length > 0 ? (
              filteredImages.map((media) => {
                const isVideo = /\.(mp4|webm|ogg|mov)$/i.test(media.file_url);
                return (
                  <div
                    key={media.id}
                    style={{
                      border: "2px solid transparent",
                      borderRadius: "6px",
                      cursor: "pointer",
                      overflow: "hidden",
                      background: "#f9f9f9",
                    }}
                    onClick={() => {
                      // Đổi ảnh hoặc video của frame đang chọn
                      if (props.selectedId) {
                        props.replaceImageOnFrame?.(props.selectedId, media);
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
                    {isVideo ? (
                      <video
                        src={media.file_url}
                        title={media.title || "video"}
                        muted
                        preload="metadata"
                        style={{
                          width: "100%",
                          height: "70px",
                          objectFit: "cover",
                          display: "block",
                          backgroundColor: "#000",
                        }}
                        onMouseEnter={(e) => e.currentTarget.play()}
                        onMouseLeave={(e) => {
                          e.currentTarget.pause();
                          e.currentTarget.currentTime = 0;
                        }}
                      />
                    ) : (
                      <img
                        src={media.thumbnail ? `${media.thumbnail}&width=200` : media.file_url}
                        alt={media.title || "image"}
                        style={{
                          width: "100%",
                          height: "100px",
                          objectFit: "contain",
                          display: "block",
                        }}
                      />
                    )}
                    <p
                      style={{
                        fontSize: "10px",
                        textAlign: "center",
                        color: "#333",
                        margin: "4px 0",
                      }}
                    >
                      {media.metadata.tieu_de || (isVideo ? "video" : "image")}
                    </p>
                  </div>
                );
              })
            ) : (
              <p style={{ color: "#666", fontSize: "12px" }}>Không có phương tiện nào</p>
            )}
          </div>
          {pagination && setPage && (
            <div style={{
              marginTop: "10px",
              display: "flex",
              justifyContent: "space-between",
              fontSize: "12px",
              alignItems: "center"
            }}>
              <button
                disabled={!pagination.has_prev}
                style={{
                  padding: "4px 8px",
                  opacity: pagination.has_prev ? 1 : 0.5,
                  cursor: pagination.has_prev ? "pointer" : "default"
                }}
                onClick={() => setPage(page - 1)}
              >
                ◀ Trước
              </button>

              <span>
                Trang {pagination.page} / {pagination.total_pages}
              </span>

              <button
                disabled={!pagination.has_next}
                style={{
                  padding: "4px 8px",
                  opacity: pagination.has_next ? 1 : 0.5,
                  cursor: pagination.has_next ? "pointer" : "default"
                }}
                onClick={() => setPage(page + 1)}
              >
                Tiếp ▶
              </button>
            </div>
          )}
        </div>
      )}

      {/* Audio picker for images and tour markers */}
      {showAudioPicker && selectedObject && (selectedObject.type === "image" || selectedObject.type === "tourmarker") && (
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
          <h4 style={{ margin: "0 0 8px", fontSize: "14px" }}>
            🎧 Âm thanh cho {selectedObject.type === "tourmarker" ? "điểm đánh dấu tour" : "hình ảnh"}
          </h4>

          {(() => {
            let existingMarker;
            if (selectedObject.type === "tourmarker") {
              existingMarker = props.tourMarkers?.find(marker => marker.id === selectedId);
            } else {
              existingMarker = props.tourMarkers?.find(marker => marker.imageId === selectedId);
            }

            const originalAudio = existingMarker?.audio || "";
            const currentValue = audioUrl ?? originalAudio;
            const hasChanged = currentValue !== originalAudio;

            return (
              <>
                {/* Dropdown audio selection */}
                <div style={{ marginBottom: "10px" }}>
                  <label style={{ display: "block", fontSize: "12px", marginBottom: "4px", color: "#444" }}>
                    Chọn tệp âm thanh:
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
                    value={currentValue}
                    onChange={(e) => setAudioUrl(e.target.value)}
                  >
                    <option value="">Không có</option>
                    {props.audios?.map((audio) => (
                      <option key={audio.id} value={audio.file_url}>
                        {audio.original_filename}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Play button if selected */}
                {currentValue && (
                  <div style={{ marginBottom: "10px" }}>
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
                          soundController?.stopAudio?.(audioId);
                          setIsPlaying(false);
                        } else {
                          try {
                            await soundController?.ensureInitialized?.();
                            await soundController?.playAudio(currentValue, {
                              id: audioId,
                              volume: 0.7,
                              onEnded: () => setIsPlaying(false),
                            });
                            setIsPlaying(true);
                          } catch (error) {
                            console.warn("Failed to play audio:", error);
                            setIsPlaying(false);
                          }
                        }
                      }}
                    >
                      {isPlaying ? "⏸ Tạm dừng" : "▶ Phát"}
                    </button>
                  </div>
                )}

                {/* Save button only if changed */}
                {hasChanged && (
                  <button
                    style={{
                      background: "#4cc9f0",
                      border: "none",
                      color: "#fff",
                      padding: "6px 10px",
                      borderRadius: "4px",
                      cursor: "pointer",
                      width: "100%",
                    }}
                    onClick={() => {
                      if (!props.tourMarkers || !props.onUpdateTourMarkers || !selectedId) return;

                      let updatedMarkers = [...props.tourMarkers];

                      if (existingMarker) {
                        updatedMarkers = updatedMarkers.map((marker) =>
                          marker.id === existingMarker.id
                            ? { ...marker, audio: currentValue || undefined }
                            : marker
                        );
                      } else if (selectedObject.type === "image" && currentValue) {
                        const newMarker = {
                          id: `tourmarker-${selectedId}`,
                          imageId: selectedId,
                          type: "image",
                          audio: currentValue,
                          index: -1,
                        };
                        updatedMarkers.push(newMarker);
                      }

                      props.onUpdateTourMarkers(updatedMarkers);
                      setShowAudioPicker(false);
                      setAudioUrl(null);
                    }}
                  >
                    💾 Lưu Âm Thanh
                  </button>
                )}

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
                    Đóng
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