import './ImageInfoPanel.css'
import { useState, useEffect, useRef, useMemo } from 'react'

export default function ImageInfoPanel({
  visible,
  data,
  onClose,
  tourMode = false,
  tourInfoButtonVisible = false,
  onOpenTourInfo,
  tourMarkers = [],
  soundController,
  isMuted = false,
  showToast,
  showImageDescription = true,
  hideAnyInfoPanel
}) {

  const [open, setOpen] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [dragTime, setDragTime] = useState(0)
  const [imageZoomed, setImageZoomed] = useState(false)
  const audioIdRef = useRef(null)

  const LABELS = {
    tieu_de: "Tiêu đề",
    tac_gia: "Tác giả",
    chieu_dai: "Chiều ngang (cm)",
    chieu_rong: "Chiều dọc (cm)",
    chat_lieu: "Chất liệu",
    nam_sang_tac: "Năm sáng tác",
    mo_ta: "Mô tả",
    duong_kinh: "Đường kính",
  };

  const linkedMarker = useMemo(() => {
    if (!data) return null;
    
    // Prefer explicit data.tourMarkerId; fallback to match by imageId
    if (data.tourMarkerId) {
      const marker = tourMarkers.find(m => m.id === data.tourMarkerId);
      return marker || null;
    }
    
    const marker = tourMarkers.find(m => m.imageId === data.id);
    return marker || null;
  }, [data, tourMarkers])

  // Reset open state when data changes (for tour mode image switching)
  useEffect(() => {
    if (tourMode && !tourInfoButtonVisible) {
      setOpen(false)
    }
  }, [tourMode, tourInfoButtonVisible])

  // Audio cleanup only on component unmount (not when panel closes)
  useEffect(() => {
    // Only cleanup when component unmounts, not when panel state changes
    return () => {
      // Stop audio when component unmounts
      try {
        if (audioIdRef.current && soundController) {
          soundController.stopAudio?.(audioIdRef.current);
        }
      } catch (e) {
        /* ignore cleanup errors */
      }
      setIsPlaying(false);
    };
  }, [soundController]); // Removed open, linkedMarker?.audio, tourMode, isMuted, data?.id from dependencies

  // Calculate values that will be used in the next useEffect
  const shouldShowButton = tourMode ? tourInfoButtonVisible : visible

  // Stop audio when buttons are hidden
  useEffect(() => {
    if (!shouldShowButton && isPlaying && audioIdRef.current && soundController) {
      try {
        soundController.stopAudio?.(audioIdRef.current);
        setIsPlaying(false);
      } catch (e) {
        console.warn('Failed to stop audio when buttons hidden:', e);
      }
    }
  }, [shouldShowButton, isPlaying, soundController]);

  // Track audio progress
  useEffect(() => {
    let interval = null;
    
    if (isPlaying && audioIdRef.current && soundController) {
      interval = setInterval(() => {
        try {
          const audioElement = soundController.audioElements?.get?.(audioIdRef.current)?.audio;
          if (audioElement) {
            // Only update state if not dragging to avoid conflicts
            if (!isDragging) {
              setCurrentTime(audioElement.currentTime || 0);
            }
            setDuration(audioElement.duration || 0);
          }
        } catch (e) {
          // Ignore errors
        }
      }, 50); // Increased frequency for smoother updates
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, soundController, isDragging]);

  // Nếu invisible → reset open luôn
  const shouldRender = tourMode ? (tourInfoButtonVisible || open) : visible
  if (!shouldRender || !data) {
    if (open) setOpen(false)
    return null
  }

  const handleToggle = (e) => {
    e.stopPropagation()
    if (open) {
      setOpen(false)
      // Don't call onClose when closing panel - keep buttons visible
    } else {
      setOpen(true)
      if (tourMode && onOpenTourInfo) {
        onOpenTourInfo()
      }
    }
  }

  const handleOverlayClick = () => {
    setOpen(false)
    hideAnyInfoPanel()
    // Don't call onClose when closing panel - keep buttons visible
  }

  const handleImageClick = (e) => {
    e.stopPropagation()
    setImageZoomed(true)
  }

  const handleZoomClose = () => {
    setImageZoomed(false)
  }

  const hasAudio = linkedMarker?.audio && soundController

  // Format time in MM:SS format
  const formatTime = (seconds) => {
    if (!seconds || !isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate time from mouse position
  const getTimeFromMousePosition = (e, progressBarElement) => {
    const rect = progressBarElement.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    return percentage * duration;
  };

  // Handle clicking on progress bar (immediate seek)
  const handleProgressClick = (e) => {
    if (!audioIdRef.current || !soundController || !duration || isDragging) return;
    
    const newTime = getTimeFromMousePosition(e, e.currentTarget);
    
    try {
      const audioElement = soundController.audioElements?.get?.(audioIdRef.current)?.audio;
      if (audioElement) {
        audioElement.currentTime = newTime;
        setCurrentTime(newTime);
      }
    } catch (err) {
      console.warn('Seek failed:', err);
    }
  };

  // Handle drag start
  const handleDragStart = (e) => {
    if (!audioIdRef.current || !soundController || !duration) return;
    
    e.preventDefault();
    setIsDragging(true);
    
    const progressBar = e.currentTarget;
    const initialTime = getTimeFromMousePosition(e, progressBar);
    setDragTime(initialTime);
    
    // Store the progress bar reference for accurate calculations
    const progressBarRef = progressBar;
    
    // Add global mouse event listeners
    const handleMouseMove = (moveEvent) => {
      const newTime = getTimeFromMousePosition(moveEvent, progressBarRef);
      setDragTime(newTime);
      setCurrentTime(newTime); // Keep currentTime in sync during drag
      
      // Update audio position in real-time for smoother feedback
      try {
        const audioElement = soundController.audioElements?.get?.(audioIdRef.current)?.audio;
        if (audioElement && !isNaN(newTime)) {
          audioElement.currentTime = newTime;
        }
      } catch (err) {
        // Ignore errors during drag
      }
    };
    
    const handleMouseUp = () => {
      // Get the final position from the audio element itself to avoid snapping
      try {
        const audioElement = soundController.audioElements?.get?.(audioIdRef.current)?.audio;
        if (audioElement) {
          // Use the actual audio currentTime to ensure visual position matches audio position
          const finalTime = audioElement.currentTime;
          setCurrentTime(finalTime);
          setDragTime(0); // Reset drag time
        }
      } catch (err) {
        console.warn('Final drag seek failed:', err);
        // Fallback to dragTime if audio element is not accessible
        setCurrentTime(dragTime);
      }
      
      setIsDragging(false);
      
      // Cleanup event listeners
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mouseleave', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mouseleave', handleMouseUp);
  };

  const handleAudioToggle = async (e) => {
    e.stopPropagation()
    
    if (!linkedMarker?.audio || !soundController) {
      showToast?.('Không có âm thanh cho tác phẩm này', 'warning');
      return;
    }
    
    try {
      setIsLoading(true);
      
      if (!audioIdRef.current) audioIdRef.current = `panel_audio_${data.id}`;

      // Toggle behavior - if already playing, pause it (don't reset time)
      const existing = soundController.audioElements?.get?.(audioIdRef.current);
      if (existing?.audio && !existing.audio.paused) {
        // Use pause instead of stop to maintain current time
        existing.audio.pause();
        setIsPlaying(false);
        return;
      }

      // Use exact same logic as the auto-play effect
      // If different URL previously attached, stop it first
      if (existing?.url && existing.url !== linkedMarker.audio) {
        soundController.stopAudio?.(audioIdRef.current);
      }

      // If audio exists and is paused, resume it
      if (existing?.audio && existing.audio.paused) {
        existing.audio.play();
        setIsPlaying(true);
        return;
      }

      await soundController.ensureInitialized?.();
      await soundController.ensureResumed?.();

      await soundController.playAudio(linkedMarker.audio, {
        id: audioIdRef.current,
        volume: 1.0,
        fadeIn: false,
        loop: false,
      });

      // Apply mute state after connect (keeps audio playing but silent)
      if (isMuted) {
        setTimeout(() => soundController.setMasterVolume?.(0, 0), 25);
      }

      setIsPlaying(true);
      
      const el = soundController.audioElements?.get?.(audioIdRef.current)?.audio;
      if (el) {
        el.onended = () => {
          setIsPlaying(false);
          setCurrentTime(0);
        };
        el.onloadedmetadata = () => {
          setDuration(el.duration || 0);
        };
      }
    } catch (err) {
      console.error('Audio toggle failed:', err);
      showToast?.('Failed to play audio. Please try again.', 'error');
      setIsPlaying(false);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      {open && (
        <div
          className={`overlay ${tourMode ? 'tour-overlay' : ''} ${open ? 'panel-open' : ''}`}
          onClick={handleOverlayClick}
        ></div>
      )}

      {shouldShowButton && !open && (
        <div className="image-info-wrapper">
          <div className="buttons-row">
            <button
              className="info-btn"
              onClick={handleToggle}
            >
              i
            </button>
            {hasAudio && (
              <button
                className={`audio-btn-external ${isPlaying ? 'playing' : ''}`}
                onClick={handleAudioToggle}
                title={isPlaying ? 'Pause audio' : 'Play audio narration'}
              >
                {isPlaying ? '⏸' : '▶'}
              </button>
            )}
          </div>
        </div>
      )}

      {open && (
        <div className={`image-info-panel ${!showImageDescription ? 'image-only' : ''}`} onClick={e => e.stopPropagation()}>
          <button 
            className="panel-close-btn"
            onClick={handleToggle}
            title="Close panel"
          >
            ×
          </button>
          <div className="image-preview">
            <img 
              src={data.src} 
              alt={data.alt} 
              onClick={handleImageClick}
              title="Click to zoom image"
              style={{
                cursor: 'pointer',
                transition: 'transform 0.2s ease',
                userSelect: 'none'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'scale(1.02)'
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'scale(1)'
              }}
            />
          </div>
          
          {showImageDescription && (
            <div className="image-details">
              
              <div className="image-details-content">
                <h2>{data.title || 'Untitled Artwork'}</h2>
                {/* Modern audio player (only outside tour mode) */}
                {!tourMode && linkedMarker?.audio && soundController && (
                  <div className="audio-player-container">
                    <div className="audio-controls">
                      <button
                        className={`audio-play-btn ${isPlaying ? 'playing' : ''} ${isLoading ? 'loading' : ''}`}
                        onClick={handleAudioToggle}
                        disabled={isLoading}
                        title={isPlaying ? 'Pause audio' : 'Play audio narration'}
                      >
                        {isLoading ? (
                          <div className="loading-spinner"></div>
                        ) : isPlaying ? (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                          </svg>
                        ) : (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M8 5v14l11-7z"/>
                          </svg>
                        )}
                      </button>
                      
                      <div className="audio-info">
                        <div className="audio-progress-container">
                          <div 
                            className={`audio-progress-bar ${isDragging ? 'dragging' : ''}`}
                            onClick={handleProgressClick}
                            onMouseDown={handleDragStart}
                          >
                            <div 
                              className="audio-progress-fill"
                              style={{ width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%' }}
                            ></div>
                            <div 
                              className="audio-progress-handle"
                              style={{ left: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%' }}
                            ></div>
                          </div>
                          <div className="audio-time">
                            <span className="current-time">{formatTime(currentTime)}</span>
                            <span className="separator">/</span>
                            <span className="total-time">{formatTime(duration)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {/* METADATA */}
                <div className="metadata-list" style={{ marginTop: '16px' }}>
                  {data.description && Object.keys(data.description).length > 0 ? (
                    (() => {
                      const entries = Object.entries(data.description)
                        .filter(([_, val]) => val && String(val).trim() !== "");

                      const prioritized = Object.keys(LABELS)
                        .filter(key => entries.some(([k]) => k === key))
                        .map(key => entries.find(([k]) => k === key));

                      const rest = entries.filter(([k]) => !LABELS[k]);

                      const finalList = [...prioritized, ...rest].filter(([key]) => key !== "kich_thuoc_trong_khong_gian");

                      return finalList.map(([key, val]) => (
                        <div key={key} className="metadata-item" style={{ marginBottom: "6px" }}>
                          <strong style={{ textTransform: "capitalize" }}>
                            {LABELS[key] || key.replace(/_/g, " ")}:
                          </strong>{" "}
                          <span>{val}</span>
                        </div>
                      ));
                    })()
                  ) : (
                    <p style={{
                      fontStyle: "italic",
                      color: "#94a3b8",
                      background: "rgba(248, 250, 252, 0.5)",
                      padding: "4px 0",
                    }}>
                      Không có thông tin cho tác phẩm này.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Image Zoom Modal */}
      {imageZoomed && (
        <div 
          className="image-zoom-overlay" 
          onClick={handleZoomClose}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            cursor: 'pointer'
          }}
        >
          <div 
            className="image-zoom-content" 
            onClick={e => e.stopPropagation()}
            style={{
              position: 'relative',
              maxWidth: '90vw',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}
          >
            <button 
              className="image-zoom-close"
              onClick={handleZoomClose}
              title="Close"
              style={{
                position: 'absolute',
                top: '-40px',
                right: '0px',
                background: 'rgba(255, 255, 255, 0.9)',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                fontSize: '18px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10001
              }}
            >
              ×
            </button>
            <img 
              src={data.src} 
              alt={data.alt}
              className="zoomed-image"
              onClick={handleZoomClose}
              style={{
                width: 'auto',
                height: 'auto',
                maxWidth: '90vw',
                maxHeight: '90vh',
                objectFit: 'contain',
                cursor: 'pointer'
              }}
            />
            {data.title && (
              <div 
                className="image-zoom-caption"
                style={{
                  color: 'white',
                  marginTop: '16px',
                  textAlign: 'center',
                  fontSize: '16px',
                  fontWeight: '500'
                }}
              >
                {data.title}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
