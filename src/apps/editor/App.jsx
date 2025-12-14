import React, { lazy, Suspense } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { useState, useRef, useEffect } from 'react';
import Scene from './Scene';
import soundController from "../../components/globalSound";

// Dynamic imports for edit-mode components
const Toolbox = lazy(() => import('./Toolbox'));
const ObjectPopup = lazy(() => import('./ObjectPopup.jsx'));

// Panel components (can be lazy loaded for better performance)
const ImageInfoPanel = lazy(() => import('./components/ImageInfoPanel'));
const ImageListPanel = lazy(() => import('./components/ImageListPanel'));
import './App.css';
import ExhibitionInfoPanel from './components/ExhibitionInfoPanel'
import Tooltip from "./components/Tooltip";
import MobileControls from './components/MobileControls';
import PopUpWelcome from './components/PopUpWelcome';
import Toast from './components/Toast';
import Loader from './components/Loader/Loader';
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { getAllExhibitions, updateExhibition, getExhibitionByUserId } from "../../apiEditor/exhibitionApi";
import { getAllRoomTemplates, updateRoomTemplate, importGlbForRoomTemplate, getRoomTemplateByUserId } from '../../apiEditor/roomTemplateApi';
import { getMediaList, uploadMedia, deleteMedia, updateMedia } from "../../apiEditor/mediaApi";
import { getAllTextures } from '../../apiEditor/textureApi';
import { getAudioList, uploadAudio, deleteAudio } from '../../apiEditor/audioApi';
import { getObject3DList } from '@/apiEditor/object3DApi';
import { initCurrentUser, getUserRole } from "../../apiEditor/authApi";

const App = () => {
  
  // Performance monitoring for view mode optimization
  useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const loadTime = performance.now() - startTime;
      console.log(`App initialization time: ${loadTime.toFixed(2)}ms`);
      
      if (mode === 'view') {
        console.log('View mode optimized - edit components not loaded');
      } else {
        console.log('Edit mode active - all components loaded');
      }
    };
  }, []);

  const DEFAULT_OBJECT_DATA = {
    isPreset: false,
    imageFrameList: [
      {
        id: "imageFrame-0",
        name: "Không Khung",
        src: "/images/imageFrame.png"
      },
      {
        id: "imageFrame-1",
        name: "Khung Đơn Giản",
        src: "/images/imageFrame.png"
      },
      {
        id: "imageFrame-2",
        name: "Khung Canvas",
        src: "/images/imageFrame.png"
      },
      {
        id: "imageFrame-3",
        name: "Khung Gỗ",
        src: "/images/imageFrame.png"
      },
      {
        id: "imageFrame-4",
        name: "Khung Thủy Tinh",
        src: "/images/imageFrame.png"
      },
      {
        id: "imageFrame-5",
        name: "Hình Tròn Đơn Giản",
        src: "/images/imageFrame.png"
      },
      {
        id: "imageFrame-6",
        name: "Hình Tròn Canvas",
        src: "/images/imageFrame.png"
      },
      {
        id: "imageFrame-7",
        name: "Hình Tròn Gỗ",
        src: "/images/imageFrame.png"
      }
    ],
    objects: {
      wall: [
        {
          id: "wall-1762482238762",
          orm: "/textures/default/tex_default_orm.jpg",
          type: "wall",
          color: "#b6b898",
          scale: [
            1.5,
            1.5,
            1.5
          ],
          albedo: "/textures/default/tex_default_alb.jpg",
          normal: "/textures/default/tex_default_nor.jpg",
          children: [],
          position: [
            0,
            1.5,
            -3.75
          ],
          rotation: [
            0,
            -26.1,
            0
          ],
          objectRole: "user",
          transparent: false
        }
      ],
      image: [],
      light: [],
      spawn: {
        id: "spawn-1",
        type: "spawn",
        scale: [
          1.5,
          1.5,
          1.5
        ],
        position: [
          0,
          0.2,
          0
        ],
        rotation: [
          -90,
          0,
          0
        ]
      },
      tourMarkers: []
    }
  }
  // Default environment settings
  const DEFAULT_ENVIRONMENT_DATA = {
    backgroundAudio: '',
    skySettingMode: "preset",
    groundSettingMode: "ground",
    selectedHdri: "sunset",
    selectedGroundTexture: {
      id: "ba84910e-2af6-4030-a0e4-537a2424cf83",
      alb: "https://nsumwobjesbawigigfwy.supabase.co/storage/v1/object/public/textures/textures/06-11-2025/05346519-9fc2-409d-92e6-badbd986762b/albedo_a82b636e-9078-40d0-90e1-2706bf947e0f.jpg",
      nor: "https://nsumwobjesbawigigfwy.supabase.co/storage/v1/object/public/textures/textures/06-11-2025/05346519-9fc2-409d-92e6-badbd986762b/normal_d24c6694-6ae4-44e0-8bf6-d5867468133b.jpg",
      orm: "https://nsumwobjesbawigigfwy.supabase.co/storage/v1/object/public/textures/textures/06-11-2025/05346519-9fc2-409d-92e6-badbd986762b/orm_1eb59ac5-ef42-4036-9c2f-ae33a60fe0e0.jpg",
      image: "/hdri/hdri.jpg"
    },
    sky: {
      distance: 989000,
      sunPosition: [
        100,
        -8,
        447
      ],
      inclination: 0,
      azimuth: 0,
      turbidity: 9.7,
      rayleigh: 3.7,
      mieCoefficient: 0.04,
      mieDirectionalG: 0.9600000000000001,
      exposure: 0
    },
    ground: {
      blur: [
        8,
        4
      ],
      resolution: 256,
      mixBlur: 0.69,
      mixStrength: 1.5,
      roughness: 1.23,
      depthScale: 0.21000000000000002,
      minDepthThreshold: 1.24,
      maxDepthThreshold: 1.2,
      metalness: 0.1,
      color: "#a6e8dd"
    },
    bloom: {
      enabled: false,
      luminanceThreshold: 1,
      luminanceSmoothing: 0.9,
      intensity: 1.5
    }
  };

  const [sceneReady, setSceneReady] = useState(false);
  const { slug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [objectData, setObjectData] = useState(DEFAULT_OBJECT_DATA);
  const [enviromentData, setEnviromentData] = useState(DEFAULT_ENVIRONMENT_DATA);
  const [exhibition, setExhibition] = useState(null);
  const [mode, setMode] = useState('view'); // State to manage mode (edit or view)
  const [selectedId, setSelectedId] = useState(null); // State to track the currently selected wall
  const [draggedImage, setDraggedImage] = useState(null); // State to track the dragged image
  const [editModeLoaded, setEditModeLoaded] = useState(false); // Track if edit mode components are loaded
  // const [images, setImages] = useState(objectData.images);
  const [images, setImages] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [pagination, setPagination] = useState(null);
  const [textureData, setTextureData] = useState([])
  const [audios, setAudios] = useState([])
  const [room3DData, setRoom3DData] = useState([])
  const [uploadedAudioFiles, setUploadedAudioFiles] = useState([]); // 
  const imageFrameList = objectData.imageFrameList; 

  // Flatten the categorized objects structure into a single array for backward compatibility
  const flattenObjects = (objectsData) => {
    if (!objectsData) return [];
    
    // If already a flat array (old format), return as is
    if (Array.isArray(objectsData)) {
      return objectsData;
    }
    
    // If categorized structure (new format), flatten it
    const flattened = [];
    
    // Add spawn object (single object, not array)
    if (objectsData.spawn && typeof objectsData.spawn === 'object') {
      flattened.push(objectsData.spawn);
    }
    
    // Add arrays of objects
    ['wall', 'image', 'light'].forEach(category => {
      if (Array.isArray(objectsData[category])) {
        flattened.push(...objectsData[category]);
      }
    });
    
    return flattened;
  };

  // Convert flat objects array back to categorized structure for saving
  const flattenToCategories = (objectsArray) => {
    if (!Array.isArray(objectsArray)) return {};
    
    const categorized = {
      wall: [],
      image: [],
      light: [],
      spawn: null
    };
    
    objectsArray.forEach(obj => {
      if (obj.type === 'spawn') {
        categorized.spawn = obj;
      } else if (obj.type === 'wall') {
        categorized.wall.push(obj);
      } else if (obj.type === 'image') {
        categorized.image.push(obj);
      } else if (obj.type === 'spotLight') {
        categorized.light.push(obj);
      }
    });
    
    return categorized;
  };
  
  const [objects, setObjects] = useState(flattenObjects(objectData.objects));
  const [tourMarkers, setTourMarkers] = useState(
    objectData.objects?.tourMarkers || []
  );
  const [currentSceneData, setCurrentSceneData] = useState(objectData);
  const [isImageEditModalOpen, setIsImageEditModalOpen] = useState(false);
  const sceneRef = useRef(); // Reference to access the Scene component's methods
  const [isEditRoom, setIsEditRoom] = useState(false);
  const [openPopUpWelcome, setOpenPopUpWelcome] = useState(true);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [backgroundAudio, setBackgroundAudio] = useState(''); // Selected background audio URL
  const [backgroundAudioLoading, setBackgroundAudioLoading] = useState(false); // Background audio loading state

  const [userStatus, setUserStatus] = useState({
    typeRoom: 'exhibition',
    modeRoom: 'view',
    objectRole: 'user'
  });

  const [snapEnabled, setSnapEnabled] = useState(true);

  function parseRoomRoute(pathname) {
    const segments = pathname.split('/').filter(Boolean);

    // segments[0] là route prefix
    // ví dụ:
    // /template/abc         → ['template', 'abc']
    // /template-edit/abc    → ['template-edit', 'abc']
    // /exhibition/abc       → ['exhibition', 'abc']
    // /exhibition-edit/abc  → ['exhibition-edit', 'abc']

    const firstSegment = segments[0] || '';

    const isEdit =
      firstSegment === 'template-edit' ||
      firstSegment === 'exhibition-edit';

    const typeRoom =
      firstSegment.startsWith('template')
        ? 'template'
        : 'exhibition';

    return {
      typeRoom,
      modeRoom: isEdit ? 'edit' : 'view',
    };
  }

  const hasCheckedUser = useRef(false);


  // User authentication check
  useEffect(() => {
    const checkUser = async () => {
      if (userStatus.modeRoom !== "edit") return;
      if (hasCheckedUser.current) return; 
      hasCheckedUser.current = true;

      const user = await initCurrentUser();
      console.log("User authentication check:", user);
      if (!user) return navigate("/login");
    };

    checkUser();
  }, [userStatus.modeRoom, navigate]);

  // Consolidated data loading effect
  // =================== EFFECT 1: LOAD ROOM + ENVIRONMENT ===================
useEffect(() => {
  if (!slug) return;

  let isMounted = true;

  const loadRoomData = async () => {
    try {
      const { typeRoom, modeRoom } = parseRoomRoute(location.pathname);
      console.log(`Loading data for ${typeRoom} in ${modeRoom} mode...`);
      setUserStatus({
        typeRoom,
        modeRoom,
        objectRole: typeRoom,
        userRole: getUserRole()
      });

      // Load exhibition/template info
      let list;
      if (modeRoom === "edit") {
        // EDIT MODE → chỉ load item thuộc user
        if (typeRoom === "template") {
          list = await getRoomTemplateByUserId();
        } else {
          list = await getExhibitionByUserId();
        }
      } else {
        // VIEW MODE → load toàn bộ public
        list = await (typeRoom === "template"
          ? getAllRoomTemplates()
          : getAllExhibitions());
      }

      const found = list.find(item => item.slug === slug);
      console.log(`Found ${typeRoom}:`, found);
      if (!found) {
        navigate("/404");
        return;
      }

      if (!isMounted) return;
      setExhibition(found);

      // ------------------ ROOM PARSE ------------------
      const config = typeRoom === "template"
        ? found.room_json
        : found.room_json;

      const rawRoom = config?.room;
      const roomJson = rawRoom
        ? (typeof rawRoom === "string" ? JSON.parse(rawRoom) : rawRoom)
        : DEFAULT_OBJECT_DATA;

      const safeRoom = {
        ...DEFAULT_OBJECT_DATA,
        ...roomJson,
        objects: roomJson.objects || roomJson.room || DEFAULT_OBJECT_DATA.objects,
        imageFrameList: DEFAULT_OBJECT_DATA.imageFrameList,
      };

      if (!isMounted) return;
      setObjectData(safeRoom);
      setCurrentSceneData(safeRoom);
      setObjects(flattenObjects(safeRoom.objects));
      setTourMarkers(safeRoom.objects?.tourMarkers || safeRoom.tourMarkers || []);

      // ------------------ ENV PARSE ------------------
      const rawEnv = config?.environment;
      const envJson = rawEnv
        ? (typeof rawEnv === "string" ? JSON.parse(rawEnv) : rawEnv)
        : DEFAULT_ENVIRONMENT_DATA;

      const safeEnv = {
        ...DEFAULT_ENVIRONMENT_DATA,
        ...envJson,
        sky: { ...DEFAULT_ENVIRONMENT_DATA.sky, ...(envJson?.sky || {}) },
        ground: { ...DEFAULT_ENVIRONMENT_DATA.ground, ...(envJson?.ground || {}) },
        bloom: { ...DEFAULT_ENVIRONMENT_DATA.bloom, ...(envJson?.bloom || {}) },
        selectedGroundTexture: {
          ...DEFAULT_ENVIRONMENT_DATA.selectedGroundTexture,
          ...(envJson?.selectedGroundTexture || {}),
        },
        skySettingMode: envJson?.skySettingMode ?? DEFAULT_ENVIRONMENT_DATA.skySettingMode,
        groundSettingMode: envJson?.groundSettingMode ?? DEFAULT_ENVIRONMENT_DATA.groundSettingMode,
        selectedHdri: envJson?.selectedHdri ?? DEFAULT_ENVIRONMENT_DATA.selectedHdri,
        backgroundAudio: envJson?.backgroundAudio ?? DEFAULT_ENVIRONMENT_DATA.backgroundAudio
      };

      if (!isMounted) return;

      setEnviromentData(safeEnv);
      setSkySettings(safeEnv.sky);
      setGroundSettings(safeEnv.ground);
      setBloomSettings(safeEnv.bloom);
      setHdri(safeEnv.selectedHdri);
      setGroundTexture(safeEnv.selectedGroundTexture);
      setSkySettingMode(safeEnv.skySettingMode);
      setGroundSettingMode(safeEnv.groundSettingMode);
      setBackgroundAudio(safeEnv.backgroundAudio);

      // ------------------ LOAD TEXTURES + AUDIOS ------------------
      if (modeRoom === "edit") {
        console.log("hello");
        const [tex, aud, ob3D] = await Promise.all([getAllTextures(), getAudioList(), getObject3DList()]);
        if (!isMounted) return;
        setTextureData(tex);
        setAudios(aud);
        setRoom3DData(ob3D);
      } else {
        setTextureData([]);
        setAudios([]);
      }

      setExhibitionLoaded(true);
      setMediaLoaded(true);
      setSlowMediaLoaded(true);

    } catch (err) {
      console.error(err);
      if (isMounted) {
        setExhibitionLoaded(true);
        setMediaLoaded(true);
        setSlowMediaLoaded(true);
      }
    }
  };

  loadRoomData();
  return () => { isMounted = false; };
}, [slug, location.pathname]);

// =================== EFFECT 2: LOAD MEDIA LIST (PAGINATION ONLY) ===================
useEffect(() => {
  if (!slug) return;

  const { typeRoom, modeRoom } = parseRoomRoute(location.pathname);
  if (modeRoom !== "edit") return;

  let isMounted = true;

  const loadImages = async () => {
    try {
      const params = { page, page_size: pageSize };
      const res = await getMediaList(params);

      if (!isMounted) return;

      setImages(res || []);
      setPagination(res?.pagination);
    } catch (err) {
      console.error("Failed to load images:", err);
    }
  };

  loadImages();

  return () => { isMounted = false; };
}, [slug, location.pathname, page, pageSize]);

  // Helper function to get the current background audio URL
  const getCurrentBackgroundAudio = () => {
    return backgroundAudio;
  };

  const closePopUpWelcome = (mode) => {
    setOpenPopUpWelcome(false);

    // If tour mode is requested, activate tour mode
    if (mode === 'tour') {
      setTourMode(true);
      setMode('view'); // Ensure we're in view mode for tour
    }

    const controller = soundController;
    const bgUrl = getCurrentBackgroundAudio();

    try {
      const kick = new Audio(getCurrentBackgroundAudio());
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

            (async () => {
              await controller.ensureInitialized();
              await controller.ensureResumed();
              await controller.playBackgroundAudio(getCurrentBackgroundAudio());
            })();
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
  
  // Handle mode switching and conditional loading
  useEffect(() => {
    if (mode === 'edit' && !editModeLoaded) {
      console.log('🔄 Switching to edit mode - loading edit components...');
      const startTime = performance.now();
      
      // Load edit-mode data only when entering edit mode
      setEditModeLoaded(true);
      
      // Preload edit components (they're already lazy loaded)
      const preloadComponents = async () => {
        try {
          await Promise.all([
            import('./Toolbox'),
            import('./ObjectPopup.jsx')
          ]);
          const loadTime = performance.now() - startTime;
          console.log(`✅ Edit mode components preloaded in ${loadTime.toFixed(2)}ms`);
        } catch (error) {
          console.warn('⚠️ Failed to preload edit components:', error);
        }
      };
      
      preloadComponents();
    }
  }, [mode, editModeLoaded]);
  
  const wallTextureList = textureData.filter(item => item.texture_for === "wall");
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
  const groundTextureList = textureData.filter(item => item.texture_for === "ground");
  const defaultGroundFromList = groundTextureList[0]
    ? {
        id: groundTextureList[0].id,
        alb: groundTextureList[0].alb,
        nor: groundTextureList[0].nor,
        orm: groundTextureList[0].orm,
        image: "/hdri/hdri.webp"
      }
    : DEFAULT_ENVIRONMENT_DATA.selectedGroundTexture;

  const [groundTexture, setGroundTexture] = useState(
    enviromentData.selectedGroundTexture || defaultGroundFromList
  );
  const [skySettingMode, setSkySettingMode] = useState(enviromentData.skySettingMode || 'sky');
  const [groundSettingMode, setGroundSettingMode] = useState(enviromentData.groundSettingMode || 'ground');
  const [hdri, setHdri] = useState(enviromentData.selectedHdri || undefined);
  const glbTextureList = textureData.filter(item => item.texture_for === "GLB");
  //Setting enviroment

  //Image Frame
  const imageFrame = {
    id: "imageFrame",
    src: "/images/imageFrame.png",
    alt: "Drag and drop photos into the frame",
    title: "Image Frame"
  }
  //Image Frame

  //Image Frame
  const physicPlane = {
    id: "physicPlane",
    src: "/images/entry.jpg",
    alt: "",
    title: "Physic Plane"
  }
  //Image Frame

  const [popupVisible, setPopupVisible] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const [popupData, setPopupData] = useState(null);

  // Determine when ObjectPopup should render
  const popupShouldRender = mode === 'edit' && popupVisible;

  const [audioInitialized, setAudioInitialized] = useState(false);
  // Sound state (mute/unmute)
  const [isMuted, setIsMuted] = useState(() => {
    const saved = localStorage.getItem('app_isMuted');
    return saved ? JSON.parse(saved) : false;
  });
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [toast, setToast] = useState({ 
    visible: false, 
    message: '', 
    type: 'success' 
  });

  // Helper function to show toast notifications
  const showToast = (message, type = 'success') => {
    setToast({
      visible: true,
      message,
      type
    });
  };

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
  const [lastPanelData, setLastPanelData] = useState(null); // Store the last panel data to restore later
  const tourInfoRestoreTimeout = useRef(null);
  const [tourInfoPanelOpen, setTourInfoPanelOpen] = useState(false);

  // Exhibition info panel state
  const [exhibitionInfoPanelOpen, setExhibitionInfoPanelOpen] = useState(false);
  
  // Image list panel state
  const [imageListPanelOpen, setImageListPanelOpen] = useState(false);

  const [isJoystickActive, setIsJoystickActive] = useState(false);
  const [currentSceneFile, setCurrentSceneFile] = useState('object.json');
  const [showTransparentWalls, setShowTransparentWalls] = useState(false); // Track transparent walls visibility
  const [isFullscreen, setIsFullscreen] = useState(false); // Track fullscreen state

  // Loading state flags
  const [exhibitionLoaded, setExhibitionLoaded] = useState(false);
  const [mediaLoaded, setMediaLoaded] = useState(false);
  const [slowMediaLoaded, setSlowMediaLoaded] = useState(false);

  // Consolidated audio management effect
  useEffect(() => {
    let interval;
    let isComponentMounted = true;

    // Initialize audio
    const initAudio = async () => {
      if (!isComponentMounted) return;
      try {
        await soundController.ensureInitialized();
        await soundController.ensureResumed();
        if (isComponentMounted) setAudioInitialized(true);
      } catch (err) {
        console.warn('Audio initialization failed:', err);
      }
    };

    // Handle user gestures to unlock audio
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

        if (isComponentMounted) setAudioUnlocked(true);
        window.removeEventListener("touchstart", handleUserGesture);
        window.removeEventListener("mousedown", handleUserGesture);
        window.removeEventListener('pointerdown', handleUserGesture);
      } catch (err) {
        console.warn("Audio unlock failed:", err);
      }
    };

    // Handle page visibility changes
    const handleVisibilityChange = () => {
      if (!document.hidden && soundController && audioInitialized && !isMuted && isComponentMounted) {
        setTimeout(() => {
          ensureBackgroundAudioPlaying();
        }, 100);
      }
    };

    // Monitor background audio and handle mute state
    const setupAudioManagement = () => {
      if (!soundController || !audioInitialized || !isComponentMounted) return;
      
      // Handle mute state
      if (isMuted) {
        soundController.setMasterVolume(0, 0);
      } else {
        soundController.setMasterVolume(soundController.config.masterVolume, 0);
        setTimeout(() => {
          if (isComponentMounted) ensureBackgroundAudioPlaying();
        }, 200);
      }

      // Set up background audio monitoring
      if (interval) clearInterval(interval);
      interval = setInterval(() => {
        if (isComponentMounted) ensureBackgroundAudioPlaying();
      }, 3000);
    };

    // Initialize everything
    initAudio();
    
    // Add event listeners
    document.addEventListener("mousedown", handleUserGesture);
    document.addEventListener('pointerdown', handleUserGesture);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Setup audio management when dependencies change
    setupAudioManagement();

    // Cleanup function
    return () => {
      isComponentMounted = false;
      if (interval) clearInterval(interval);
      document.removeEventListener("touchstart", handleUserGesture);
      document.removeEventListener("mousedown", handleUserGesture);
      document.removeEventListener('pointerdown', handleUserGesture);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      // Stop all background audio
      try {
        soundController.audioElements.forEach((data, id) => {
          if (data.isBackground) soundController.stopAudio(id, true);
        });
      } catch (e) {
        console.warn("Failed to stop audio:", e);
      }

      // Clean up tour info restore timeout
      if (tourInfoRestoreTimeout.current) {
        clearTimeout(tourInfoRestoreTimeout.current);
      }
    };
  }, [audioInitialized, backgroundAudio, isMuted]); // Dependencies for audio management

  // Only run preloader when *ALL API DATA* is loaded
  const dataLoaded = exhibitionLoaded && mediaLoaded && slowMediaLoaded && objectData && enviromentData;
  
  // Simple loading state - assets will load as needed
  const [ready, setReady] = useState(false);
  
  // Set ready to true after data is loaded and a brief delay for visual effect
  useEffect(() => {
    if (dataLoaded) {
      const timer = setTimeout(() => {
        setReady(true);
      }, 2000); // 2 second delay for loader animation
      
      return () => clearTimeout(timer);
    }
  }, [dataLoaded]);

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
  
  // Function to handle background audio changes
  const handleBackgroundAudioChange = async (audioUrl) => {
    setBackgroundAudioLoading(true); // Start loading
    setBackgroundAudio(audioUrl);
    
    // If sound controller is available and audio is initialized, restart background audio
    if (soundController && audioInitialized) {
      const controller = soundController;
      
      try {
        // Ensure audio context is resumed
        if (controller.audioContext && controller.audioContext.state === 'suspended') {
          await controller.audioContext.resume();
        }
        
        // Stop current background audio with a longer delay to ensure cleanup
        controller.audioElements.forEach((data, id) => {
          if (data.isBackground) {
            controller.stopAudio(id, true);
          }
        });
        
        // Wait longer for proper cleanup, especially on mobile devices
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Start new background audio
        const newBgAudio = audioUrl;
        await controller.playBackgroundAudio(newBgAudio, controller.config.backgroundVolume);
        
      } catch (err) {
        console.warn("Failed to start new background audio:", err);
        
        // Fallback to default background audio if the selected one fails
        if (audioUrl) {
          try {
            await new Promise(resolve => setTimeout(resolve, 300));
            await controller.playBackgroundAudio(controller.config.backgroundVolume);
          } catch (fallbackErr) {
            console.warn("Even fallback background audio failed:", fallbackErr);
          }
        }
      }
    }
    
    setBackgroundAudioLoading(false); // End loading
  };

  // Function to ensure background audio is robust
  const ensureBackgroundAudioPlaying = () => {
    if (soundController && audioInitialized && !isMuted) {
      const controller = soundController;
      const backgroundAudioData = Array.from(controller.audioElements.entries())
        .find(([id, data]) => data.isBackground);

      if (!backgroundAudioData) {
        // No background audio found - start one
        const currentBgAudio = getCurrentBackgroundAudio();
        if (currentBgAudio) {
          controller.playBackgroundAudio(currentBgAudio, controller.config.backgroundVolume)
            .catch(err => console.warn("Failed to start background audio:", err));
        }
      } else {
        const [id, data] = backgroundAudioData;
        const audio = data.audio;
        
        if (audio && (audio.paused || audio.ended)) {
          audio.play().catch(err => {
            // If direct play fails, restart the background audio completely
            const currentBgAudio = getCurrentBackgroundAudio();
            controller.playBackgroundAudio(currentBgAudio, controller.config.backgroundVolume)
              .catch(restartErr => console.warn("Failed to restart background audio:", restartErr));
          });
        }
      }
    }
  };





  const toggleMode = () => {
    setMode((prevMode) => (prevMode === 'view' ? 'edit' : 'view')); // Toggle between modes
    setSelectedId(null);
  };

  // Handle temporary tour index changes (not saved until save button is pressed)
  const handleTempTourIndexChange = (imageId, index) => {
    setTempTourIndices(prev => {
      const newMap = new Map(prev);
      if (index === -999) {
        // Special value -999 indicates complete removal from tempTourIndices
        newMap.delete(imageId);
        // Don't add to removedFromTour as this is for complete marker deletion
      } else if (index === -1) {
        newMap.delete(imageId);
        // Track that this image was removed from tour
        setRemovedFromTour(prevRemoved => new Set(prevRemoved).add(imageId));
      } else {
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
      showToast('Error: Camera state not available. Make sure the scene is loaded.', 'error');
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
      // Force Y position to camera height level (1.7)
      const CAMERA_HEIGHT = 1.7;
      const newCameraMarker = {
        id: `tourmarker-${markerId}`,
        itemId: markerId, // Unified identifier for both image and camera markers
        type: 'camera', // Identify this as a camera-based marker
        index: newIndex,
        position: [cameraState.position[0], CAMERA_HEIGHT, cameraState.position[2]],
        rotation: cameraState.rotation,
        duration: 5000, // Default duration
      };

      setTourMarkers(prev => [...prev, newCameraMarker]);
    } catch (error) {
      console.error('Error creating camera tour marker:', error);
      showToast('Error creating camera marker: ' + error.message, 'error');
    }
  };

  // Toggle mute/unmute audio
  const toggleMute = async () => {
    const controller = soundController;
    if (!controller || !audioInitialized) return;

    const newMuteState = !isMuted;
    try {
      // Bắt buộc resume AudioContext trước khi bật lại
      await controller.resumeAudioContext();

      if (newMuteState) {
        controller.setMasterVolume(0, 300);
      } else {
        if (controller.audioContext?.state === 'suspended') {
          await controller.audioContext.resume();
        }

        if (controller.masterGainNode?.numberOfOutputs === 0) {
          controller.masterGainNode.connect(controller.audioContext.destination);
        }

        controller.masterGainNode.gain.cancelScheduledValues(controller.audioContext.currentTime);
        controller.masterGainNode.gain.setValueAtTime(
          controller.config.masterVolume,
          controller.audioContext.currentTime + 0.05
        );
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
    // Detect if we're on iOS - disable fullscreen for iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    
    if (isIOSDevice) {
      return; // Exit early for iOS devices
    }
    
    try {
      if (!isFullscreen) {
        // Enter fullscreen
        let element = document.documentElement;
        
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

  const toggleTourMode = () => {
    if (soundController) {
      // Chỉ tắt các audio không phải background
      const controller = soundController;
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
    if (tourImages.length === 0) {
      showToast("No tour images available. Add images to tour markers first.", 'warning');
      return;
    }

    // Nếu audio chưa unlock thì chỉ báo lỗi nhỏ, không crash
    if (!audioUnlocked) {
      showToast("Audio not yet unlocked, tap once more on screen.", 'warning');
    }

    setTimeout(async () => {
      try {
        if (soundController) {
          await soundController.ensureInitialized();
          await soundController.ensureResumed();
        }

        setTourMode(true);
        setTourPlaying(true);
        setCurrentTourIndex(0);
        setTourProgress(0);
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
  if (soundController) {
    const controller = soundController;
    // Dừng tất cả audio đang phát (trừ background)
    controller.audioElements.forEach((data, id) => {
      if (!data.isBackground) controller.stopAudio(id, true);
    });

    // Sau 500ms bật lại nhạc nền
    setTimeout(() => {
      controller.playBackgroundAudio(getCurrentBackgroundAudio(), controller.config.backgroundVolume)
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
    // Clear any pending restore timeout since we're explicitly showing new info
    if (tourInfoRestoreTimeout.current) {
      clearTimeout(tourInfoRestoreTimeout.current);
      tourInfoRestoreTimeout.current = null;
    }
    setLastPanelData(null); // Clear stored data since we have new data
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
    // Store the current panel data before hiding (for restoration after camera movement)
    if (panelData && !lastPanelData) {
      setLastPanelData(panelData);
    }
    
    // Hide tour info if it's visible
    if (tourInfoButtonVisible || tourInfoPanelOpen) {
      hideTourInfo();
    }
    // Hide normal panel if it's visible
    if (panelVisible) {
      setPanelVisible(false);
    }
    // Hide image info panel by clearing panel data
    if (panelData) {
      setPanelData(null);
    }
    // Hide exhibition info if it's visible
    if (exhibitionInfoPanelOpen) {
      setExhibitionInfoPanelOpen(false);
    }
    // Cancel camera movement/slerp by calling the scene's camera cancel function
    if (sceneRef.current?.cancelCameraMovement) {
      sceneRef.current.cancelCameraMovement();
    }

    // Set up a timer to restore the info button after camera movement stops
    if (tourInfoRestoreTimeout.current) {
      clearTimeout(tourInfoRestoreTimeout.current);
    }
    
    // Only set restore timer in tour mode and if we had panel data
    if (tourMode && lastPanelData) {
      tourInfoRestoreTimeout.current = setTimeout(() => {
        setTourInfoButtonVisible(true);
        setPanelData(lastPanelData);
      }, 1500); // Show again after 1.5 seconds of no camera movement
    }
  };

  // Exhibition info panel handlers
  const handleShowExhibitionInfo = () => {
    setExhibitionInfoPanelOpen(true);
  };

  const handleCloseExhibitionInfo = () => {
    setExhibitionInfoPanelOpen(false);
  };
  
  // Image list panel handlers
  const handleShowImageList = () => {
    setImageListPanelOpen(prevOpen => !prevOpen);
  };

  const handleCloseImageList = () => {
    setImageListPanelOpen(false);
  };
  
  // Handle image click for both scene and image list
  const handleImageClick = (data) => {
    // Teleport to the image if scene ref is available
    if (sceneRef.current && data.id) {
      sceneRef.current.teleportToImage(data.id);
    }
    
    // During tour mode, don't show regular panel
    if (!tourMode) {
      setPanelData(data);
      setPanelVisible(true);
    }
  };

  const handleUpdateExhibitionDescription = async (newDescription) => {
    if (!exhibition?.id) return;
    
    try {
      setToast({ visible: true, message: "Updating exhibition description...", type: "info" });
      
      await updateExhibition(exhibition.id, {
        description: newDescription
      });
      
      // Update local state
      setExhibition(prev => ({
        ...prev,
        description: newDescription
      }));
      
      setToast({ visible: true, message: "Exhibition description updated successfully!", type: "success" });
    } catch (error) {
      console.error('Failed to update exhibition description:', error);
      setToast({ visible: true, message: "Failed to update description. Please try again.", type: "error" });
      throw error; // Re-throw so the component can handle it
    }
  };
  

  const handleSave = async () => {
    try {
      setToast({ visible: true, message: "Đang lưu thay đổi...", type: "info" });

      if (!sceneRef.current) return;

      // LẤY PAYLOAD THUẦN TỪ SCENE (objects, images, tourMarkers)
      const scenePayload = sceneRef.current.getRoomPayload(userStatus.typeRoom);

      // Parse room JSON từ scene
      const roomObj = JSON.parse(
        scenePayload.room_json?.room ||
        "{}"
      );

      // LẤY OBJECTS / IMAGES / MARKERS TỪ STATE CHÍNH XÁC NHẤT
      // Apply tempTourIndices changes to tourMarkers before saving
      let updatedTourMarkers = [...tourMarkers];
      if (tempTourIndices && tempTourIndices.size > 0) {
        // Update tour markers with the latest index values from tempTourIndices
        updatedTourMarkers = tourMarkers.map(marker => {
          if (marker.type === 'image' && marker.imageId && tempTourIndices.has(marker.imageId)) {
            return { ...marker, index: tempTourIndices.get(marker.imageId) };
          } else if (marker.type === 'camera' && marker.itemId && tempTourIndices.has(marker.itemId)) {
            return { ...marker, index: tempTourIndices.get(marker.itemId) };
          }
          return marker;
        });
      }

      roomObj.objects = {
        spawn: objects.find(o => o.type === "spawn"),
        wall: objects.filter(o => o.type === "wall"),
        image: objects.filter(o => o.type === "image"),
        light: objects.filter(o => o.type === "spotLight"),
        tourMarkers: updatedTourMarkers    // Use updated markers with applied index changes
      };

      roomObj.imageFrameList = imageFrameList;

      // Build environment
      const environmentObj = {
        backgroundAudio: backgroundAudio,
        sky: skySettings,
        ground: groundSettings,
        bloom: bloomSettings,
        selectedHdri: hdri,
        selectedGroundTexture: groundTexture,
        skySettingMode,
        groundSettingMode
      };

      // Gán lại JSON đã merge
      if (userStatus.typeRoom === "exhibition") {
        scenePayload.room_json.room = JSON.stringify(roomObj);
        scenePayload.room_json.environment = JSON.stringify(environmentObj);
      } else {
        scenePayload.room_json.room = JSON.stringify(roomObj);
        scenePayload.room_json.environment = JSON.stringify(environmentObj);
      }

      // ======= GỬI LÊN API =======
      let result;
      if (userStatus.typeRoom === "exhibition") {
        console.log("Saving exhibition with payload:", scenePayload);

        result = await updateExhibition(exhibition.id, scenePayload);
      } else {
        result = await updateRoomTemplate(exhibition.id, scenePayload);
      }

      // Update the tourMarkers state with the saved indices and clear tempTourIndices
      if (tempTourIndices && tempTourIndices.size > 0) {
        setTourMarkers(updatedTourMarkers);
        setTempTourIndices(new Map()); // Clear temporary changes since they're now saved
      }

      setToast({ visible: true, message: "Lưu thành công!", type: "success" });

    } catch (err) {
      console.error(err);
      setToast({ visible: true, message: "Lỗi lưu dữ liệu!", type: "error" });
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
      setObjects(flattenObjects(sceneData.objects));
    }
    if (sceneData.tourMarkers) {
      setTourMarkers(sceneData.tourMarkers);
    } else if (sceneData.objects?.tourMarkers) {
      // Handle tour markers in the new categorized structure
      setTourMarkers(sceneData.objects.tourMarkers);
    } else {
      setTourMarkers([]);
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
      objects: {
        ...flattenToCategories(objects), // Convert flat objects back to categorized structure
        tourMarkers: tourMarkers // Store tour markers under objects
      },
      imageFrameList: imageFrameList,
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
    showToast(`Scene saved as ${currentSceneFile}! Objects: ${objects.length}, Tour Markers: ${tourMarkers.length}, Audio Files: ${uploadedAudioFiles.length}`, 'success');
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
  const handleCreatePhysicPlane = () => {
    if (sceneRef.current) {
      sceneRef.current.startPlacingPhysicPlane();
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
        showToast('WebGL context lost. Please reload the page.', 'error');
      };

      gl.domElement.addEventListener('webglcontextlost', handleContextLost, false);

      return () => {
        gl.domElement.removeEventListener('webglcontextlost', handleContextLost);
      };
    }, [gl]);

    return null;
  }

  // Consolidated DOM event listeners
  useEffect(() => {
    const handleMouseUp = () => {
      if (document.activeElement.tagName === 'BUTTON') {
        document.activeElement.blur();
      }
    };

    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.msFullscreenElement ||
        document.mozFullScreenElement
      );
      setIsFullscreen(isCurrentlyFullscreen);
    };

    // Add all event listeners
    window.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);

    // Cleanup function
    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
    };
  }, []);



  
  // Consolidated localStorage management
  useEffect(() => {
    localStorage.setItem('app_isMuted', JSON.stringify(isMuted));
    localStorage.setItem('app_markersVisible', JSON.stringify(markersVisible));
  }, [isMuted, markersVisible]);


  






  const importGLB = async (glbUrl) => {
    try {
      setToast({
        visible: true,
        message: "Đang áp dụng phòng GLB...",
        type: "info"
      });

      await importGlbForRoomTemplate(exhibition.id, glbUrl);

      setToast({
        visible: true,
        message: "Áp dụng phòng GLB thành công! Vui lòng tải lại trang để xem thay đổi.",
        type: "success"
      });
    } catch (err) {
      setToast({
        visible: true,
        message: "Áp dụng GLB thất bại: " + err.message,
        type: "error"
      });
    }
  };

  useEffect(() => {
    return () => {
      try {
        soundController.audioElements.forEach((data, id) => {
          if (data.isBackground) soundController.stopAudio(id, true);
        });
      } catch (e) {
        console.warn("Fail stop:", e);
      }
    };
  }, []);

  // Set sceneReady only after preloader finishes
  useEffect(() => {
    if (ready) {
      setTimeout(() => {
        setSceneReady(true);
      }, 100); // Small delay to ensure proper initialization
    } else {
      setSceneReady(false);
    }
  }, [ready]);

  // Show loading screen while data is loading OR assets are loading
  useEffect(() => {
      if (exhibition?.tour_url) {
          window.open(exhibition.tour_url, "_blank");
      }
  }, [exhibition]);

  if (exhibition?.tour_url) {
      return (
          <div style={{ padding: 40, fontSize: 20 }}>
              Tour đã mở trong tab mới.
          </div>
      );
  }

  if (!dataLoaded || !ready) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: '#FFF',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#000',
        fontFamily: 'Arial, sans-serif',
        zIndex: 10000
      }}>
        <Loader />
        <div style={{ fontSize: '18px', marginTop: '20px', textAlign: 'center' }}>
          Đang tải Gallery 3D...
        </div>
        <div style={{ fontSize: '14px', opacity: 0.8, marginTop: '10px', textAlign: 'center' }}>
          Vui lòng chờ trong giây lát
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="app-container">
        {userStatus.modeRoom === "edit" && sceneReady && (
          <>
            {/* Toolbox and Toggle Switch Container */}
              <div className={`toolbox-container ${mode}`}>
                {/* Button Stack Container */}
                <div className="button-stack">
                  {/* View/Edit Toggle Button */}
                  <button 
                    className={`toggle-button-circle ${mode === 'edit' ? 'edit-mode' : 'view-mode'}`} 
                    onClick={toggleMode} 
                    title={mode === 'edit' ? 'Chuyển sang Chế độ Xem' : 'Chuyển sang Chế độ Chỉnh sửa'}
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

                  {/* Snap Toggle Button - Edit Mode Only */}
                  {mode === 'edit' && (
                    <button 
                      className={`snap-toggle-button ${snapEnabled ? 'enabled' : 'disabled'}`}
                      onClick={() => {
                        setSnapEnabled(!snapEnabled);
                      }}
                      title={snapEnabled ? 'Tắt Di Chuyển Bắt Lưới' : 'Bật Di Chuyển Bắt Lưới'}
                    >
                      <svg 
                        width="16" 
                        height="16" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2.5" 
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        {/* Grid/Snap Icon */}
                        <rect x="3" y="3" width="7" height="7" />
                        <rect x="14" y="3" width="7" height="7" />
                        <rect x="14" y="14" width="7" height="7" />
                        <rect x="3" y="14" width="7" height="7" />
                        {snapEnabled && (
                          <>
                            {/* Magnet effect - small dots at grid intersections when enabled */}
                            <circle cx="10.5" cy="6.5" r="0.5" fill="currentColor" />
                            <circle cx="6.5" cy="10.5" r="0.5" fill="currentColor" />
                            <circle cx="17.5" cy="10.5" r="0.5" fill="currentColor" />
                            <circle cx="10.5" cy="17.5" r="0.5" fill="currentColor" />
                          </>
                        )}
                      </svg>
                    </button>
                  )}
                </div>

                {/* Right-Side Toolbox */}
                <div className="toolbox-content">
                  {mode === 'edit' && (
                    <Suspense fallback={
                      <div className="loading-toolbox">
                        <div className="loading-spinner"></div>
                      </div>
                    }>
                      <Toolbox 
                        onCreateWall={handleCreateWall}
                        onCreateSpotLight={handleCreateSpotLight}
                        images={images}
                        setImages={setImages}
                        pagination={pagination}
                        setPage={setPage}
                        audios={audios}
                        setAudios={setAudios}
                        room3DData={room3DData}
                        onImageDragStart={img => setDraggedImage(img)}
                        onTempTourIndexChange={handleTempTourIndexChange}
                        onCreateCameraTourMarker={handleCreateCameraTourMarker}
                        onUpdateTourMarkers={setTourMarkers}
                        setIsImageEditModalOpen={setIsImageEditModalOpen}
                        uploadMedia={uploadMedia}
                        deleteMedia={deleteMedia}
                        uploadAudio={uploadAudio}
                        deleteAudio={deleteAudio}
                        updateMedia={updateMedia}
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
                        physicPlane={physicPlane}
                        skySettingMode={skySettingMode}
                        setSkySettingMode={setSkySettingMode}
                        groundSettingMode={groundSettingMode}
                        setGroundSettingMode={setGroundSettingMode}
                        wallTextureList={wallTextureList}
                        groundTextureList={groundTextureList}
                        glbTextureList={glbTextureList}
                        setHdri={setHdri}
                        hdri={hdri}
                        setGroundTexture={setGroundTexture}
                        groundTexture={groundTexture}
                        onSceneChange={handleSceneChange}
                        onSaveScene={handleSaveScene}
                        currentSceneFile={currentSceneFile}
                        onCreateImageFrame={handleCreateImageFrame}
                        onCreatePhysicPlane={handleCreatePhysicPlane}
                        onShowTransparentWallsChange={setShowTransparentWalls}
                        tourMarkers={tourMarkers}
                        tempTourIndices={tempTourIndices}
                        setTempTourIndices={setTempTourIndices}
                        uploadedAudioFiles={uploadedAudioFiles}
                        onAddAudio={handleAddAudio}
                        onRemoveAudio={handleRemoveAudio}
                        importGLB={importGLB}
                        typeRoom={userStatus.typeRoom}
                        backgroundAudio={backgroundAudio}
                        backgroundAudioLoading={backgroundAudioLoading}
                        onBackgroundAudioChange={handleBackgroundAudioChange}
                      />
                    </Suspense>
                  )}

                  {popupShouldRender && (
                      <Suspense fallback={
                        <div className="loading-popup" style={{
                          position: 'fixed',
                          left: popupPosition.x,
                          top: popupPosition.y,
                          background: 'rgba(0,0,0,0.8)',
                          color: 'white',
                          padding: '8px 12px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          zIndex: 1000
                        }}>
                          📦 Loading...
                        </div>
                      }>
                        <ObjectPopup
                        images={images}
                        pagination={pagination}
                        setPage={setPage}
                        page={page}
                        audios={audios}
                        visible={popupVisible}
                        mousePosition={popupPosition}
                        onClose={() => {
                          setPopupVisible(false);
                          //setSelectedId(null);
                        }}
                        selectedId={selectedId}
                        setSelectedId={setSelectedId}
                        objects={[...objects, ...tourMarkers.map(marker => ({ ...marker, type: 'tourmarker' }))]}
                        setGizmoMode={setGizmoMode} 
                        onDelete={() => {
                          if (sceneRef.current && selectedId) {
                            if (selectedId.startsWith('tourmarker-')) {
                              // Handle tour marker deletion based on type and audio status
                              const markerToDelete = tourMarkers.find(marker => marker.id === selectedId);
                              
                              if (markerToDelete) {
                                if (markerToDelete.type === 'image') {
                                  // For image tour markers: check if they have audio
                                  if (markerToDelete.audio) {
                                    // Has audio - set index to -1 (make inactive but keep the marker)
                                    const updatedTourMarkers = tourMarkers.map(marker => 
                                      marker.id === selectedId 
                                        ? { ...marker, index: -1 }
                                        : marker
                                    );
                                    setTourMarkers(updatedTourMarkers);
                                    
                                    // Update tempTourIndices to remove from tour but keep marker
                                    if (markerToDelete.imageId) {
                                      handleTempTourIndexChange(markerToDelete.imageId, -1);
                                    }
                                  } else {
                                    // No audio - delete entirely
                                    const updatedTourMarkers = tourMarkers.filter(marker => marker.id !== selectedId);
                                    setTourMarkers(updatedTourMarkers);
                                    
                                    // Clean up tempTourIndices and removed state for this image
                                    if (markerToDelete.imageId) {
                                      setTempTourIndices(prev => {
                                        const newMap = new Map(prev);
                                        newMap.delete(markerToDelete.imageId);
                                        return newMap;
                                      });
                                      
                                      setRemovedFromTour(prev => {
                                        const newSet = new Set(prev);
                                        newSet.delete(markerToDelete.imageId);
                                        return newSet;
                                      });
                                    }
                                  }
                                } else {
                                  // For camera markers and other types - delete entirely (existing behavior)
                                  const updatedTourMarkers = tourMarkers.filter(marker => marker.id !== selectedId);
                                  setTourMarkers(updatedTourMarkers);
                                  
                                  // Clean up tempTourIndices for camera markers too
                                  if (markerToDelete.itemId) {
                                    setTempTourIndices(prev => {
                                      const newMap = new Map(prev);
                                      newMap.delete(markerToDelete.itemId);
                                      return newMap;
                                    });
                                  }
                                }
                              }
                              
                              setSelectedId(null);
                            } else {
                              // Handle regular object deletion
                              sceneRef.current.deleteObject(selectedId);
                            }
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
                        soundController={soundController}
                        onTempTourIndexChange={handleTempTourIndexChange}
                        onSave={handleSave}
                      />
                      </Suspense>
                    )}
                </div>
              </div>

              {/* Independent Save Button */}
              <button 
                className={`save-button-circle ${saveSuccess ? 'saved' : ''}`} 
                onClick={handleSave} 
                title="Lưu Phòng"
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
          </>
        )}
        <button 
          className={`audio-button ${isMuted ? 'muted' : ''}`} 
          onClick={toggleMute} 
          title={isMuted ? "Bật âm thanh" : "Tắt âm thanh"}
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
            title={isFullscreen ? "Thoát Toàn Màn Hình" : "Vào Toàn Màn Hình"}
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
            title={tourMode ? "Thoát Tour" : "Bắt Đầu Tour"}
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
            title={markersVisible ? "Giấu Điểm Tour" : "Hiện Điểm Tour"}
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

        {/* Image List Button */}
        <button 
          className={`image-list-button ${(/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) ? 'ios-positioned' : ''}`} 
          onClick={handleShowImageList} 
          title="Danh Sách Ảnh"
        >
          <svg 
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="currentColor"
          >
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
            <path d="M8 10h8v2H8zm0 3h8v1H8z"/>
            <circle cx="6" cy="9" r="1"/>
            <circle cx="6" cy="12.5" r="1"/>
          </svg>
        </button>

        {/* Exhibition Information Button */}
        {exhibition && (
          <button 
            className={`exhibition-info-button ${(/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) ? 'ios-positioned' : ''}`} 
            onClick={handleShowExhibitionInfo} 
            title="Exhibition Information"
          >
            <svg 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="currentColor"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
            </svg>
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
        {sceneReady && (
            <Scene
            gizmoMode={gizmoMode}
            setGizmoMode={setGizmoMode}
            snapEnabled={snapEnabled}
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
            onUpdateTourMarkers={setTourMarkers}
            markersVisible={markersVisible}
            tourMode={tourMode}
            tourInfoButtonVisible={tourInfoButtonVisible}
            tourInfoPanelOpen={tourInfoPanelOpen}
            onShowTourInfo={showTourInfo}
            onHideTourInfo={hideTourInfo}
            onHideAnyInfoPanel={hideAnyInfoPanel}
            soundController={soundController}
            isMuted={isMuted}
            tourPlaying={tourPlaying}
            currentTourIndex={currentTourIndex}
            setCurrentTourIndex={setCurrentTourIndex}
            setTourProgress={setTourProgress}
            isEditRoom={isEditRoom}
            typeRoom={userStatus.typeRoom}
            objectRole={userStatus.objectRole}
            userRole={userStatus.userRole}
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
                      transparent: scaleOrExtra.transparent || false,
                      objectRole: userStatus.objectRole
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
                      frameColor: scaleOrExtra.frameColor || "white",
                      canvasColor: scaleOrExtra.canvasColor || "white"
                    };
                    break;
                }

                setObjects(prev => [...prev, newObject]);
              }}
              skySettings={skySettings}
              groundSettings={groundSettings}
              bloomSettings={bloomSettings}
              imageFrame={imageFrame}
              physicPlane={physicPlane}
              imageFrameList={imageFrameList}
              hdri={hdri}
              groundTexture={groundTexture}
              skySettingMode={skySettingMode}
              groundSettingMode={groundSettingMode}
              setPopupData={setPopupData}
              setPopupPosition={setPopupPosition}
              setPopupVisible={setPopupVisible}
              onImageClick={handleImageClick}
              setTooltip={setTooltip}
              mobileInput={mobileInputRef.current}
              isJoystickActive={isJoystickActive}
              showTransparentWalls={showTransparentWalls}
              uploadedAudioFiles={uploadedAudioFiles}
            />
          )}
        </Canvas>
        
        {/* Image Info Panel with lazy loading */}
        {(tourMode ? tourInfoButtonVisible : panelVisible) && (
          <Suspense fallback={
            <div className="loading-panel" style={{
              position: 'fixed',
              top: '20px',
              right: '20px',
              background: 'rgba(0,0,0,0.8)',
              color: 'white',
              padding: '12px 16px',
              borderRadius: '8px',
              fontSize: '12px',
              zIndex: 1000
            }}>
              📦 Loading panel...
            </div>
          }>
            <ImageInfoPanel 
          visible={tourMode ? tourInfoButtonVisible : panelVisible} 
          data={panelData} 
          onClose={tourMode ? closeTourInfo : () => setPanelVisible(false)}
          tourMode={tourMode}
          tourInfoButtonVisible={tourInfoButtonVisible}
          onOpenTourInfo={openTourInfo}
          tourMarkers={tourMarkers}
          soundController={soundController}
          isMuted={isMuted}
          showToast={showToast}
          showImageDescription={panelData?.showImageDescription ?? true}
        />
        </Suspense>
        )}

        {/* Exhibition Info Panel */}
        <ExhibitionInfoPanel 
          visible={exhibitionInfoPanelOpen}
          exhibition={exhibition}
          mode={mode}
          onClose={handleCloseExhibitionInfo}
          onUpdateDescription={handleUpdateExhibitionDescription}
          images={images}
          pagination={pagination}
          setPage={setPage}
        />
        
        {/* Image List Panel with lazy loading */}
        {imageListPanelOpen && (
          <Suspense fallback={
            <div className="loading-panel" style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              background: 'rgba(0,0,0,0.8)',
              color: 'white',
              padding: '12px 16px',
              borderRadius: '8px',
              fontSize: '12px',
              zIndex: 1000
            }}>
              📦 Loading image list...
            </div>
          }>
            <ImageListPanel 
              visible={imageListPanelOpen}
              onClose={handleCloseImageList}
              images={images}
              objects={objects}
              onImageClick={handleImageClick}
              mode={mode}
            />
          </Suspense>
        )}
        
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
          onHidePanels={hideAnyInfoPanel}
        />

        {/* Toast Notification */}
        <Toast
          message={toast.message}
          type={toast.type}
          visible={toast.visible}
          onClose={() => {
            setToast({ visible: false, message: '', type: 'success' });
          }}
          duration={3000}
        />
        
        {/* PopUpWelcome - appears only after everything is loaded */}
        {sceneReady && (
          <PopUpWelcome open={openPopUpWelcome} handleClose={closePopUpWelcome} exhibition={exhibition}/>
        )}
      </div>
    </>
  );
}

export default App;