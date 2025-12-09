import { Canvas, useThree } from '@react-three/fiber';
import { useState, useRef, Suspense, useEffect } from 'react';
import Scene from './Scene';
import Toolbox from './Toolbox';
import SoundController from './SoundController';
import objectData from '../../assets/object.json';
import enviromentData from "../../assets/enviroment.json";
import textureData from "../../assets/texture.json";
import { Html, Loader } from '@react-three/drei';
import ObjectPopup from "./ObjectPopup";
import './App.css';
import ImageInfoPanel from './components/ImageInfoPanel'
import Tooltip from "./components/Tooltip";
import MobileControls from './components/MobileControls';
import PopUpWelcome from './components/PopUpWelcome';

document.addEventListener("touchstart", () => {
  if (!window.__globalAudioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    window.__globalAudioCtx = new AC();
  }
  const ctx = window.__globalAudioCtx;
  if (ctx.state === "suspended") ctx.resume();

  // Phát một sóng âm cực nhỏ để Safari/Chrome ghi nhận
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  gain.gain.value = 0.0001;
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.05);
}, { once: true });

const App = () => {
  const [mode, setMode] = useState('view'); // State to manage mode (edit or view)
  const [selectedId, setSelectedId] = useState(null); // State to track the currently selected wall
  const [draggedImage, setDraggedImage] = useState(null); // State to track the dragged image
  const [images, setImages] = useState(objectData.images);
  const [uploadedAudioFiles, setUploadedAudioFiles] = useState(objectData.audio || []);
  const imageFrameList = objectData.imageFrameList; 
  const [objects, setObjects] = useState(objectData.objects);
  const [tourMarkers, setTourMarkers] = useState(objectData.tourMarkers || []);
  const [currentSceneData, setCurrentSceneData] = useState(objectData);
  const [isImageEditModalOpen, setIsImageEditModalOpen] = useState(false);
  const sceneRef = useRef(); // Reference to access the Scene component's methods
  const [isEditRoom, setIsEditRoom] = useState(false);
  const [openPopUpWelcome, setOpenPopUpWelcome] = useState(true);
  const [audioUnlocked, setAudioUnlocked] = useState(false);

  useEffect(() => {
    const handleUserGesture = async () => {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        if (!window.__globalAudioCtx) window.__globalAudioCtx = new AudioCtx();

        await window.__globalAudioCtx.resume();
        const silent = new Audio();
        silent.src = "data:audio/mp3;base64,//uQxAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAACcQCA...";
        silent.volume = 0.01;
        silent.muted = true;
        silent.playsInline = true;
        await silent.play().catch(() => {});
        setTimeout(() => silent.pause(), 120);

        setAudioUnlocked(true);
        window.removeEventListener("touchstart", handleUserGesture);
        window.removeEventListener("mousedown", handleUserGesture);
      } catch (err) {
        console.warn("unlock failed:", err);
      }
    };

    document.addEventListener("touchstart", handleUserGesture);
    document.addEventListener("mousedown", handleUserGesture);
    return () => {
      document.removeEventListener("touchstart", handleUserGesture);
      document.removeEventListener("mousedown", handleUserGesture);
    };
  }, []);


  const AUDIO_BACKGROUND = '/audio/background_loop.mp3';

  const closePopUpWelcome = (mode) => {
  setOpenPopUpWelcome(false);

  if (!soundController.current) {
    soundController.current = new SoundController({
      masterVolume: 0.6,
      backgroundVolume: 0.4,
      autoPlayBackground: false,
      fadeInDuration: 2000,
      fadeOutDuration: 1000
    });
  }

  const controller = soundController.current;
  const bgUrl = AUDIO_BACKGROUND;

  try {
    const kick = new Audio(AUDIO_BACKGROUND);
    kick.volume = 0.01;
    kick.muted = false;
    kick.playsInline = true;
    kick.setAttribute('playsinline', 'true');

    // play trong gesture
    const playPromise = kick.play();

    // Đợi 1 tick để Safari “thật sự phát” trước khi pause
    Promise.resolve(playPromise).then(() => {
      setTimeout(() => {
        try {
          kick.pause();
          kick.currentTime = 0;

          controller.initAudioContext().then(() => {
            controller.playBackgroundAudio(AUDIO_BACKGROUND, 0.4).then(() => {
              // ✅ Đánh dấu đã có audio thực sự
              setAudioInitialized(true);
              if (isMuted) {
                controller.setMasterVolume(0, 0);
              } else {
                controller.setMasterVolume(controller.config.masterVolume, 0);
              }
              console.log("Background audio active");
            });
          });
          console.log("Audio started after safe micro-delay");
        } catch (e) {
          console.warn("Kick pause failed:", e);
        }
      }, 150); // ~150ms an toàn trên Safari 17–18
    }).catch(err => {
      console.warn("Kick play failed:", err);
    });
  } catch (err) {
    console.warn("Inline audio init failed:", err);
  }
};

  
  // State to store temporary tour indices before saving
  const [tempTourIndices, setTempTourIndices] = useState(new Map());
  // State to track images removed from tour (to set their index to -1)
  const [removedFromTour, setRemovedFromTour] = useState(new Set());
  
  // Initialize tempTourIndices from tourMarkers
  useEffect(() => {
    const initialTourIndices = new Map();
    tourMarkers.forEach(marker => {
      // Include all markers (including inactive markers with index -1) in temp tour indices
      if (marker.index !== undefined) {
        // For image markers
        if (marker.imageId) {
          initialTourIndices.set(marker.imageId, marker.index);
        }
        // For camera markers
        else if (marker.type === 'camera') {
          const itemId = marker.itemId || marker.id.replace('tourmarker-', '');
          initialTourIndices.set(itemId, marker.index);
        }
      }
    });
    
    // Only set tempTourIndices if it's empty (initial load) or if it's significantly different
    // This prevents overwriting unsaved changes when new markers are added
    setTempTourIndices(prev => {
      if (prev.size === 0) {
        // Initial load - use the tour markers (excluding inactive ones)
        return initialTourIndices;
      } else {
        // Merge existing temp indices with new tour markers, preserving temp changes
        const merged = new Map(prev);
        initialTourIndices.forEach((index, itemId) => {
          // Only add if this item doesn't already exist in temp indices
          if (!merged.has(itemId)) {
            merged.set(itemId, index);
          }
        });
        return merged;
      }
    });
  }, [tourMarkers]);
  
  const wallTextureList = textureData.wall;
  const [gizmoMode, setGizmoMode] = useState('');
  const [panelVisible, setPanelVisible] = useState(false)
  const [panelData, setPanelData] = useState(null)
  const [tooltip, setTooltip] = useState({
    visible: false,
    x: 0,
    y: 0,
    title: "",
    alt: ""
  });

  //Setting enviroment
  const [skySettings, setSkySettings] = useState(enviromentData.sky);
  const [groundSettings, setGroundSettings] = useState(enviromentData.ground);
  const [bloomSettings, setBloomSettings] = useState(enviromentData.bloom || {
    enabled: false,
    luminanceThreshold: 1.0,
    luminanceSmoothing: 0.9,
    intensity: 1.5
  });
  const groundTextureList = textureData.ground;
  const [skySettingMode, setSkySettingMode] = useState(enviromentData.skySettingMode || 'sky');
  const [groundSettingMode, setGroundSettingMode] = useState(enviromentData.groundSettingMode || 'ground');
  const [hdri, setHdri] = useState(enviromentData.selectedHdri || undefined);
  const [groundTexture, setGroundTexture] = useState(
    enviromentData.selectedGroundTexture || {
      "id": groundTextureList[0].id,
      "alb": groundTextureList[0].alb,
      "nor": groundTextureList[0].nor,
      "orm": groundTextureList[0].orm,
      "image": "/hdri/hdri.webp"
    }
  );
  //Setting enviroment

  //Image Frame
  const imageFrame = {
    id: "imageFrame",
    src: "/images/imageFrame.png",
    alt: "Drag and drop photos into the frame",
    title: "Image Frame"
  }
  //Image Frame

  const [popupVisible, setPopupVisible] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const [popupData, setPopupData] = useState(null);

  // Sound Controller
  const soundController = useRef(null);

  const [audioInitialized, setAudioInitialized] = useState(false);
  // Sound state (mute/unmute)
  const [isMuted, setIsMuted] = useState(() => {
    const saved = localStorage.getItem('app_isMuted');
    return saved ? JSON.parse(saved) : false;
  });
  const [saveSuccess, setSaveSuccess] = useState(false);
  // Marker visibility state
  const [markersVisible, setMarkersVisible] = useState(() => {
    const saved = localStorage.getItem('app_markersVisible');
    return saved ? JSON.parse(saved) : true;
  });
  const [tourMode, setTourMode] = useState(false);
  const [tourPlaying, setTourPlaying] = useState(false);
  const [currentTourIndex, setCurrentTourIndex] = useState(0);
  const [tourProgress, setTourProgress] = useState(0);
  const [tourInfoButtonVisible, setTourInfoButtonVisible] = useState(false);
  const [tourInfoPanelOpen, setTourInfoPanelOpen] = useState(false);

  const [isJoystickActive, setIsJoystickActive] = useState(false);
  const [currentSceneFile, setCurrentSceneFile] = useState('object.json');
  const [showTransparentWalls, setShowTransparentWalls] = useState(false); // Track transparent walls visibility
  const [isFullscreen, setIsFullscreen] = useState(false); // Track fullscreen state

  // Helper function to get current tour items (including unsaved changes from tempTourIndices)
  // Excludes inactive markers (index -1) from tour sequence
  const getTourImages = () => {
    if (tempTourIndices && tempTourIndices.size > 0) {
      // Use tempTourIndices for items with tour indices (both images and camera markers)
      const tourItemsArray = [];
      tempTourIndices.forEach((tourIndex, itemId) => {
        // Skip inactive markers (index -1)
        if (tourIndex !== -1) {
          // Check for image objects
          const imageObj = objects.find(obj => obj.id === itemId && obj.type === 'image');
          if (imageObj) {
            tourItemsArray.push({ ...imageObj, index: tourIndex, itemType: 'image' });
          } else {
            // Check for camera markers
            const cameraMarker = tourMarkers.find(m => {
              if (m.type === 'camera') {
                return (m.itemId === itemId) || (m.id === `tourmarker-${itemId}`);
              }
              return false;
            });
            if (cameraMarker) {
              tourItemsArray.push({ ...cameraMarker, index: tourIndex, itemType: 'camera' });
            }
          }
        }
      });
      return tourItemsArray.sort((a, b) => a.index - b.index);
    } else {
      // Use tourMarkers to determine tour order (both image and camera markers)
      // Filter out inactive markers (index -1)
      const sortedMarkers = (tourMarkers || [])
        .filter(m => m.index !== undefined && m.index !== -1)
        .sort((a, b) => a.index - b.index);
      
      return sortedMarkers
        .map(marker => {
          if (marker.imageId) {
            // Image marker
            const imageObj = objects.find(obj => obj.type === 'image' && obj.id === marker.imageId);
            return imageObj ? { ...imageObj, itemType: 'image' } : null;
          } else if (marker.type === 'camera') {
            // Camera marker
            return { ...marker, itemType: 'camera' };
          }
          return null;
        })
        .filter(item => item !== null);
    }
  };

  const toggleMode = () => {
    setMode((prevMode) => (prevMode === 'view' ? 'edit' : 'view')); // Toggle between modes
    setSelectedId(null);
  };

  // Handle temporary tour index changes (not saved until save button is pressed)
  const handleTempTourIndexChange = (imageId, index) => {
    console.log('🎯 handleTempTourIndexChange called with imageId:', imageId, 'index:', index);
    setTempTourIndices(prev => {
      const newMap = new Map(prev);
      if (index === -999) {
        console.log('🗑 Special value -999: completely removing', imageId, 'from tempTourIndices');
        // Special value -999 indicates complete removal from tempTourIndices
        newMap.delete(imageId);
        console.log('🗑 After deletion, tempTourIndices size:', newMap.size);
        // Don't add to removedFromTour as this is for complete marker deletion
      } else if (index === -1) {
        console.log('🔄 Index -1: removing', imageId, 'from tour but keeping in tempTourIndices');
        newMap.delete(imageId);
        // Track that this image was removed from tour
        setRemovedFromTour(prevRemoved => new Set(prevRemoved).add(imageId));
      } else {
        console.log('🔄 Setting', imageId, 'to index:', index);
        newMap.set(imageId, index);
        // Remove from removed set if it's being re-added
        setRemovedFromTour(prevRemoved => {
          const newSet = new Set(prevRemoved);
          newSet.delete(imageId);
          return newSet;
        });
      }
      return newMap;
    });
  };

  // Create a camera-based tour marker at current camera position
  const handleCreateCameraTourMarker = () => {
    if (!sceneRef.current?.getCurrentCameraState) {
      alert('Error: Camera state not available. Make sure the scene is loaded.');
      return;
    }

    try {
      const cameraState = sceneRef.current.getCurrentCameraState();
      const newIndex = tempTourIndices.size;
      
      // Generate a unique ID for the camera-based tour marker
      const markerId = `camera-marker-${Date.now()}`;
      
      // Add to temp tour indices
      setTempTourIndices(prev => {
        const newMap = new Map(prev);
        newMap.set(markerId, newIndex);
        return newMap;
      });

      // Add to tour markers state - using unified format
      const newCameraMarker = {
        id: `tourmarker-${markerId}`,
        itemId: markerId, // Unified identifier for both image and camera markers
        type: 'camera', // Identify this as a camera-based marker
        index: newIndex,
        position: cameraState.position,
        rotation: cameraState.rotation,
        duration: 5000, // Default duration
      };

      setTourMarkers(prev => [...prev, newCameraMarker]);
    } catch (error) {
      console.error('Error creating camera tour marker:', error);
      alert('Error creating camera marker: ' + error.message);
    }
  };

  // Toggle mute/unmute audio
  const toggleMute = async () => {
    const controller = soundController.current;
    if (!controller || !audioInitialized) return;

    const newMuteState = !isMuted;
    try {
      // Bắt buộc resume AudioContext trước khi bật lại
      await controller.resumeAudioContext();

      if (newMuteState) {
        controller.setMasterVolume(0, 300);
        console.log("Audio muted");
      } else {
        if (controller.audioContext?.state === 'suspended') {
          await controller.audioContext.resume();
          console.log("🔄 AudioContext resumed before unmute");
        }

        if (controller.masterGainNode?.numberOfOutputs === 0) {
          console.log("Reconnecting masterGainNode...");
          controller.masterGainNode.connect(controller.audioContext.destination);
        }

        controller.masterGainNode.gain.cancelScheduledValues(controller.audioContext.currentTime);
        controller.masterGainNode.gain.setValueAtTime(
          controller.config.masterVolume,
          controller.audioContext.currentTime + 0.05
        );
        console.log("Audio unmuted, gain restored:", controller.config.masterVolume);
      }

      setIsMuted(newMuteState);
      localStorage.setItem('app_isMuted', JSON.stringify(newMuteState));
    } catch (err) {
      console.warn("toggleMute failed:", err);
    }
  };

  // Toggle marker visibility
  const toggleMarkerVisibility = () => {
    setMarkersVisible(!markersVisible);
  };

  // Toggle fullscreen
  const toggleFullscreen = async () => {
    console.log('Fullscreen button clicked, current state:', isFullscreen);
    
    // Detect if we're on iOS - disable fullscreen for iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    
    if (isIOSDevice) {
      console.log('Fullscreen disabled on iOS devices');
      return; // Exit early for iOS devices
    }
    
    try {
      if (!isFullscreen) {
        // Enter fullscreen
        let element = document.documentElement;
        
        console.log('Trying standard fullscreen API');
        if (element.requestFullscreen) {
          await element.requestFullscreen();
        } else if (element.webkitRequestFullscreen) {
          await element.webkitRequestFullscreen();
        } else if (element.msRequestFullscreen) {
          await element.msRequestFullscreen();
        } else if (element.mozRequestFullScreen) {
          await element.mozRequestFullScreen();
        }
      } else {
        // Exit fullscreen
        console.log('Exiting fullscreen');
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          await document.webkitExitFullscreen();
        } else if (document.webkitCancelFullScreen) {
          await document.webkitCancelFullScreen();
        } else if (document.msExitFullscreen) {
          await document.msExitFullscreen();
        } else if (document.mozCancelFullScreen) {
          await document.mozCancelFullScreen();
        }
      }
    } catch (error) {
      console.warn('Fullscreen toggle failed:', error);
    }
  };

  // Toggle tour mode

  const unlockAudio = async () => {
    try {
      // 1️⃣ Khởi tạo global AudioContext nếu chưa có
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return console.warn("⚠️ AudioContext not supported");

      if (!window.__globalAudioCtx) {
        window.__globalAudioCtx = new AudioCtx();
        console.log("🎧 Global AudioContext created");
      }

      // 2️⃣ Resume nếu đang suspend (iOS sẽ yêu cầu gesture)
      if (window.__globalAudioCtx.state === "suspended") {
        await window.__globalAudioCtx.resume();
        console.log("🔊 AudioContext resumed");
      }

      // 3️⃣ Phát 1 silent audio trong gesture → Safari nhận là hành động người dùng
      const silent = new Audio();
      silent.src =
        "data:audio/mp3;base64,//uQxAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAACcQCA...";
      silent.volume = 0.01;
      silent.muted = true;
      silent.setAttribute("playsinline", "true");
      silent.setAttribute("webkit-playsinline", "true");

      // play → pause nhanh (trick iOS)
      await silent.play().catch(() => {});
      setTimeout(() => {
        silent.pause();
        silent.currentTime = 0;
        console.log("✅ Silent audio unlocked iOS playback");
      }, 150);
    } catch (err) {
      console.warn("❌ Audio unlock failed:", err);
    }
  };
  const toggleTourMode = () => {
    if (soundController.current) {
      // Chỉ tắt các audio không phải background
      const controller = soundController.current;
      controller.audioElements.forEach((data, id) => {
        if (!data.isBackground) controller.stopAudio(id);
      });
    }
    if (tourMode) {
      setTourMode(false);
      setTourPlaying(false);
      setCurrentTourIndex(0);
      setTourProgress(0);
      return;
    }

    const tourImages = getTourImages();
    if (tourImages.length === 0) return;

    // Nếu audio chưa unlock thì chỉ báo lỗi nhỏ, không crash
    if (!audioUnlocked) {
      console.warn("⚠️ Audio not yet unlocked, tap once more on screen.");
    }

    setTimeout(async () => {
      try {
        if (soundController.current) {
          await soundController.current.ensureInitialized();
          await soundController.current.ensureResumed();
          soundController.current.nudgeOutput?.();
        }

        setTourMode(true);
        setTourPlaying(true);
        setCurrentTourIndex(0);
        setTourProgress(0);
        console.log("Tour started");
      } catch (err) {
        console.warn("Failed to start tour:", err);
        setTourMode(true);
        setTourPlaying(true);
      }
    }, 0);
  };

  // Tour control functions
  const pauseTour = () => setTourPlaying(false);
  const playTour = () => setTourPlaying(true);
  const exitTour = () => {
  setTourMode(false);
  setTourPlaying(false);
  setCurrentTourIndex(0);
  setTourProgress(0);

  // Dừng mọi audio đang phát
  if (soundController.current) {
    const controller = soundController.current;
    // Dừng tất cả audio đang phát (trừ background)
    controller.audioElements.forEach((data, id) => {
      if (!data.isBackground) controller.stopAudio(id, true);
    });

    // Sau 500ms bật lại nhạc nền
    setTimeout(() => {
      controller.playBackgroundAudio(AUDIO_BACKGROUND, controller.config.backgroundVolume)
        .catch(err => console.warn("Failed to restart background:", err));
    }, 500);
  }
};
  
  // Tour navigation functions
  const goToPreviousImage = () => {
    if (currentTourIndex > 0) {
      setCurrentTourIndex(currentTourIndex - 1);
      // Reset progress for the new image
      const tourImages = getTourImages();
      const newProgress = ((currentTourIndex - 1) / tourImages.length) * 100;
      setTourProgress(newProgress);
    }
  };
  
  const goToNextImage = () => {
    const tourImages = getTourImages();
    if (currentTourIndex < tourImages.length - 1) {
      setCurrentTourIndex(currentTourIndex + 1);
      // Reset progress for the new image
      const newProgress = ((currentTourIndex + 1) / tourImages.length) * 100;
      setTourProgress(newProgress);
    }
  };

  // Tour info button functions
  const showTourInfo = (data) => {
    setPanelData(data);
    setTourInfoButtonVisible(true);
  };

  const openTourInfo = () => {
    setTourInfoPanelOpen(true);
    setPanelVisible(true);
  };

  const closeTourInfo = () => {
    setTourInfoPanelOpen(false);
    setPanelVisible(false);
    setTourInfoButtonVisible(false);
  };

  const hideTourInfo = () => {
    setTourInfoButtonVisible(false);
    if (tourInfoPanelOpen) {
      setTourInfoPanelOpen(false);
      setPanelVisible(false);
    }
  };

  const hideAnyInfoPanel = () => {
    // Hide tour info if it's visible
    if (tourInfoButtonVisible || tourInfoPanelOpen) {
      hideTourInfo();
    }
    // Hide normal panel if it's visible
    if (panelVisible) {
      setPanelVisible(false);
    }
  };
  

  const handleSave = () => {
    // Save temporary tour indices and handle removed items - update tourMarkers for both image and camera markers
    if (tempTourIndices.size > 0 || removedFromTour.size > 0) {
      // Update tourMarkers with new indices
      setTourMarkers(prev => {
        const updatedMarkers = [...prev];
        
        // Update existing markers based on their identifier
        updatedMarkers.forEach((marker, idx) => {
          let itemId = null;
          
          // Determine the item ID for this marker
          if (marker.imageId) {
            itemId = marker.imageId; // Image marker
          } else if (marker.type === 'camera') {
            itemId = marker.itemId || marker.id.replace('tourmarker-', ''); // Camera marker (handle both formats)
          }
          
          if (itemId) {
            if (tempTourIndices.has(itemId)) {
              updatedMarkers[idx] = { ...marker, index: tempTourIndices.get(itemId) };
            } else if (removedFromTour.has(itemId)) {
              // Mark for removal by setting index to -1
              updatedMarkers[idx] = { ...marker, index: -1 };
            }
          }
        });
        
        // Remove markers that have been explicitly removed from tour
        // But keep inactive markers (index -1) that have audio content
        const filteredMarkers = updatedMarkers.filter(marker => {
          if (marker.index === -1) {
            // Keep inactive markers that have audio, remove those that don't
            return marker.audio !== undefined;
          }
          return true; // Keep all other markers
        });
        
        // Add new markers for items that have tour indices but no marker yet
        tempTourIndices.forEach((tourIndex, itemId) => {
          const existingMarker = filteredMarkers.find(m => {
            if (m.imageId === itemId) return true; // Image marker
            if (m.type === 'camera') {
              // Handle both new itemId format and legacy id format
              return (m.itemId === itemId) || (m.id === `tourmarker-${itemId}`);
            }
            return false;
          });
          
          // Create new markers for items that don't exist yet (both active and inactive)
          if (!existingMarker) {
            // Check if this is an image
            const image = objects.find(obj => obj.id === itemId && obj.type === 'image');
            if (image) {
              // Find the corresponding image object to get position information
              const imageObj = objects.find(obj => obj.id === itemId && obj.type === 'image');
              
              // Calculate position in front of the image (similar to how TourMarker calculates it)
              let markerPosition = [0, 2.6, 0]; // Default position
              
              if (imageObj) {
                // Get the parent wall to calculate world position
                const parentWall = objects.find(obj => obj.id === imageObj.parent);
                if (parentWall) {
                  // Simple calculation - place marker 2 units in front of the wall
                  // This is a simplified version; the actual calculation in TourMarker is more complex
                  const wallPos = parentWall.position || [0, 0, 0];
                  const wallScale = parentWall.scale || [1, 1, 1];
                  markerPosition = [
                    wallPos[0] + (imageObj.position[0] * wallScale[0]),
                    wallPos[1] + (imageObj.position[1] * wallScale[1]) + 0.6, // Slightly above center
                    wallPos[2] + (imageObj.position[2] * wallScale[2]) + 2.0 // 2 units in front
                  ];
                }
              }
              
              // Create a new image marker with position and duration
              filteredMarkers.push({
                id: `tourmarker-${itemId}`,
                imageId: itemId,
                type: 'image',
                index: tourIndex,
                position: markerPosition,
                duration: tourIndex === -1 ? undefined : 5000 // No duration for inactive markers
              });
            }
            // Camera markers should already exist since they're created when added
          }
        });
        
        return filteredMarkers;
      });
      
      // Wait a moment for state updates to complete before saving
      setTimeout(() => {
        if (sceneRef.current) {
          sceneRef.current.saveToFile(); // Call the saveToFile method in Scene
          setSaveSuccess(true);
          setTimeout(() => setSaveSuccess(false), 600);
        }
        
        // Rebuild tempTourIndices from the updated tourMarkers AFTER saving is complete
        setTimeout(() => {
          const newTourIndices = new Map();
          setTourMarkers(currentMarkers => {
            currentMarkers.forEach(marker => {
              // Include all markers (including inactive ones with index -1) in tempTourIndices
              if (marker.index !== undefined) {
                let itemId = null;
                
                if (marker.imageId) {
                  itemId = marker.imageId; // Image marker
                } else if (marker.type === 'camera') {
                  itemId = marker.itemId || marker.id.replace('tourmarker-', ''); // Camera marker (handle both formats)
                }
                
                if (itemId) {
                  newTourIndices.set(itemId, marker.index);
                }
              }
            });
            setTempTourIndices(newTourIndices);
            return currentMarkers; // Return unchanged markers
          });
          setRemovedFromTour(new Set());
        }, 500);
      }, 100);
    } else {
      // No changes, save immediately
      if (sceneRef.current) {
        sceneRef.current.saveToFile(); // Call the saveToFile method in Scene
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 600);
      }
    }
  };

  const handleCreateWall = () => {
    if (sceneRef.current) {
      sceneRef.current.createWall(); // Call the createWall method in Scene
    }
  };

  // Mobile input handlers
  const mobileInputRef = useRef({ move: { x: 0, y: 0 } });
  const handleMobileMove = (x, y) => {
    mobileInputRef.current.move.x = x;
    mobileInputRef.current.move.y = y;
  }

  const handleJoystickStateChange = (active) => {
    setIsJoystickActive(active);
  };

  const handleSceneChange = (sceneData, fileName = 'object.json') => {
    if (sceneData.objects) {
      setObjects(sceneData.objects);
    }
    if (sceneData.images) {
      setImages(sceneData.images);
    }
    if (sceneData.tourMarkers) {
      setTourMarkers(sceneData.tourMarkers);
    }
    // Update the current scene data including isPreset
    setCurrentSceneData(sceneData);
    // Track the current scene file
    setCurrentSceneFile(fileName);
    // Reset selection when switching scenes
    setSelectedId(null);
    setPanelVisible(false);
    setPanelData(null);
  };

  const handleSaveScene = () => {
    const currentScene = {
      isPreset: currentSceneData?.isPreset ?? false,
      name: currentSceneData?.name || 'Custom Scene',
      objects: objects,
      images: images,
      imageFrameList: imageFrameList,
      tourMarkers: tourMarkers,
      metadata: {
        exportedAt: new Date().toISOString(),
        originalFile: currentSceneFile,
        version: "1.0"
      }
    };
    
    // Create a blob with the JSON data
    const jsonString = JSON.stringify(currentScene, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    
    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = currentSceneFile;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    // Show success message
    alert(`Scene saved as ${currentSceneFile}!\n\nObjects: ${objects.length}\nImages: ${images.length}`);
  };

  const handleCreateSpotLight = () => {
    if (sceneRef.current) {
      sceneRef.current.createSpotLight(); // Call the createSpotLight method in Scene
    }
  };

  const handleCreateImageFrame = () => {
    if (sceneRef.current) {
      sceneRef.current.startPlacingImageFrame();
    }
  };

  const handleCreateSpotLightForImage = (imageId) => {
    if (sceneRef.current) {
      sceneRef.current.createSpotLightForImage(imageId);
    }
  };

  const replaceImageOnFrame = (frameId, newImage) => {
    if (sceneRef.current) {
      sceneRef.current.replaceImageOnFrame(frameId, newImage);
    }
  };

  const handleImageMetaChange = async (imageId, meta) => {
    // 1. Update images array (for Toolbox)
    setImages(prev =>
      prev.map(img => img.id === imageId ? { ...img, ...meta } : img)
    );

    // 2. Update all image instances in objects (for Scene)
    setObjects(prev =>
      prev.map(obj =>
        obj.type === 'image' && obj.id === imageId
          ? { ...obj, ...meta }
          : obj
      )
    );
  // Note: Changes will be saved when the main Save button is clicked
    // This ensures all changes (including descriptions) are persisted together
  };

  const handleAddImage = async (newImage) => {
    const id = `image-${Date.now()}`;
    const imageWithId = { ...newImage, id };
    setImages(prev => [...prev, imageWithId]);
    
    // Note: New image will be saved when the main Save button is clicked
    // This ensures all new images (including descriptions) are persisted
  };

  const handleAddAudio = async (newAudio) => {
    const audioWithId = { ...newAudio };
    setUploadedAudioFiles(prev => [...prev, audioWithId]);
    
    // Note: New audio will be saved when the main Save button is clicked
    // This ensures all new audio files (including metadata) are persisted
  };

  const handleRemoveAudio = async (audioId) => {
    setUploadedAudioFiles(prev => prev.filter(audio => audio.id !== audioId));
    
    // Note: Audio removal will be saved when the main Save button is clicked
    // This ensures all changes are persisted together
  };

  function WebGLContextLossHandler() {
    const { gl } = useThree();

    useEffect(() => {
      const handleContextLost = (e) => {
        e.preventDefault();
        alert('WebGL context lost. Please reload the page.');
      };

      gl.domElement.addEventListener('webglcontextlost', handleContextLost, false);

      return () => {
        gl.domElement.removeEventListener('webglcontextlost', handleContextLost);
      };
    }, [gl]);

    return null;
  }

  const [popupShouldRender, setPopupShouldRender] = useState(false);

  useEffect(() => {
    const handleMouseUp = () => {
      if (document.activeElement.tagName === 'BUTTON') {
        document.activeElement.blur();
      }
    };
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, []);

  useEffect(() => {
    if (popupVisible) {
      setPopupShouldRender(true);
    } else {
      const timeout = setTimeout(() => setPopupShouldRender(false), 300); // 300ms = duration of CSS animation
      return () => clearTimeout(timeout);
    }
  }, [popupVisible]);

  // Cleanup audio when component unmounts
  useEffect(() => {
    return () => {
      if (soundController.current) {
        soundController.current.dispose();
      }
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('app_isMuted', JSON.stringify(isMuted));
  }, [isMuted]);

  // Lưu trạng thái marker hiển thị
  useEffect(() => {
    localStorage.setItem('app_markersVisible', JSON.stringify(markersVisible));
  }, [markersVisible]);
  
  useEffect(() => {
    if (audioInitialized && isMuted && soundController.current) {
      soundController.current.setMasterVolume(0, 0);
    }
  }, [audioInitialized, isMuted]);

  useEffect(() => {
    const handleUserGesture = () => {
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        audioCtx.resume();
        const silent = new Audio();
        silent.src = "data:audio/mp3;base64,//uQxAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAACcQCA...";
        silent.play().catch(() => {});
        window.__audio_unlocked = true;
        window.removeEventListener('pointerdown', handleUserGesture);
      } catch (err) {
        console.warn("unlock error:", err);
      }
    };

    window.addEventListener('pointerdown', handleUserGesture);
    return () => window.removeEventListener('pointerdown', handleUserGesture);
  }, []);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.msFullscreenElement ||
        document.mozFullScreenElement
      );
      setIsFullscreen(isCurrentlyFullscreen);
    };

    // Add event listeners for different browsers
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
    };
  }, []);

  return (
    <>
      <PopUpWelcome open={openPopUpWelcome} handleClose={closePopUpWelcome} link="https://web-xr-livid.vercel.app/virtouria/denlong" />
      <div className="app-container">
        {/* Toolbox and Toggle Switch Container */}
        <div className={`toolbox-container ${mode}`}>
          {/* View/Edit Toggle Button */}
          <button 
            className={`toggle-button-circle ${mode === 'edit' ? 'edit-mode' : 'view-mode'}`} 
            onClick={toggleMode} 
            title={mode === 'edit' ? 'Switch to View Mode' : 'Switch to Edit Mode'}
          >
            {mode === 'edit' ? (
              // Edit Mode Icon (Pencil)
              <svg 
                width="20" 
                height="20" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            ) : (
              // View Mode Icon (Eye)
              <svg 
                width="20" 
                height="20" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            )}
          </button>

          {/* Right-Side Toolbox */}
          <div className="toolbox-content">
            {mode === 'edit' && (
              <>
                <Toolbox 
                  onCreateWall={handleCreateWall}
                  onCreateSpotLight={handleCreateSpotLight}
                  images={images}
                  onImageDragStart={img => setDraggedImage(img)}
                  onImageMetaChange={handleImageMetaChange}
                  onTempTourIndexChange={handleTempTourIndexChange}
                  onCreateCameraTourMarker={handleCreateCameraTourMarker}
                  onUpdateTourMarkers={setTourMarkers}
                  setIsImageEditModalOpen={setIsImageEditModalOpen}
                  onAddImage={handleAddImage}
                  selectedId={selectedId}
                  setSelectedId={setSelectedId}
                  isEditRoom={isEditRoom}
                  setIsEditRoom={setIsEditRoom}
                  onTransformChange={(id, transform) => {
                    if (sceneRef.current) {
                      sceneRef.current.updateTransform(id, transform);
                    }
                  }}
                  objects={objects}
                  skySettings={skySettings}
                  setSkySettings={setSkySettings}
                  groundSettings={groundSettings}
                  setGroundSettings={setGroundSettings}
                  bloomSettings={bloomSettings}
                  setBloomSettings={setBloomSettings}
                  imageFrameList={imageFrameList}
                  imageFrame={imageFrame}
                  skySettingMode={skySettingMode}
                  setSkySettingMode={setSkySettingMode}
                  groundSettingMode={groundSettingMode}
                  setGroundSettingMode={setGroundSettingMode}
                  wallTextureList={wallTextureList}
                  groundTextureList={groundTextureList}
                  setHdri={setHdri}
                  hdri={hdri}
                  setGroundTexture={setGroundTexture}
                  groundTexture={groundTexture}
                  onSceneChange={handleSceneChange}
                  onSaveScene={handleSaveScene}
                  currentSceneFile={currentSceneFile}
                  onCreateImageFrame={handleCreateImageFrame}
                  onShowTransparentWallsChange={setShowTransparentWalls}
                  tourMarkers={tourMarkers}
                  tempTourIndices={tempTourIndices}
                  setTempTourIndices={setTempTourIndices}
                  uploadedAudioFiles={uploadedAudioFiles}
                  onAddAudio={handleAddAudio}
                  onRemoveAudio={handleRemoveAudio}
                />

              {popupShouldRender && (
                <ObjectPopup
                  images={images}
                  visible={popupVisible}
                  mousePosition={popupPosition}
                  onClose={() => {
                    setPopupVisible(false);
                  }}
                  selectedId={selectedId}
                  setSelectedId={setSelectedId}
                  objects={objects}
                  setGizmoMode={setGizmoMode} 
                  onDelete={() => {
                    if (sceneRef.current && selectedId) {
                      sceneRef.current.deleteObject(selectedId);
                    }
                  }}
                  onColorChange={(color) => {
                    if (sceneRef.current && selectedId) {
                      const obj = objects.find(o => o.id === selectedId);

                      if (obj?.type === "wall") {
                        sceneRef.current.updateTransform(selectedId, { color });
                      } else if (obj?.type === "image") {
                        sceneRef.current.updateTransform(selectedId, { frameColor: color });
                      } else if (obj?.type === "spotLight") {
                        sceneRef.current.updateTransform(selectedId, { color });
                      }
                    }
                  }}
                  onTextureChange={(texture) => {
                    if (sceneRef.current && selectedId) {
                      sceneRef.current.updateTransform(selectedId, {
                        albedo: texture.alb,
                        normal: texture.nor,
                        orm: texture.orm,
                      });
                    }
                  }}
                  wallTextureList={wallTextureList}
                  frameList={imageFrameList}
                  onFrameChange={(frame) => {
                    if (sceneRef.current && selectedId) {
                      sceneRef.current.updateTransform(selectedId, { imageFrameId: frame.id });
                    }
                  }}
                  onLightChange={(id, changes) => {
                    if (sceneRef.current) {
                      sceneRef.current.updateTransform(id, changes);
                    }
                  }}
                  replaceImageOnFrame={replaceImageOnFrame}
                  handleCreateSpotLightForImage={handleCreateSpotLightForImage}
                  tourMarkers={tourMarkers}
                  onUpdateTourMarkers={setTourMarkers}
                  uploadedAudioFiles={uploadedAudioFiles}
                  soundController={soundController.current}
                  onSave={handleSave}
                  onTempTourIndexChange={handleTempTourIndexChange}
                />
              )}
              </>
            )}
          </div>
        </div>

        {/* Independent Save Button */}
        <button 
          className={`save-button-circle ${saveSuccess ? 'saved' : ''}`} 
          onClick={handleSave} 
          title="Save Changes"
        >
          <svg 
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
            <polyline points="17,21 17,13 7,13 7,21"/>
            <polyline points="7,3 7,8 15,8"/>
          </svg>
        </button>

      {/* Audio Mute/Unmute Button */}
      <button 
        className={`audio-button ${isMuted ? 'muted' : ''}`} 
        onClick={toggleMute} 
        title={isMuted ? "Unmute Audio" : "Mute Audio"}
        disabled={!audioInitialized}
      >
        {isMuted ? (
          // Muted Icon
          <svg 
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <polygon points="11,5 6,9 2,9 2,15 6,15 11,19"/>
            <line x1="23" y1="9" x2="17" y2="15"/>
            <line x1="17" y1="9" x2="23" y2="15"/>
          </svg>
        ) : (
          // Unmuted Icon
          <svg 
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <polygon points="11,5 6,9 2,9 2,15 6,15 11,19"/>
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
          </svg>
        )}
      </button>

      {/* Fullscreen Toggle Button - Hidden on iOS */}
      {!(/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) && (
        <button 
          className={`fullscreen-button ${isFullscreen ? 'active' : ''}`} 
          onClick={toggleFullscreen} 
          title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
        >
          {isFullscreen ? (
            // Exit Fullscreen Icon
            <svg 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M8 3v3a2 2 0 0 1-2 2H3"/>
              <path d="M21 8h-3a2 2 0 0 1-2-2V3"/>
              <path d="M3 16h3a2 2 0 0 1 2 2v3"/>
              <path d="M16 21v-3a2 2 0 0 1 2-2h3"/>
            </svg>
          ) : (
            // Enter Fullscreen Icon
            <svg 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M3 7V4a1 1 0 0 1 1-1h3"/>
              <path d="M17 3h3a1 1 0 0 1 1 1v3"/>
              <path d="M21 17v3a1 1 0 0 1-1 1h-3"/>
              <path d="M7 21H4a1 1 0 0 1-1-1v-3"/>
            </svg>
          )}
        </button>
      )}

      {/* Tour Mode Toggle Button - View Mode Only */}
      {mode === 'view' && (
        <button 
          className={`tour-mode-button ${tourMode ? 'active' : ''} ${(/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) ? 'ios-positioned' : ''}`} 
          onClick={toggleTourMode} 
          title={tourMode ? "Exit Tour Mode" : "Start Tour Mode"}
        >
          {tourMode ? (
            // Active Tour Icon (Camera with separate stop button)
            <svg 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              {/* Video Camera */}
              <path d="M23 7l-7 5 7 5V7z"/>
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
              {/* Stop Button */}
              <rect x="6" y="9" width="5" height="5" fill="currentColor"/>
            </svg>
          ) : (
            // Inactive Tour Icon (Camera with separate play button)
            <svg 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              {/* Video Camera */}
              <path d="M23 7l-7 5 7 5V7z"/>
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
              {/* Play Button - centered in the main camera rectangle */}
              <polygon points="7,10 7,14 11,12" fill="currentColor"/>
            </svg>
          )}
        </button>
      )}

      {/* Tour Markers Visibility Toggle Button - Edit Mode Only */}
      {mode === 'edit' && (
        <button 
          className={`markers-button ${markersVisible ? 'visible' : 'hidden'} ${(/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) ? 'ios-positioned' : ''}`} 
          onClick={toggleMarkerVisibility} 
          title={markersVisible ? "Hide Tour Markers" : "Show Tour Markers"}
        >
        {markersVisible ? (
          // Visible Waypoint Icon
          <svg 
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <circle cx="12" cy="10" r="3"/>
            <path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 7 8 11.7z"/>
          </svg>
        ) : (
          // Hidden Waypoint Icon (with slash)
          <svg 
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <circle cx="12" cy="10" r="3"/>
            <path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 7 8 11.7z"/>
            <line x1="2" y1="2" x2="22" y2="22"/>
          </svg>
        )}
        </button>
      )}
  
      {/* 3D Canvas */}
      <Canvas
        shadows
        dpr={[1, 1.5]}
        onPointerMissed={() => {
          if (mode === 'edit') {
            setSelectedId(null); // Unselect everything when clicking on empty spacesad
          }
        }}
        onCreated={({ gl }) => {
          gl.domElement.style.touchAction = 'none';
          gl.domElement.style.userSelect = 'none';
          gl.domElement.style.webkitUserSelect = 'none';
          gl.domElement.style.webkitTouchCallout = 'none';
        }}
      >
        <WebGLContextLossHandler />
        <Suspense fallback={null}>{
          <Scene
            gizmoMode={gizmoMode}
            setGizmoMode={setGizmoMode}
            ref={sceneRef} // Pass the ref to Scene
            popupVisible={popupVisible}
            mode={mode}
            selectedId={selectedId}
            setSelectedId={setSelectedId}
            objects={objects}
            objectData={currentSceneData}
            images={images}
            tempTourIndices={tempTourIndices}
            tourMarkers={tourMarkers}
            markersVisible={markersVisible}
            tourMode={tourMode}
            tourInfoButtonVisible={tourInfoButtonVisible}
            tourInfoPanelOpen={tourInfoPanelOpen}
            onShowTourInfo={showTourInfo}
            onHideTourInfo={hideTourInfo}
            onHideAnyInfoPanel={hideAnyInfoPanel}
            soundController={soundController.current}
            isMuted={isMuted}
            tourPlaying={tourPlaying}
            currentTourIndex={currentTourIndex}
            setCurrentTourIndex={setCurrentTourIndex}
            setTourProgress={setTourProgress}
            isEditRoom={isEditRoom}
            onTourComplete={() => {
              setTourMode(false);
              setTourPlaying(false);
              setCurrentTourIndex(0);
              setTourProgress(0);
            }}
            onTourInterrupted={() => {
              setTourMode(false);
              setTourPlaying(false);
              setCurrentTourIndex(0);
              setTourProgress(0);
            }}
            draggedImage={draggedImage}
            setDraggedImage={setDraggedImage}
            isImageEditModalOpen={isImageEditModalOpen}
            onObjectsChange={(updatedObjects) => {
              setObjects(updatedObjects);
            }}
            onObjectAdded={(id, position, rotation, scaleOrExtra, type = 'wall') => {
              setSelectedId(null);
              console.log(`New object added:`, { id, position, rotation, scaleOrExtra, type });

                let newObject;

                switch (type) {
                  case 'wall':
                    newObject = {
                      id: id,
                      type: type,
                      position: position,
                      rotation: rotation,
                      scale: scaleOrExtra.scale ?? [1, 1, 1],
                      color: scaleOrExtra.color ?? '#b6b898',
                      albedo: "/textures/default/tex_default_alb.jpg",
                      normal: "/textures/default/tex_default_nor.jpg",
                      orm: "/textures/default/tex_default_orm.jpg",
                      children: [],
                      transparent: scaleOrExtra.transparent || false
                    };
                    break;

                  case 'spotLight':
                    newObject = {
                      id: id,
                      type: type,
                      position: position,
                      rotation: rotation,
                      intensity: scaleOrExtra.intensity ?? 10,
                      color: scaleOrExtra.color ?? '#ffffff',
                      angle: scaleOrExtra.angle ?? 30,
                      penumbra: scaleOrExtra.penumbra ?? 0.5,
                      imageParent: scaleOrExtra.imageParent ?? null
                    };
                    break;

                  case 'image':
                    newObject = {
                      id: id,
                      type: type,
                      position: position,
                      rotation: rotation,
                      src: scaleOrExtra.src,
                      alt: scaleOrExtra.alt,
                      title: scaleOrExtra.title,
                      scale: scaleOrExtra.scale,
                      parent: scaleOrExtra.parent,
                      imageFrameId: scaleOrExtra.imageFrameId || "imageFrame-1",
                      frameColor: scaleOrExtra.frameColor
                    };
                    break;
                }

                setObjects(prev => [...prev, newObject]);
              }}
              skySettings={skySettings}
              groundSettings={groundSettings}
              bloomSettings={bloomSettings}
              imageFrame={imageFrame}
              imageFrameList={imageFrameList}
              hdri={hdri}
              groundTexture={groundTexture}
              skySettingMode={skySettingMode}
              groundSettingMode={groundSettingMode}
              setPopupData={setPopupData}
              setPopupPosition={setPopupPosition}
              setPopupVisible={setPopupVisible}
              onImageClick={(data) => {
                // During tour mode, don't show regular panel
                if (!tourMode) {
                  setPanelData(data);
                  setPanelVisible(true);
                }
              }}
              setTooltip={setTooltip}
              mobileInput={mobileInputRef.current}
              isJoystickActive={isJoystickActive}
              showTransparentWalls={showTransparentWalls}
              uploadedAudioFiles={uploadedAudioFiles}
            />
          }</Suspense>
          
          <Html center><Loader /></Html>
        </Canvas>
        <ImageInfoPanel 
          visible={tourMode ? tourInfoButtonVisible : panelVisible} 
          data={panelData} 
          onClose={tourMode ? closeTourInfo : () => setPanelVisible(false)}
          tourMode={tourMode}
          tourInfoButtonVisible={tourInfoButtonVisible}
          onOpenTourInfo={openTourInfo}
          tourMarkers={tourMarkers}
          soundController={soundController.current}
          isMuted={isMuted}
        />
        {/* Tooltip */}
        <Tooltip {...tooltip} />
        
        {/* Tour Progress Bar */}
        {tourMode && (
          <div className="tour-progress-container">
            <div className="tour-controls">
              <button 
                className="tour-control-btn backward"
                onClick={goToPreviousImage}
                disabled={currentTourIndex === 0}
                title="Previous Image"
              >
                {/* Backward Icon */}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="19,20 9,12 19,4"/>
                  <line x1="5" y1="19" x2="5" y2="5"/>
                </svg>
              </button>
              
              <button 
                className="tour-control-btn play-pause"
                onClick={tourPlaying ? pauseTour : playTour}
                title={tourPlaying ? "Pause Tour" : "Play Tour"}
              >
                {tourPlaying ? (
                  // Pause Icon
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="6" y="4" width="4" height="16"/>
                    <rect x="14" y="4" width="4" height="16"/>
                  </svg>
                ) : (
                  // Play Icon
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="5,3 19,12 5,21"/>
                  </svg>
                )}
              </button>
              
              <button 
                className="tour-control-btn forward"
                onClick={goToNextImage}
                disabled={currentTourIndex >= getTourImages().length - 1}
                title="Next Image"
              >
                {/* Forward Icon */}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="5,4 15,12 5,20"/>
                  <line x1="19" y1="5" x2="19" y2="19"/>
                </svg>
              </button>
              
              <div className="tour-progress-bar">
                <div 
                  className="tour-progress-fill" 
                  style={{ width: `${tourProgress}%` }}
                />
              </div>
              
              <button 
                className="tour-control-btn exit"
                onClick={exitTour}
                title="Exit Tour"
              >
                {/* Stop/Exit Icon */}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Mobile Controls */}
        <MobileControls
          onMove={handleMobileMove}
          onJoystickStateChange={handleJoystickStateChange}
        />
      </div>
    </>
  );
}

export default App;