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
  isMuted = false
}) {
  const [open, setOpen] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const audioIdRef = useRef(null)

  const linkedMarker = useMemo(() => {
    if (!data) return null;
    // Prefer explicit data.tourMarkerId; fallback to match by imageId
    if (data.tourMarkerId) {
      return tourMarkers.find(m => m.id === data.tourMarkerId) || null;
    }
    return tourMarkers.find(m => m.imageId === data.id) || null;
  }, [data, tourMarkers])

  // Reset open state when data changes (for tour mode image switching)
  useEffect(() => {
    if (tourMode && !tourInfoButtonVisible) {
      setOpen(false)
    }
  }, [tourMode, tourInfoButtonVisible])


  // Auto-play linked marker audio when panel is opened (only outside tour mode)
  useEffect(() => {
    let cancelled = false;

    const startPlayback = async () => {
      if (!linkedMarker?.audio || tourMode || !soundController) return;

      try {
        if (!audioIdRef.current) audioIdRef.current = `panel_audio_${data.id}`;

        const existing = soundController.audioElements?.get?.(audioIdRef.current);
        // If different URL previously attached, stop it first
        if (existing?.url && existing.url !== linkedMarker.audio) {
          soundController.stopAudio?.(audioIdRef.current);
        }

        await soundController.ensureInitialized?.();
        await soundController.ensureResumed?.();
        soundController.nudgeOutput?.();

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

        if (cancelled) return;

        setIsPlaying(true);
        const el = soundController.audioElements?.get?.(audioIdRef.current)?.audio;
        if (el) {
          el.onended = () => setIsPlaying(false);
        }
      } catch (err) {
        console.warn('Auto-play panel audio failed:', err);
      }
    };

    if (open) startPlayback();

    return () => {
      cancelled = true;
      // Stop audio when panel closes or component unmounts
      try {
        if (audioIdRef.current && soundController) {
          soundController.stopAudio?.(audioIdRef.current);
        }
      } catch (e) {
        /* ignore cleanup errors */
      }
      setIsPlaying(false);
    };
  }, [open, linkedMarker?.audio, tourMode, soundController, isMuted, data?.id]);



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
      onClose?.()
    } else {
      setOpen(true)
      if (tourMode && onOpenTourInfo) {
        onOpenTourInfo()
      }
    }
  }

  const handleOverlayClick = () => {
    setOpen(false)
    onClose?.()
  }

  const shouldShowButton = tourMode ? tourInfoButtonVisible : visible

  return (
    <>
      {(open || visible) && (
        <div
          className={`overlay ${tourMode ? 'tour-overlay' : ''} ${open ? 'panel-open' : ''}`}
          onClick={handleOverlayClick}
        ></div>
      )}

      {shouldShowButton && (
        <div className="image-info-wrapper">
          <button
            className={`info-btn ${open ? 'active' : ''}`}
            onClick={handleToggle}
          >
            {open ? '×' : 'i'}
          </button>
        </div>
      )}

      {open && (
        <div className="image-info-panel" onClick={e => e.stopPropagation()}>
          <div className="image-preview">
            <img src={data.src} alt={data.alt} />
          </div>
          <div className="image-details">
            <div className="image-details-content">
              <h2>{data.title || 'Untitled Artwork'}</h2>
              {data.alt && <h4>{data.alt}</h4>}
              {data.description && (
                <p>{data.description}</p>
              )}
              {!data.description && (
                <p style={{ 
                  fontStyle: 'italic', 
                  color: '#94a3b8', 
                  background: 'rgba(248, 250, 252, 0.5)' 
                }}>
                  No description available for this artwork.
                </p>
              )}

              {/* Inline audio control (only outside tour mode) */}
              {!tourMode && linkedMarker?.audio && soundController && (
                <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button
                    className="audio-btn"
                    onClick={async () => {
                      try {
                        if (!audioIdRef.current) audioIdRef.current = `panel_audio_${data.id}`;

                        // Toggle behavior
                        const existing = soundController.audioElements?.get?.(audioIdRef.current);
                        if (existing?.audio && !existing.audio.paused) {
                          soundController.pauseAudio?.(audioIdRef.current);
                          setIsPlaying(false);
                          return;
                        }

                        await soundController.ensureInitialized?.();
                        await soundController.ensureResumed?.();
                        soundController.nudgeOutput?.();

                        // If a different URL was previously attached to same id, stop it first
                        if (existing?.url && existing.url !== linkedMarker.audio) {
                          soundController.stopAudio?.(audioIdRef.current);
                        }

                        await soundController.playAudio(linkedMarker.audio, {
                          id: audioIdRef.current,
                          volume: 1.0,
                          fadeIn: false,
                          loop: false,
                        });

                        // Apply mute state after connect
                        if (isMuted) {
                          setTimeout(() => soundController.setMasterVolume?.(0, 0), 25);
                        }

                        setIsPlaying(true);
                        const el = soundController.audioElements?.get?.(audioIdRef.current)?.audio;
                        if (el) {
                          el.onended = () => setIsPlaying(false);
                        }
                      } catch (err) {
                        console.warn('Play panel audio failed:', err);
                      }
                    }}
                    title={isPlaying ? 'Pause audio' : 'Play audio narration'}
                  >
                    {isPlaying ? 'Pause Audio' : 'Play Audio'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
