import { useEffect, useState, forwardRef, useImperativeHandle, useRef, createRef, Fragment, useMemo, useCallback, use } from 'react';
import { useThree, useLoader, useFrame } from '@react-three/fiber';
import { MeshReflectorMaterial, Sky, useTexture, Environment } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { CameraMovement } from './Camera';
import { Wall } from './Wall';
import { Image } from './Image';
import { PhysicPlane } from "./PhysicPlane";
import { SpawnMarker } from './SpawnMarker';
import { Object3D } from './Object';
import meshRefs from './meshRefs';
import * as THREE from 'three';
import {SpotLightWithHelper} from "./SpotLightWithHelper";
import TourMarker from './TourMarker';

const eventToNDC = (e, gl) => {
  const rect = gl.domElement.getBoundingClientRect();
  const cx = 'clientX' in e ? e.clientX : e.touches?.[0]?.clientX;
  const cy = 'clientY' in e ? e.clientY : e.touches?.[0]?.clientY;
  const x = ((cx - rect.left) / rect.width) * 2 - 1;
  const y = -((cy - rect.top) / rect.height) * 2 + 1;
  return { x, y };
};

// Custom skybox component that renders infinite cubemap
const SkyboxRenderer = ({ preset, filePath }) => {
  const { scene, camera } = useThree();
  
  useEffect(() => {
    if (!preset && !filePath) {
      scene.background = null;
      scene.environment = null;
      return;
    }
    
    let cleanupFn = null;
    
    if (filePath) {
      // Handle file path case - check if it's a custom uploaded file or preset folder
      const filename = filePath.split('/').pop();
      const nameWithoutExt = filename.split('.')[0];
      
      // Check if the file path contains a file extension (custom uploaded file)
      if (filePath.match(/\.(jpg|jpeg|png|webp)$/i)) {
        // Custom uploaded single image file - use as spherical or planar background
        const textureLoader = new THREE.TextureLoader();
        const texture = textureLoader.load(filePath, (loadedTexture) => {
          loadedTexture.mapping = THREE.EquirectangularReflectionMapping;
          scene.background = loadedTexture;
          scene.environment = loadedTexture;
        }, undefined, (error) => {
          console.warn('Failed to load custom skybox file:', filePath, error);
        });
        
        cleanupFn = () => {
          scene.background = null;
          scene.environment = null;
          if (texture) {
            texture.dispose();
          }
        };
      } else {
        // Preset folder approach for cubemap
        const folderPath = `/hdri/${nameWithoutExt.charAt(0).toUpperCase() + nameWithoutExt.slice(1)}/`;
        const imagePaths = [
          `${folderPath}px.jpg`, // positive X
          `${folderPath}nx.jpg`, // negative X
          `${folderPath}py.jpg`, // positive Y
          `${folderPath}ny.jpg`, // negative Y
          `${folderPath}pz.jpg`, // positive Z
          `${folderPath}nz.jpg`, // negative Z
        ];
        
        const loader = new THREE.CubeTextureLoader();
        const cubeTexture = loader.load(imagePaths, (texture) => {
          scene.background = texture;
          scene.environment = texture;
        }, undefined, (error) => {
          console.warn('Failed to load cubemap skybox:', error);
        });
        
        cleanupFn = () => {
          scene.background = null;
          scene.environment = null;
          if (cubeTexture) {
            cubeTexture.dispose();
          }
        };
      }
    } else if (preset) {
      // Handle preset case - always use cubemap
      const folderPath = `/hdri/${preset.charAt(0).toUpperCase() + preset.slice(1)}/`;
      const imagePaths = [
        `${folderPath}px.jpg`, // positive X
        `${folderPath}nx.jpg`, // negative X
        `${folderPath}py.jpg`, // positive Y
        `${folderPath}ny.jpg`, // negative Y
        `${folderPath}pz.jpg`, // positive Z
        `${folderPath}nz.jpg`, // negative Z
      ];
      
      const loader = new THREE.CubeTextureLoader();
      const cubeTexture = loader.load(imagePaths, (texture) => {
        scene.background = texture;
        scene.environment = texture;
      }, undefined, (error) => {
        console.warn('Failed to load preset cubemap skybox:', error);
      });
      
      cleanupFn = () => {
        scene.background = null;
        scene.environment = null;
        if (cubeTexture) {
          cubeTexture.dispose();
        }
      };
    }
    
    return cleanupFn;
  }, [preset, filePath, scene, camera]);
  
  return null; // No geometry rendered
};

const Scene = forwardRef(({ mode, selectedId, setSelectedId, objects, objectData, images, imageFrameList, tempTourIndices, markersVisible, tourMode, tourPlaying, currentTourIndex, setCurrentTourIndex, setTourProgress, onTourComplete, onTourInterrupted, tourInfoButtonVisible, tourInfoPanelOpen, onShowTourInfo, onHideTourInfo, onHideAnyInfoPanel, draggedImage, setDraggedImage, isImageEditModalOpen, onObjectsChange, onObjectAdded, skySettings, groundSettings, bloomSettings, imageFrame, physicPlane, hdri, skySettingMode, groundSettingMode, groundTexture, setPopupData, setPopupPosition, setPopupVisible, popupVisible, gizmoMode, setGizmoMode, snapEnabled, onImageClick, setTooltip, mobileInput, isJoystickActive, tourMarkers, onUpdateTourMarkers, isEditRoom, showTransparentWalls, soundController, isMuted, uploadedAudioFiles, typeRoom, objectRole, userRole }, ref) => {
  const [objs, setObjs] = useState(objects || []); // Initialize with walls from JSON
  const gizmoActive = useRef(false); // Ref to track gizmo interaction
  const [hoveredId, setHoveredId] = useState(null); // Track hovered object ID
  const [tempWallPosition, setTempWallPosition] = useState([0, 1.5, 0]); // Temporary wall position
  const [placingWall, setPlacingWall] = useState(false); // Track if a wall is being placed
  const [tempSpotLightPosition, setTempSpotLightPosition] = useState([0, 3, 0]);
  const [placingSpotLight, setPlacingSpotLight] = useState(false); 
  const [placingImageFrame, setPlacingImageFrame] = useState(false);
  const [placingPhysicPlane, setPlacingPhysicPlane] = useState(false);
  const [tempImageFramePosition, setTempImageFramePosition] = useState([0, 0, 0]);
  const [tempImageFrameRotation, setTempImageFrameRotation] = useState([0, 0, 0]);
  const [objectTree, setObjectTree] = useState(buildObjectTree(objects)); // Build the object tree from the initial objects
  const [copiedWall, setCopiedWall] = useState(null);
  const [imageLerpFlag, setImageLerpFlag] = useState(false);
  const raycaster = useRef(new THREE.Raycaster()); // Raycaster for mouse interaction
  const wallRefs = useRef({});
  const groundRef = useRef();
  const mouse = useRef(new THREE.Vector2()); // Mouse position in normalized device coordinates
  const pausedElapsedMsRef = useRef(0);
  const { gl, camera } = useThree(); // Access camera and renderer
  const GROUND_LEVEL = 1.7;
  const cameraTarget = useRef(null);
  const cameraLookAtTarget = useRef(null);
  const isReflective = true;
  const [wallBoxes, setWallBoxes] = useState(new Map());
  
  // Tour mode refs
  const tourStartTime = useRef(null);
  const tourImageStartTime = useRef(null);
  const isMovingToTourTarget = useRef(false);
  const lastTourIndex = useRef(-1);
  const tourIntervalRef = useRef(null);
  const prevTourMode = useRef(tourMode);

  const spawnPositions = objs.filter(obj => obj.type === 'spawn').map(obj => obj.position);
  const spawnRotations = objs.filter(obj => obj.type === 'spawn').map(obj => obj.rotation);

  const sunLightRef = useRef()

  const [fileHdri, setFileHdri] = useState("/hdri/hdri.webp");

  const narrationAudioRef = useRef(null);
  const audioDurationsRef = useRef(new Map());
  const playedImageRef = useRef(new Set()); // nhớ ảnh nào đã phát audio
  
  // Ground click validation tracking
  const pointerDownPoint = useRef(null);
  const pointerDownObjectId = useRef(null);

  // Image teleportation tracking
  const isTeleportingToImage = useRef(false);

  useEffect(() => {
    if (hdri) {
      if(hdri === "sunset" || hdri === "dawn")
      {
        setFileHdri("/hdri/sunset_dawn.webp");
      } else if(hdri === "night") {
        setFileHdri("/hdri/night.webp");
      } else if(hdri === "forest" || hdri === "park") {
        setFileHdri("/hdri/forest_park.webp");
      } else{
        setFileHdri("/hdri/hdri.webp");
      }
    }
  }, [hdri]);

  const collectRaycastableMeshes = useCallback((excludeIds = new Set()) => {
    const meshes = [];
    // Use cached meshes if available and no exclusions
    if (excludeIds.size === 0 && collectRaycastableMeshes.cachedMeshes) {
      return collectRaycastableMeshes.cachedMeshes;
    }
    
    Array.from(meshRefs.values()).forEach((obj) => {
      if (!obj) return;
      if (Array.isArray(obj)) {
        obj.forEach((m) => {
          if (m && m.isMesh && m.visible) {
            const id = m.userData?.id;
            if (!id || !excludeIds.has(id)) meshes.push(m);
          }
        });
      } else {
        // group / mesh - optimize traversal
        if (obj.visible) {
          obj.traverse((child) => {
            if (child.isMesh && child.material && child.visible && child.geometry) {
              const id = child.userData?.id;
              if (!id || !excludeIds.has(id)) {
                // Lazy compute bounding sphere only when needed
                if (!child.geometry.boundingSphere) child.geometry.computeBoundingSphere();
                meshes.push(child);
              }
            }
          });
        }
      }
    });
    
    // Cache meshes when no exclusions
    if (excludeIds.size === 0) {
      collectRaycastableMeshes.cachedMeshes = meshes;
    }
    
    return meshes;
  }, []);

  useFrame(() => {
    if (!sunLightRef.current) return
    
    // Only update sun light intensity every 10th frame to reduce CPU load
    if (useFrame.frameCount % 10 === 0) {
      const sunPos = new THREE.Vector3(...skySettings.sunPosition)
      const distance = sunPos.length()

      const k = 0.0005 
      const falloff = 1 / (1 + k * distance * distance)

      sunLightRef.current.intensity = 20 * falloff 
    }
  })

  useEffect(() => {
    setObjs(objects);
    setWallBoxes(new Map());
    // Invalidate raycast cache when objects change
    if (collectRaycastableMeshes.cachedMeshes) {
      collectRaycastableMeshes.cachedMeshes = null;
    }
  }, [objects]);  //update objects after edit

  useEffect(() => {
    camera.layers.enable(1); // Enable layer 1 for the camera
  }, [camera]);

  // Clear audio durations cache when tour markers change
  useEffect(() => {
    audioDurationsRef.current.clear();
  }, [tourMarkers]);

  // Preload and measure audio durations when tour markers are updated
  useEffect(() => {
    if (!soundController || !tourMarkers || tourMarkers.length === 0) return;

    // Create a function to measure audio duration for a given URL
    const measureAudioDuration = async (audioUrl, markerId) => {
      if (!audioUrl) return;
      
      try {
        // Create a temporary audio element to measure duration
        const tempAudio = new Audio(audioUrl);
        tempAudio.preload = 'metadata';
        
        return new Promise((resolve) => {
          const timeoutId = setTimeout(() => {
            tempAudio.remove();
            resolve(); // Resolve without setting duration if timeout
          }, 10000); // 10 second timeout
          
          tempAudio.onloadedmetadata = () => {
            clearTimeout(timeoutId);
            if (tempAudio.duration && isFinite(tempAudio.duration)) {
              const durMs = Math.max(5000, Math.round(tempAudio.duration * 1000));
              audioDurationsRef.current.set(markerId, durMs);
            }
            tempAudio.remove();
            resolve();
          };
          
          tempAudio.onerror = () => {
            clearTimeout(timeoutId);
            tempAudio.remove();
            resolve(); // Resolve without setting duration if error
          };
        });
      } catch (error) {
        console.warn('Error measuring audio duration:', error);
      }
    };

    // Measure duration for all tour markers with audio
    const measureAllAudio = async () => {
      const promises = tourMarkers.map(async (marker) => {
        if (marker.audio && marker.id) {
          await measureAudioDuration(marker.audio, marker.id);
        }
      });
      
      await Promise.all(promises);
    };

    measureAllAudio();
  }, [tourMarkers, soundController]);

  const handleBoundingBoxUpdate = (id, box) => {
    setWallBoxes(prev => {
      const next = new Map(prev);
      next.set(id, box.clone());
      return next;
    });
  };



  // Function to check if a point is inside any wall bounding box
  useEffect(() => {
    if (mode !== 'edit') {
      setPlacingWall(false); // Reset placingWall when mode is not "edit"
      setSelectedId(null); // Deselect the selected object
      setGizmoMode(''); // Reset gizmo mode
    }
  }, [mode]);

  // Build the hierarchical tree when the component mounts
  function buildObjectTree(o) {
    const objectMap = new Map();
  
    // Create a map of all objects by their ID
    o.forEach((obj) => {
      objectMap.set(obj.id, { ...obj, children: [] });
    });
  
    // Assign children to their respective parents
    o.forEach((obj) => {
      if (obj.parent) {
        const parent = objectMap.get(obj.parent);
        if (parent) {
          parent.children.push(objectMap.get(obj.id));
        }
      }
    });
  
    // Return the root objects (those without a parent)
    return Array.from(objectMap.values()).filter((obj) => !obj.parent);
  }

  // Rebuild the object tree whenever objs changes
  useEffect(() => {
    setObjectTree(buildObjectTree(objs));
  }, [objs]);

  // Memoized tour images computation to avoid recalculating on every render
  const memoizedTourImages = useMemo(() => {
    if (tempTourIndices && tempTourIndices.size > 0) {
      const tourItemsArray = [];
      tempTourIndices.forEach((tourIndex, itemId) => {
        if (tourIndex !== -1) {
          // Check if it's an image object
          const imageObj = objs.find(obj => obj.id === itemId && obj.type === 'image');
          if (imageObj) {
            tourItemsArray.push({ ...imageObj, index: tourIndex, itemType: 'image' });
          } else {
            // Check if it's a camera marker
            const cameraMarker = tourMarkers.find(m => {
              if (m.type === 'camera') {
                // Check both new itemId format and legacy id-based format
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
      // Use tourMarkers to determine tour order
      const sortedMarkers = (tourMarkers || [])
        .filter(m => m.index !== undefined && m.index !== -1)
        .sort((a, b) => a.index - b.index);
      
      const tourItemsArray = [];
      sortedMarkers.forEach(marker => {
        if (marker.imageId) {
          // Image marker
          const imageObj = objs.find(obj => obj.type === 'image' && obj.id === marker.imageId);
          if (imageObj) {
            tourItemsArray.push({ ...imageObj, index: marker.index, itemType: 'image' });
          }
        } else if (marker.type === 'camera') {
          // Camera marker
          tourItemsArray.push({ ...marker, itemType: 'camera' });
        }
      });
      
      return tourItemsArray;
    }
  }, [objs, tempTourIndices, tourMarkers]);

  // Memoized duration function
  const getCurrentItemDuration = useCallback((currentItem) => {
    if (!currentItem) return 5000;
    
    // For camera markers, check audio duration first, then marker duration
    if (currentItem.itemType === 'camera') {
      // Check if we have a measured audio duration for this camera marker
      const measured = audioDurationsRef.current.get(currentItem.id);
      if (measured && measured >= 5000) return measured;
      
      // Fall back to camera marker's duration property
      return currentItem.duration || 5000;
    }
    
    // For image markers, find the tour marker and check audio duration first, then marker duration
    const marker = tourMarkers?.find(m => m.imageId === currentItem.id);
    if (marker) {
      // Check if we have a measured audio duration for this tour marker
      const measured = audioDurationsRef.current.get(marker.id);
      if (measured && measured >= 5000) return measured;
      
      // Fall back to marker's duration property
      if (marker.duration) return Math.max(5000, marker.duration);
    }
    
    return 5000;
  }, [tourMarkers]);

  // Function to position camera for current tour image
  const positionCameraForTourImage = useCallback(() => {
    if (!tourMode || !memoizedTourImages || memoizedTourImages.length === 0 || mode !== 'view') return;
    
    const currentItem = memoizedTourImages[currentTourIndex];
    if (!currentItem) return;
    
    // Handle camera markers differently
    if (currentItem.itemType === 'camera') {
      // For camera markers, use smooth movement system like image markers
      const cameraPos = new THREE.Vector3(...currentItem.position);
      
      // Set camera target for smooth movement (preserve original camera height)
      cameraTarget.current = cameraPos.clone();
      
      // Set look at target (for camera markers, look at the direction they were facing)
      const tempCamera = new THREE.PerspectiveCamera();
      tempCamera.position.copy(cameraPos);
      tempCamera.rotation.set(
        THREE.MathUtils.degToRad(currentItem.rotation[0]),
        THREE.MathUtils.degToRad(currentItem.rotation[1]),
        THREE.MathUtils.degToRad(currentItem.rotation[2])
      );
      
      // Calculate a point in front of the camera based on its rotation
      const direction = new THREE.Vector3(0, 0, -1);
      direction.applyQuaternion(tempCamera.quaternion);
      direction.multiplyScalar(5); // Look 5 units ahead
      
      cameraLookAtTarget.current = cameraPos.clone().add(direction);
      
      isMovingToTourTarget.current = true;
      
      // Don't show info for camera markers
      return;
    }
    
    // Handle image markers
    // Check if the marker has a stored position property
    const marker = tourMarkers?.find(m => m.imageId === currentItem.id);
    let markerPosition;
    
    if (marker?.position) {
      // Use stored position if available
      markerPosition = marker.position;
    } else {
      // Calculate position dynamically from image and wall transformations
      // Find parent wall data
      const parentWall = objs.find(obj => obj.id === currentItem.parent) || { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] };
      
      // Use the same marker position calculation as TourMarker component
      const calculateMarkerPosition = (imagePosition, imageRotation, wallPosition, wallRotation, wallScale) => {
        const MARKER_DISTANCE = 2;
        
        // Create wall transformation matrix
        const wallMatrix = new THREE.Matrix4();
        wallMatrix.makeRotationFromEuler(new THREE.Euler(
          THREE.MathUtils.degToRad(wallRotation[0]),
          THREE.MathUtils.degToRad(wallRotation[1]),
          THREE.MathUtils.degToRad(wallRotation[2])
        ));
        wallMatrix.setPosition(new THREE.Vector3(...wallPosition));
        wallMatrix.scale(new THREE.Vector3(...wallScale));
        
        // Create image transformation matrix (relative to wall)
        const imageMatrix = new THREE.Matrix4();
        imageMatrix.makeRotationFromEuler(new THREE.Euler(
          THREE.MathUtils.degToRad(imageRotation[0]),
          THREE.MathUtils.degToRad(imageRotation[1]),
          THREE.MathUtils.degToRad(imageRotation[2])
        ));
        imageMatrix.setPosition(new THREE.Vector3(...imagePosition));
        
        // Combine transformations: world = wall * image
        const worldImageMatrix = new THREE.Matrix4();
        worldImageMatrix.multiplyMatrices(wallMatrix, imageMatrix);
        
        // Calculate the normal vector of the image (pointing away from the wall)
        const quaternion = new THREE.Quaternion();
        const scale = new THREE.Vector3();
        const position = new THREE.Vector3();
        worldImageMatrix.decompose(position, quaternion, scale);
        
        // Image normal vector (pointing outward from the image surface)
        const imageNormal = new THREE.Vector3(0, 0, MARKER_DISTANCE);
        imageNormal.applyQuaternion(quaternion);
        
        // Position marker 2 units in front of image along its normal
        const forward = imageNormal.multiplyScalar(2);
        
        // Get world position of image and add forward offset
        const imageWorldPosition = new THREE.Vector3();
        imageWorldPosition.setFromMatrixPosition(worldImageMatrix);
        imageWorldPosition.add(forward);
        
        return [imageWorldPosition.x, imageWorldPosition.y, imageWorldPosition.z];
      };
      
      markerPosition = calculateMarkerPosition(
        currentItem.position,
        currentItem.rotation,
        parentWall.position,
        parentWall.rotation,
        parentWall.scale
      );
    }
    
    // Set camera target to marker position at ground level
    cameraTarget.current = { x: markerPosition[0], y: GROUND_LEVEL, z: markerPosition[2] };
    
    // Calculate image world position for look-at target (always calculated dynamically for accuracy)
    const parentWall = objs.find(obj => obj.id === currentItem.parent) || { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] };
    const wallMatrix = new THREE.Matrix4();
    wallMatrix.makeRotationFromEuler(new THREE.Euler(
      THREE.MathUtils.degToRad(parentWall.rotation[0]),
      THREE.MathUtils.degToRad(parentWall.rotation[1]),
      THREE.MathUtils.degToRad(parentWall.rotation[2])
    ));
    wallMatrix.setPosition(new THREE.Vector3(...parentWall.position));
    wallMatrix.scale(new THREE.Vector3(...parentWall.scale));
    
    const imageMatrix = new THREE.Matrix4();
    imageMatrix.makeRotationFromEuler(new THREE.Euler(
      THREE.MathUtils.degToRad(currentItem.rotation[0]),
      THREE.MathUtils.degToRad(currentItem.rotation[1]),
      THREE.MathUtils.degToRad(currentItem.rotation[2])
    ));
    imageMatrix.setPosition(new THREE.Vector3(...currentItem.position));
    
    const worldImageMatrix = new THREE.Matrix4();
    worldImageMatrix.multiplyMatrices(wallMatrix, imageMatrix);
    
    const imageWorldPos = new THREE.Vector3();
    imageWorldPos.setFromMatrixPosition(worldImageMatrix);
    
    cameraLookAtTarget.current = imageWorldPos.clone();
    cameraLookAtTarget.current.y = GROUND_LEVEL;
    
    isMovingToTourTarget.current = true;

    // Show info button for current tour image
    if (onShowTourInfo && currentItem.src && currentItem.title) {
      onShowTourInfo({
        id: currentItem.id, // Include the image ID for tour marker matching
        src: currentItem.src,
        alt: currentItem.alt || '',
        title: currentItem.title || '',
        description: currentItem.description || ''
      });
    }
  }, [tourMode, memoizedTourImages, currentTourIndex, mode, objs, onShowTourInfo]);

  // Effect to handle tour index changes (works for both playing and paused)
  useEffect(() => {
    if (tourMode && mode === 'view') {
      // Reset when tour index changes
      if (lastTourIndex.current !== currentTourIndex) {
        lastTourIndex.current = currentTourIndex;
        isMovingToTourTarget.current = false;
        cameraTarget.current = null;
        cameraLookAtTarget.current = null;
        tourImageStartTime.current = Date.now();
        
        // Position camera for new image (works for both playing and paused)
        positionCameraForTourImage();
      }
    }
  }, [tourMode, currentTourIndex, mode, positionCameraForTourImage]);

  // Tour mode logic
  useEffect(() => {
    
    if (tourMode && tourPlaying && memoizedTourImages && memoizedTourImages.length > 0 && mode === 'view') {
      const currentTime = Date.now();
      
      // Initialize tour start time if needed
      if (!tourStartTime.current) {
        tourStartTime.current = currentTime;
      }
      
      // Set up interval to check progress and advance tour
      if (!tourIntervalRef.current) {
        tourIntervalRef.current = setInterval(() => {
          // Get fresh tour images and check if we should continue
          const currentTourImages = memoizedTourImages;
          
          if (tourMode && tourPlaying && currentTourImages.length > 0 && tourImageStartTime.current) {
            const now = Date.now();
            
            // Tour timer continues even when info panel is open
            {
              const timeAtImage = now - tourImageStartTime.current;
              
              // Get current image duration from tour markers
              const currentItem = currentTourImages[currentTourIndex];
              const currentItemDuration = getCurrentItemDuration(currentItem);
              
              // If we've waited long enough, move to next image
              if (timeAtImage > currentItemDuration) {
                // Move to next image without hiding info panel
                
                if (currentTourIndex < currentTourImages.length - 1) {
                  setCurrentTourIndex(currentTourIndex + 1);
                  // Don't clear targets here - let useEffect handle the next image setup
                } else {
                  // Tour complete
                  if (onTourComplete) onTourComplete();
                  return;
                }
              }
              
              // Tính tổng thời lượng tour (cộng dồn duration của tất cả ảnh)
              const totalDuration = currentTourImages.reduce((sum, item) => {
                return sum + getCurrentItemDuration(item);
              }, 0);

              // Tính thời gian đã trôi qua (các ảnh trước + ảnh hiện tại)
              let elapsed = 0;
              for (let i = 0; i < currentTourIndex; i++) {
                elapsed += getCurrentItemDuration(currentTourImages[i]);
              }
              elapsed += Math.min(timeAtImage, getCurrentItemDuration(currentItem));

              // Tính phần trăm tiến độ theo tổng thời gian
              const overallProgress = (elapsed / totalDuration) * 100;
              if (setTourProgress) setTourProgress(overallProgress);
            }
          }
        }, 100); // Check every 100ms
      }
    } else if (tourMode && !tourPlaying) {
      // Dừng audio tạm thời và lưu elapsed
      const a = soundController.audioElements.get("tour_audio")?.audio;
      if (a) {
        pausedElapsedMsRef.current = (a.currentTime || 0) * 1000;
        soundController.pauseAudio?.("tour_audio");
      }

      // Dừng interval để không bị “chạy ngầm”
      if (tourIntervalRef.current) {
        clearInterval(tourIntervalRef.current);
        tourIntervalRef.current = null;
      }
    }

    else {
      // Only clear targets once when transitioning from tour mode on to off
      if (prevTourMode.current && !tourMode) {
        // Clear camera targets to stop any ongoing camera movement
        cameraTarget.current = null;
        cameraLookAtTarget.current = null;
      }
      
      // Clean up interval when tour stops
      if (tourIntervalRef.current) {
        clearInterval(tourIntervalRef.current);
        tourIntervalRef.current = null;
      }

      // Hide tour info when tour stops
      if (onHideTourInfo) onHideTourInfo();

      if (narrationAudioRef.current) {
        soundController.stopAudio("tour_audio");
        narrationAudioRef.current = null;
      }
      
      // Reset all tour-related state when tour mode is off
      tourStartTime.current = null;
      tourImageStartTime.current = null;
      isMovingToTourTarget.current = false;
      lastTourIndex.current = -1;
    }
    
    // Update previous tour mode state
    prevTourMode.current = tourMode;
    
    // Cleanup on unmount or when tour mode changes
    return () => {
      if (tourIntervalRef.current) {
        clearInterval(tourIntervalRef.current);
        tourIntervalRef.current = null;
      }
    };
  }, [tourMode, tourPlaying, currentTourIndex, mode, memoizedTourImages, getCurrentItemDuration, setCurrentTourIndex, setTourProgress, onTourComplete, onShowTourInfo, onHideTourInfo]);


  // --- TỰ PHÁT ÂM THANH TRONG TOUR MODE ---

  // --- EFFECT PHÁT AUDIO KHI CHUYỂN ẢNH ---
  useEffect(() => {
    if (!tourMode || !tourPlaying || mode !== "view") return;

    // Use the same tour sequence as the main tour logic
    const currentItem = memoizedTourImages[currentTourIndex];
    if (!currentItem) return;

    // Find the audio for the current item based on its type
    let audioToPlay = null;
    
    if (currentItem.itemType === 'image') {
      // For image markers, find the tour marker for this image to get the audio
      const currentMarker = tourMarkers?.find(m => m.imageId === currentItem.id);
      audioToPlay = currentMarker?.audio;
    } else if (currentItem.itemType === 'camera') {
      // For camera markers, get audio directly from the marker
      audioToPlay = currentItem.audio;
    }

    // token để hủy nếu effect bị cleanup
    let cancelled = false;

    (async () => {
      try {
        // Always stop any currently playing tour audio when moving to a new marker
        const currentAudioData = soundController.audioElements?.get?.("tour_audio");
        if (currentAudioData) {
          soundController.stopAudio?.("tour_audio");
          narrationAudioRef.current = null;
          await new Promise(r => setTimeout(r, 50)); // Small delay to ensure cleanup
        }

        // If current marker has no audio, just stop here
        if (!audioToPlay || cancelled) return;

        await soundController.ensureInitialized?.();
        await soundController.ensureResumed?.();

        // Play the new audio
        const inst = await soundController.playAudio(audioToPlay, {
          id: "tour_audio",
          volume: 1.0,
          fadeIn: false,
          loop: false,
        });
        if (cancelled) {
          soundController.stopAudio?.("tour_audio");
          return;
        }
        narrationAudioRef.current = inst;

        // Ensure mute state is applied after audio is fully connected and playing
        if (isMuted) {
          // Use a small delay to ensure audio is fully connected to the audio graph
          setTimeout(() => {
            if (soundController && !cancelled) {
              soundController.setMasterVolume?.(0, 0);
            }
          }, 50);
        }

        const audioData = soundController.audioElements.get("tour_audio");
        const audioEl = audioData?.audio;
        if (audioEl) {
          audioEl.onloadedmetadata = () => {
            if (cancelled) return;
            const durMs = Math.max(5000, Math.round(audioEl.duration * 1000));
            
            // Store duration using the appropriate marker ID
            let storageKey = null;
            if (currentItem.itemType === 'image') {
              const currentMarker = tourMarkers?.find(m => m.imageId === currentItem.id);
              storageKey = currentMarker?.id;
            } else if (currentItem.itemType === 'camera') {
              storageKey = currentItem.id;
            }
            
            if (storageKey) {
              audioDurationsRef.current.set(storageKey, durMs);
            }
          };
          audioEl.onended = () => {
            if (cancelled) return;
            narrationAudioRef.current = null;
          };
        }
      } catch (err) {
        console.warn("Lỗi phát audio tour:", err);
      }
    })();

    return () => {
      cancelled = true;
      // Don't stop audio during tour - let it continue playing
      // Only stop when tour actually ends or component unmounts
    };
  }, [tourMode, tourPlaying, currentTourIndex, mode, isMuted, soundController, tourMarkers, memoizedTourImages]);

  // --- RESET khi bắt đầu hoặc kết thúc tour ---
  useEffect(() => {
    if (!tourMode || !tourPlaying) {
      playedImageRef.current.clear();
    }
  }, [tourMode, tourPlaying]);

  // --- HANDLE MUTE STATE CHANGES DURING TOUR ---
  useEffect(() => {
    if (!soundController || !tourMode) return;
    
    // Just ensure master volume reflects current mute state
    // Don't pause/stop individual audio tracks - let them play silently when muted
    if (isMuted) {
      soundController.setMasterVolume?.(0, 0);
    }
    // When unmuted, the App.jsx toggleMute function will restore the master volume
    // so we don't need to handle unmuting here
  }, [isMuted, soundController, tourMode]);

  // Handle keyboard shortcuts for gizmo mode
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (mode === 'edit') {
        if (e.key === 't') setGizmoMode('translate');
        if (e.key === 'r') setGizmoMode('rotate');
        if (e.key === 'e') setGizmoMode('scale');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown); 
  }, [mode]);

  // Handle keyboard shortcut for deleting objects
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Delete" && selectedId && mode === "edit") {
        
        // Check if this is a tour marker deletion
        if (selectedId.startsWith('tourmarker-')) {
          // Delete tour marker
          if (onUpdateTourMarkers) {
            const updatedTourMarkers = tourMarkers.filter(marker => marker.id !== selectedId);
            onUpdateTourMarkers(updatedTourMarkers);
          }
          
          // Clean up mesh refs
          meshRefs.delete(selectedId);
          setSelectedId(null);
          setGizmoMode('');
          return;
        }

        const obj = objs.find(o => o.id === selectedId);
        if(obj.src !== imageFrame.src && obj.type === "image"){
          const updatedObjs = objs.map(o => {
            if (o.id === selectedId) {
              return { ...o, src: imageFrame.src,
                alt: imageFrame.alt,
                title: imageFrame.title,
                scale: [1, 1, 1],
              };
            }
            return o;
          });

          setObjs(updatedObjs);
          onObjectsChange(updatedObjs);
          return;
        }

        onObjectsChange(prev => {
          const collectIds = (id, acc) => {
            acc.push(id);
            const obj = prev.find(o => o.id === id);
            if (obj?.children?.length > 0) {
              obj.children.forEach(childId => collectIds(childId, acc));
            }
            if (obj?.lightChild?.length > 0) {
              obj.lightChild.forEach(childId => collectIds(childId, acc));
            }
          };

            const idsToDelete = [];
            collectIds(selectedId, idsToDelete);

            const imageToDelete = prev.find(o => o.id === selectedId && o.type === 'image');
            const frameIdToShow = imageToDelete?.frameId;

            //Delete meshref
            idsToDelete.forEach(id => {
              meshRefs.delete?.(id);
              delete meshRefs[id];  
            });

            const filtered = prev.filter(obj => !idsToDelete.includes(obj.id));

            return filtered.map(obj => {
              let updated = { ...obj };

            if (updated.children) {
              updated.children = updated.children.filter(childId => !idsToDelete.includes(childId));
            }

              return updated;
            });
          });

          setSelectedId(null);
          setGizmoMode('');
        }
      };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedId, mode, onObjectsChange, meshRefs, objs]);

  const handleDeleteObject = (id) => {
    const obj = objs.find(o => o.id === selectedId);
        if(obj.src !== imageFrame.src && obj.type === "image"){
          const updatedObjs = objs.map(o => {
            if (o.id === selectedId) {
              return { ...o, src: imageFrame.src,
                alt: imageFrame.alt,
                title: imageFrame.title,
                scale: [1, 1, 1],
              };
            }
            return o;
          });

          setObjs(updatedObjs);
          onObjectsChange(updatedObjs);
          return;
        }

        onObjectsChange(prev => {
          const collectIds = (id, acc) => {
            acc.push(id);
            const obj = prev.find(o => o.id === id);
            if (obj?.children?.length > 0) {
              obj.children.forEach(childId => collectIds(childId, acc));
            }
            if (obj?.lightChild?.length > 0) {
              obj.lightChild.forEach(childId => collectIds(childId, acc));
            }
          };

            const idsToDelete = [];
            collectIds(selectedId, idsToDelete);

            const imageToDelete = prev.find(o => o.id === selectedId && o.type === 'image');
            const frameIdToShow = imageToDelete?.frameId;

            //Delete meshref
            idsToDelete.forEach(id => {
              meshRefs.delete?.(id);
              delete meshRefs[id];  
            });

            const filtered = prev.filter(obj => !idsToDelete.includes(obj.id));

            return filtered.map(obj => {
              let updated = { ...obj };

            if (updated.children) {
              updated.children = updated.children.filter(childId => !idsToDelete.includes(childId));
            }

              return updated;
            });
          });

          setSelectedId(null);
          setGizmoMode('');
  };

  // Pointer controller
  useEffect(() => {
    if (draggedImage) {
      document.body.style.cursor = 'grabbing';
      return;
    }

    const hoveredObj = objs.find(o => o.id === hoveredId);

    if (hoveredId === null || mode !== 'edit') {
      document.body.style.cursor = 'default';
    }
    else if (hoveredObj?.src?.toLowerCase().endsWith(".glb")) {
      document.body.style.cursor = 'default';
    }
    else {
      document.body.style.cursor = 'pointer';
    }
  }, [draggedImage, hoveredId, selectedId, mode, objs]);

  // Copy and paste
  useEffect(() => {
    const handleCopyPaste = (e) => {
      // Copy: Ctrl+C
      if (e.ctrlKey && e.key.toLowerCase() === 'c' && selectedId) {
        const wall = objs.find(obj => obj.id === selectedId && obj.type === 'wall');
        if (wall) {
          setCopiedWall({ ...wall }); // Shallow copy is enough for flat wall objects
        }
      }
      // Paste: Ctrl+V
      if (e.ctrlKey && e.key.toLowerCase() === 'v' && copiedWall) {
        // 1. Create new wall with new id and offset position
        const newWallId = `wall-${Date.now()}`;
        const newWall = {
          ...copiedWall,
          id: newWallId,
          position: [
            copiedWall.position[0] + 0.5,
            copiedWall.position[1],
            copiedWall.position[2] + 0.5
          ],
          children: [],
        };

        // 2. Find all images whose parent is the copied wall
        const childImages = objs.filter(obj => obj.type === 'image' && obj.parent === copiedWall.id);

        // 3. Duplicate images with new ids and new parent
        const newImages = childImages.map(img => {
          const newImageId = `image-${Date.now()}-${Math.random()}`;
          return {
            ...img,
            id: newImageId,
            parent: newWallId,
          };
        });

        // 4. Add new image ids to newWall.children
        newWall.children = newImages.map(img => img.id);

        // 5. Add new wall and images to objects
        // 1) Tạo danh sách mới
        const next = [...objs, newWall, ...newImages];
        // 2) Cập nhật local
        setObjs(next);
        // 3) Đẩy lên parent (App) để props `objects` đồng bộ
        onObjectsChange?.(next);
        // 4) Chọn tường mới sau khi render (đảm bảo gizmo/refs đã mount)
        setTimeout(() => {
          setSelectedId(newWallId);
        }, 0);
      }
    };

    window.addEventListener('keydown', handleCopyPaste);
    return () => window.removeEventListener('keydown', handleCopyPaste);
  }, [objs, selectedId, copiedWall, onObjectsChange, setSelectedId]);


  const calculateFrameTransform = (intersection, camera, meshRefs) => {
    const clickedObject = intersection.object;
    const clickedId = clickedObject.userData.id;

    // ====== WORLD NORMAL ======
    const normalMatrix = new THREE.Matrix3().getNormalMatrix(clickedObject.matrixWorld);
    let worldNormal = intersection.face.normal.clone().applyMatrix3(normalMatrix).normalize();

    // Flip normal nếu quay vào trong tường
    const reference = camera.position;
    if (worldNormal.dot(reference.clone().sub(intersection.point)) < 0) {
      worldNormal.negate();
    }

    // Offset frame cách tường 0.05
    const offset = 0.05;
    const worldPosition = intersection.point.clone().add(worldNormal.clone().multiplyScalar(offset));

    // ====== TÍNH ROTATION ======
    const worldUp = new THREE.Vector3(0, 1, 0);
    let tangent = new THREE.Vector3().crossVectors(worldUp, worldNormal);
    if (tangent.lengthSq() < 1e-6) {
      tangent = new THREE.Vector3(1, 0, 0).cross(worldNormal);
    }
    tangent.normalize();

    const bitangent = new THREE.Vector3().crossVectors(worldNormal, tangent).normalize();

    const rotMatrix = new THREE.Matrix4().makeBasis(tangent, bitangent, worldNormal);
    const quat = new THREE.Quaternion().setFromRotationMatrix(rotMatrix);
    const worldEuler = new THREE.Euler().setFromQuaternion(quat, 'XYZ');

    // ====== CHUYỂN VỀ LOCAL ======
    const wallContainer = meshRefs.get(clickedId);
    let localPosition = worldPosition.clone();
    let localEuler = worldEuler.clone();

    if (wallContainer && !Array.isArray(wallContainer)) {
      wallContainer.updateMatrixWorld();

      localPosition = wallContainer.worldToLocal(worldPosition.clone());

      const wallQuat = new THREE.Quaternion().setFromRotationMatrix(wallContainer.matrixWorld);
      const localQuat = quat.clone().premultiply(wallQuat.invert());
      localEuler = new THREE.Euler().setFromQuaternion(localQuat, 'XYZ');
    }

    return {
      worldPosition,
      worldEuler,
      localPosition,
      localEuler,
      worldNormal,
      clickedId
    };
  };

  // Debounced mouse move handler to reduce CPU load
  const mouseMoveTimeout = useRef(null);
  
  const handleMouseMove = (e) => {
    e.stopPropagation();

    // Skip debounce when placing objects for immediate feedback
    if (placingWall || placingImageFrame || placingSpotLight || placingPhysicPlane) {
      processMouseMove(e);
    } else {
      // Debounce mouse move events to reduce CPU load for normal hover detection
      if (mouseMoveTimeout.current) {
        clearTimeout(mouseMoveTimeout.current);
      }
      
      mouseMoveTimeout.current = setTimeout(() => {
        processMouseMove(e);
      }, 16); // Debounce to ~60fps
    }
  };

  const processMouseMove = (e) => {
    // Convert mouse position to normalized device coordinates (-1 to +1)
    const rect = gl.domElement.getBoundingClientRect();
    mouse.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      if (placingWall) {
        // Use raycaster to find the intersection point with the ground
        const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0); // Horizontal plane at y = 0
        raycaster.current.setFromCamera(mouse.current, camera);
        const intersectionPoint = new THREE.Vector3();
    
        // Check if the ray intersects the ground plane
        if (raycaster.current.ray.intersectPlane(groundPlane, intersectionPoint)) {
          const gridSize = 0.125; // Define the grid size (e.g., 1 unit)
          
          // Snap the intersection point to the nearest grid unit
          const snappedX = Math.round(intersectionPoint.x / gridSize) * gridSize;
          const snappedZ = Math.round(intersectionPoint.z / gridSize) * gridSize;
    
          setTempWallPosition([snappedX, 1.5, snappedZ]); // Update temporary wall position
        }
      } else if (placingSpotLight) {
        // Convert mouse to world space
        const vector = new THREE.Vector3(mouse.current.x, mouse.current.y, 0.5); 
        vector.unproject(camera);

        const dir = vector.sub(camera.position).normalize();
        const distance = 5; // distance from camera to bulb

        const newPos = camera.position.clone().add(dir.multiplyScalar(distance));
        setTempSpotLightPosition([newPos.x, newPos.y, newPos.z]);
      } else if (placingImageFrame || placingPhysicPlane) {
        raycaster.current.setFromCamera(mouse.current, camera);

        const exclude = new Set(['preview-image-frame']);
        const allMeshes = collectRaycastableMeshes(exclude);

        const intersects = raycaster.current.intersectObjects(allMeshes, true);
        if (intersects.length === 0) return;

        const intersection = intersects[0];
        const targetId = intersection.object.userData?.id;
        const targetObj = objs.find((o) => o.id === targetId);

        // Chỉ bám vào tường
        if (!targetObj || targetObj.type !== 'wall') return;

        // Dùng chung logic với click
        const { worldPosition, worldEuler } = calculateFrameTransform(intersection, camera, meshRefs);

        setTempImageFramePosition([worldPosition.x, worldPosition.y, worldPosition.z]);
        setTempImageFrameRotation([worldEuler.x, worldEuler.y, worldEuler.z]);
      }
      else
      {
        // Use raycaster to detect hovered objects
        raycaster.current.setFromCamera(mouse.current, camera);

        // Get all intersected objects - safely handle meshRefs values
        const allMeshes = [];
        Array.from(meshRefs.values()).forEach(obj => {
          if (obj) {
            if (Array.isArray(obj)) {
              allMeshes.push(...obj.filter(item => item && item.isMesh));
            } else if (obj.isMesh) {
              allMeshes.push(obj);
            } else if (obj.children) {
              obj.traverse((child) => {
                if (child.isMesh) {
                  allMeshes.push(child);
                }
              });
            }
          }
        });
        
        const intersects = raycaster.current.intersectObjects(allMeshes, true);

        if (intersects.length > 0) {
          const hoveredObject = intersects[0].object; // Get the first intersected object
          const hoveredId = hoveredObject.userData.id; // Retrieve the ID from userData
          const hoveredData = objects.find(o => o.id === hoveredId);

          if (hoveredId) {
            setHoveredId(hoveredId); // Update the hovered ID.
          }
        } else {
          setHoveredId(null); // Clear the hovered ID if no object is hovered
        }
      }
  };

  const handleMouseClick = (e) => {
    // Don't handle clicks during tour mode
    if (tourMode) return;
    
    e.stopPropagation();

    // Cập nhật NDC từ sự kiện click/tap
    const { x, y } = eventToNDC(e, gl);
    mouse.current.x = x;
    mouse.current.y = y;

    if (placingImageFrame) {
      
      // Update mouse to current click position
      const rect = gl.domElement.getBoundingClientRect();
      mouse.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      // Raycast vào tất cả các wall mesh
      raycaster.current.setFromCamera(mouse.current, camera);

      const exclude = new Set(['preview-image-frame']);
      const allMeshes = collectRaycastableMeshes(exclude);

      const intersects = raycaster.current.intersectObjects(allMeshes, true);
      if (intersects.length === 0) {
        alert("Click vào tường để đặt Image Frame!");
        return;
      }

      // Lấy intersection đầu tiên
      const intersection = intersects[0];
      const clickedObject = intersection.object;
      const clickedId = clickedObject.userData.id;
      const clickedObjData = objs.find(o => o.id === clickedId);

      // Nếu không phải wall thì không đặt
      if (!clickedObjData || clickedObjData.type !== "wall") {
        alert("Chỉ có thể đặt Image Frame lên tường!");
        return;
      }

      // ====== SỬ DỤNG CALCULATEFRAMETRANSFORM ======
      const { localPosition, worldEuler } = calculateFrameTransform(intersection, camera, meshRefs);

      // ====== TẠO OBJECT MỚI ======
      const newImageFrameId = `image-${Date.now()}`;
      const newFrame = {
        id: newImageFrameId,
        type: "image",
        src: imageFrame.src,         // placeholder frame
        alt: imageFrame.alt,
        title: imageFrame.title,
        position: [localPosition.x, localPosition.y, localPosition.z],
        rotation: [
          THREE.MathUtils.radToDeg(worldEuler.x),
          THREE.MathUtils.radToDeg(worldEuler.y),
          THREE.MathUtils.radToDeg(worldEuler.z),
        ],
        scale: [1, 1, 1],
        parent: clickedId, 
        imageFrameId: "imageFrame-1",
        frameColor: "white",
        aspectRatio: [1, 1], // Default square aspect ratio for placeholder
        showImageDescription: true // Default to showing description
      };

      // ====== CẬP NHẬT OBJECT LIST ======
      setObjs(prev =>
        prev.map(obj =>
          obj.id === clickedId && obj.type === "wall"
            ? { ...obj, children: [...(obj.children || []), newImageFrameId] }
            : obj
        ).concat(newFrame)
      );

      if (onObjectsChange) {
        onObjectsChange([...objs, newFrame]);
      }

      setPlacingImageFrame(false); // Tắt chế độ đặt image frame
      return;
    }

    if (placingPhysicPlane) {

      console.log("hehe");
      
      // Update mouse to current click position
      const rect = gl.domElement.getBoundingClientRect();
      mouse.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      // Raycast vào tất cả các wall mesh
      raycaster.current.setFromCamera(mouse.current, camera);

      const exclude = new Set(['preview-image-frame']);
      const allMeshes = collectRaycastableMeshes(exclude);

      const intersects = raycaster.current.intersectObjects(allMeshes, true);
      if (intersects.length === 0) {
        alert("Click vào tường để đặt Image Frame!");
        return;
      }

      // Lấy intersection đầu tiên
      const intersection = intersects[0];
      const clickedObject = intersection.object;
      const clickedId = clickedObject.userData.id;
      const clickedObjData = objs.find(o => o.id === clickedId);

      // Nếu không phải wall thì không đặt
      if (!clickedObjData || clickedObjData.type !== "wall") {
        alert("Chỉ có thể đặt Image Frame lên tường!");
        return;
      }

      // ====== SỬ DỤNG CALCULATEFRAMETRANSFORM ======
      const { localPosition, worldEuler } = calculateFrameTransform(intersection, camera, meshRefs);

      // ====== TẠO OBJECT MỚI ======
      const newImageFrameId = `image-${Date.now()}`;
      const newFrame = {
        id: newImageFrameId,
        type: "image",
        src: physicPlane.src,         // placeholder frame
        alt: physicPlane.alt,
        title: physicPlane.title,
        position: [localPosition.x, localPosition.y, localPosition.z],
        rotation: [
          THREE.MathUtils.radToDeg(worldEuler.x),
          THREE.MathUtils.radToDeg(worldEuler.y),
          THREE.MathUtils.radToDeg(worldEuler.z),
        ],
        scale: [1, 1, 1],
        parent: clickedId, 
        imageFrameId: "imageFrame-1",
        frameColor: "white",
        canvasColor: "white",
        aspectRatio: [1, 1], // Default square aspect ratio for placeholder
        showImageDescription: true // Default to showing description
      };

      console.log(newFrame);

      // ====== CẬP NHẬT OBJECT LIST ======
      setObjs(prev =>
        prev.map(obj =>
          obj.id === clickedId && obj.type === "wall"
            ? { ...obj, children: [...(obj.children || []), newImageFrameId] }
            : obj
        ).concat(newFrame)
      );

      console.log(objs);

      if (onObjectsChange) {
        onObjectsChange([...objs, newFrame]);
      }

      setPlacingPhysicPlane(false); // Tắt chế độ đặt image frame
      return;
    }

    if (placingSpotLight) {
      // Update raycaster
      raycaster.current.setFromCamera(mouse.current, camera);
      
      // Get all intersected objects - safely handle meshRefs values
      const allMeshes = collectRaycastableMeshes();
      
      const intersects = raycaster.current.intersectObjects(allMeshes, true);

      if (intersects.length > 0) {
        const intersection = intersects[0];
        const clickedObject = intersection.object;
        const clickedId = clickedObject.userData.id;
        const clickedObjData = objs.find(o => o.id === clickedId);

        if (clickedObjData?.type === 'image') {
          // STEP 1: get world position of image center
          const imageMesh = clickedObject;
          const imageWorldPos = new THREE.Vector3();
          imageMesh.getWorldPosition(imageWorldPos);

          // STEP 2: get world forward (normal) of image
          const imageWorldQuat = new THREE.Quaternion();
          imageMesh.getWorldQuaternion(imageWorldQuat);

          const imageNormal = new THREE.Vector3(0, 0, 1).applyQuaternion(imageWorldQuat).normalize();

          // STEP 3: compute light position (5m away along normal)
          const lightPos = imageWorldPos.clone().add(imageNormal.clone().multiplyScalar(5));

          // STEP 4: compute angle to cover image
          const imgScale = clickedObjData.scale ?? [1, 1, 1];
          const imageWidth = imgScale[0];
          const imageHeight = imgScale[1];
          const halfDiag = Math.sqrt((imageWidth / 2) ** 2 + (imageHeight / 2) ** 2);
          const distance = 3;
          const angleRad = Math.atan(halfDiag / distance);
          const angleDeg = THREE.MathUtils.radToDeg(angleRad);

          // STEP 5: compute rotation Y
          const lightPositionVec = lightPos.clone();
          const targetPositionVec = imageWorldPos.clone();

          const direction = new THREE.Vector3().subVectors(targetPositionVec, lightPositionVec).normalize();

          const angleY = Math.atan2(direction.x, direction.z); // compute angle around Y axis

          const rotation = [
            0,
            THREE.MathUtils.radToDeg(angleY) + 180,
            0
          ];

          // Create new light
          const newLight = {
            id: `spotLight-${Date.now()}`,
            type: 'spotLight',
            position: [lightPos.x, lightPos.y, lightPos.z],
            rotation: rotation,
            intensity: 10,
            color: "#ffffff",
            angle: angleDeg,
            penumbra: 0.5,
            imageParent: clickedId
          };

          clickedObjData.lightChild = [...(clickedObjData.lightChild || []), newLight.id];
          setObjs(prev => [...prev, newLight]);

          if (onObjectAdded) {
              onObjectAdded(
              newLight.id,
              newLight.position,
              newLight.rotation,
              {
                intensity: newLight.intensity,
                color: newLight.color,
                angle: newLight.angle,
                penumbra: newLight.penumbra,
                imageParent: newLight.imageParent
              },
              'spotLight'
            );
          }

          setPlacingSpotLight(false);
          return;
        } else{
          alert("The light needs to be assigned to a picture");
          setPlacingSpotLight(false);
          return;
        }
      } else{
        alert("The light needs to be assigned to a picture");
        setPlacingSpotLight(false);
        return;
      }
    }

    if (placingWall) {
      // Finalize the wall placement
      const newWall = {
        id: `wall-${Date.now()}`,
        type: 'wall',
        albedo: "/textures/default/tex_default_alb.jpg",
        normal: "/textures/default/tex_default_nor.jpg",
        orm: "/textures/default/tex_default_orm.jpg",
        position: tempWallPosition,
        rotation: [0, 0, 0],
        scale: [2.5, 3, 0.1],
        color: "#b6b898",
        children: [],
        transparent: false,
        wallRole: objectRole
      };

      setObjs((prevObjects) => [...prevObjects, newWall]);

      if (onObjectAdded) {
        onObjectAdded(
          newWall.id,
          newWall.position,
          newWall.rotation,
          {
            scale: newWall.scale,
            color: newWall.color
          },
          'wall'
        );
      } //Add newObject into object

      setPlacingWall(false); // Stop placing the wall
    } else {
      // Update the raycaster with the current mouse position
      raycaster.current.setFromCamera(mouse.current, camera);

      // Get all intersected objects - safely handle meshRefs values
      const allMeshes = [];
      Array.from(meshRefs.values()).forEach(obj => {
        if (obj) {
          if (Array.isArray(obj)) {
            allMeshes.push(...obj.filter(item => item && item.isMesh));
          } else if (obj.isMesh) {
            allMeshes.push(obj);
          } else if (obj.children) {
            obj.traverse((child) => {
              if (child.isMesh) {
                allMeshes.push(child);
              }
            });
          }
        }
      });
      
      // Always include ground mesh for reliable ground click detection
      if (groundRef.current) {
        allMeshes.push(groundRef.current);
      }
      
      const intersects = raycaster.current.intersectObjects(allMeshes, true);

      if (intersects.length > 0) {
        // Find the first intersected object
        let clickedObject = intersects[0].object;
        let intersection = intersects[0];
        
        // Check if this is a potential ground click (ground plane or GLB floor)
        // For GLB objects, only consider it a ground click if:
        // 1. The intersection point is very close to ground level (within 0.3 units)
        // 2. The normal vector points mostly upward (indicating floor, not wall)
        const isGroundClick = clickedObject === groundRef.current || 
          (clickedObject.userData?.id && 
           objs.find(obj => obj.id === clickedObject.userData.id)?.src?.toLowerCase().endsWith('.glb') &&
           intersection.point.y <= GROUND_LEVEL + 0.3 && // Stricter height check for floor detection
           intersection.face && intersection.face.normal.y > 0.7); // Normal pointing upward indicates floor
        
        // Handle ground/floor clicks - move camera in view mode and deselect
        if (isGroundClick && mode === 'view') {
          // Check if mouse movement was minimal (to distinguish clicks from drags)
          const MOVEMENT_THRESHOLD = 5; // pixels
          let shouldSlerp = true;
          
          if (pointerDownPoint.current) {
            const deltaX = Math.abs(e.clientX - pointerDownPoint.current.x);
            const deltaY = Math.abs(e.clientY - pointerDownPoint.current.y);
            const totalMovement = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            
            // Only slerp if movement was minimal
            shouldSlerp = totalMovement <= MOVEMENT_THRESHOLD;
          }
          
          if (mode === 'view' && shouldSlerp) {
            setImageLerpFlag(false);
            // Reset image teleportation flag for ground clicks (enable collision)
            isTeleportingToImage.current = false;
            cameraTarget.current = { x: intersection.point.x, y: GROUND_LEVEL, z: intersection.point.z };
            cameraLookAtTarget.current = new THREE.Vector3(intersection.point.x, GROUND_LEVEL, intersection.point.z);
          }
          
          // Deselect any selected object when clicking on ground/floor
          setGizmoMode('');
          setSelectedId(null);
          return; // Exit early after handling ground/floor click
        }
        
        // If not a ground click, find the first non-ground intersected object for regular interaction
        if (!isGroundClick) {
          // Look for the first non-ground object to interact with
          for (let i = 0; i < intersects.length; i++) {
            if (intersects[i].object !== groundRef.current) {
              clickedObject = intersects[i].object;
              intersection = intersects[i];
              break;
            }
          }
        }
        
        // Skip further processing if this was a ground click
        if (isGroundClick) {
          return;
        }
        
        const clickedId = clickedObject.userData.id; // Retrieve the ID from userData
        let clickedObjData = objs.find(o => o.id === clickedId);
        
        // If not found in objs, check tourMarkers array
        if (!clickedObjData && clickedId && clickedId.startsWith('tourmarker-')) {
          const tourMarker = tourMarkers.find(tm => tm.id === clickedId);
          if (tourMarker) {
            clickedObjData = { ...tourMarker, type: 'tourmarker' };
          }
        }

        if (clickedObjData?.src?.toLowerCase().endsWith(".glb")) {
          if(isEditRoom === false){
            setGizmoMode('');
            setSelectedId(null);
            setHoveredId(null);
            return;
          }
        }

        if (mode === 'view' && clickedObjData?.type === 'image' && clickedObjData?.src) {
          // Only teleport to image if pointer down and up are on the same image (no dragging)
          if (pointerDownObjectId.current !== clickedId) {
            return; // Don't teleport if user dragged from different object or started drag outside
          }
          
          // Cancel any existing camera movement before starting new one
          cameraTarget.current = null;
          cameraLookAtTarget.current = null;
          
          // Get image world position and normal
          const imageMesh = clickedObject;
          const imageWorldPos = new THREE.Vector3();
          imageMesh.getWorldPosition(imageWorldPos);

          const imageWorldQuat = new THREE.Quaternion();
          imageMesh.getWorldQuaternion(imageWorldQuat);
          const imageNormal = new THREE.Vector3(0, 0, 1).applyQuaternion(imageWorldQuat).normalize();

          // Camera target: 2 units in front of image, at camera's ground level
          const camTarget = imageWorldPos.clone().add(imageNormal.clone().multiplyScalar(5));
          camTarget.y = GROUND_LEVEL;

          // Set flag to indicate we're teleporting to an image (disable collision)
          isTeleportingToImage.current = true;
          cameraTarget.current = { x: camTarget.x, y: camTarget.y, z: camTarget.z };
          cameraLookAtTarget.current = imageWorldPos.clone();

          onImageClick?.({
            id: clickedObjData.id, // Include the image ID for tour marker matching
            src: clickedObjData.src,
            title: clickedObjData.title,
            alt: clickedObjData.alt,
            description: clickedObjData.description,
            audio: clickedObjData.audio,
            showImageDescription: clickedObjData.showImageDescription
          })
          setImageLerpFlag(true);

          return; // Don't select image in view mode
        }

        if (clickedObjData) {
          // In edit mode, prevent selecting transparent walls when toggle is disabled
          if (mode === 'edit' && clickedObjData.type === 'wall' && clickedObjData.transparent && !showTransparentWalls) {
            return; // Don't allow selection of hidden transparent walls
          }

          if (mode === 'edit' && clickedObjData.type === 'wall' && clickedObjData.objectRole === "template" && typeRoom === "exhibition" && userRole !== "admin") {
            return alert("Objects from templates cannot be edited");
          }

          const canvasRect = gl.domElement.getBoundingClientRect();

          // If clicking on a different object, close popup first then reopen
          if (selectedId && selectedId !== clickedId) {
            setPopupVisible(false);
            setTimeout(() => {
              setPopupPosition({
                x: e.clientX,  
                y: e.clientY,
              });
              setPopupData(clickedObjData);
              setPopupVisible(true);
            }, 50);
          } else {
            setPopupPosition({
              x: e.clientX,  
              y: e.clientY,
            });
            setPopupData(clickedObjData);
            setPopupVisible(true);
          }
        }

        if (clickedId) {
          // In edit mode, prevent selecting transparent walls when toggle is disabled
          if (mode === 'edit' && clickedObjData?.type === 'wall' && clickedObjData?.transparent && !showTransparentWalls) {
            return; // Don't allow selection of hidden transparent walls
          }

          // Reset gizmo mode when selecting objects
          setGizmoMode('');
          
          setSelectedId(clickedId); // Toggle selection
          setHoveredId(null); // Clear the hovered object ID
        }
      } else {
        setGizmoMode(''); // Reset gizmo mode if no object is clicked
        setSelectedId(null); 
      }
    }
  };

  const handleCreateWall = () => {
    if (!placingWall) {
      setPlacingWall(true); // Start placing a new wall
    }
  };

  const handleCreateSpotLight = () => {
    if (!placingSpotLight) {
      setPlacingSpotLight(true);
    }
  };
  const handleCreateSpotLightForImage = (imageId) => {
  if (!imageId) return;

  const imageObj = objs.find((o) => o.id === imageId && o.type === 'image');
  if (!imageObj) return;

  // Lấy thông tin ảnh
  const mesh = meshRefs.get(imageId);
  if (!mesh) {
    console.warn("⚠️ Không tìm thấy mesh của ảnh này trong meshRefs:", imageId);
    return;
  }

  // --- B1: Lấy vị trí và hướng của ảnh trong world ---
  const imageWorldPos = new THREE.Vector3();
  mesh.getWorldPosition(imageWorldPos);

  const imageWorldQuat = new THREE.Quaternion();
  mesh.getWorldQuaternion(imageWorldQuat);

  // Normal hướng ra khỏi ảnh (trục Z)
  const imageNormal = new THREE.Vector3(0, 0, 1).applyQuaternion(imageWorldQuat).normalize();

  // --- B2: Đặt đèn cách ảnh 5m theo hướng normal ---
  const lightPos = imageWorldPos.clone().add(imageNormal.clone().multiplyScalar(5));

  // --- B3: Tính góc phủ sáng ---
  const imgScale = imageObj.scale ?? [1, 1, 1];
  const imageWidth = imgScale[0];
  const imageHeight = imgScale[1];
  const halfDiag = Math.sqrt((imageWidth / 2) ** 2 + (imageHeight / 2) ** 2);
  const distance = 3;
  const angleRad = Math.atan(halfDiag / distance);
  const angleDeg = THREE.MathUtils.radToDeg(angleRad);

  // --- B4: Tính rotation hướng vào ảnh ---
  const direction = new THREE.Vector3().subVectors(imageWorldPos, lightPos).normalize();
  const angleY = Math.atan2(direction.x, direction.z);

  const rotation = [
    0,
    THREE.MathUtils.radToDeg(angleY) + 180,
    0
  ];

  // --- B5: Tạo đèn ---
  const newLight = {
    id: `spotLight-${Date.now()}`,
    type: 'spotLight',
    position: [lightPos.x, lightPos.y, lightPos.z],
    rotation: rotation,
    intensity: 150,
    color: '#ffffff',
    angle: angleDeg,
    penumbra: 0.5,
    imageParent: imageId,
  };

  // --- B6: Gắn light vào ảnh ---
  const updatedObjs = objs.map((obj) => {
    if (obj.id === imageId) {
      return {
        ...obj,
        lightChild: [...(obj.lightChild || []), newLight.id],
      };
    }
    return obj;
  });

  setObjs([...updatedObjs, newLight]);

  if (onObjectAdded) {
    onObjectAdded(
      newLight.id,
      newLight.position,
      newLight.rotation,
      {
        intensity: newLight.intensity,
        color: newLight.color,
        angle: newLight.angle,
        penumbra: newLight.penumbra,
        imageParent: newLight.imageParent,
      },
      'spotLight'
    );
  }

  console.log(`💡 SpotLight tự động gắn vào ảnh ${imageId}`);
};


  // Handle object transformation
  const handleTransformChange = (id, transform) => {
    // Check if this is a tour marker transformation
    if (id && id.startsWith('tourmarker-')) {
      // Handle tour marker transformation
      const updatedTourMarkers = tourMarkers.map((marker) =>
        marker.id === id
          ? {
              ...marker,
              position: transform.position ?? marker.position,
              rotation: transform.rotation ?? marker.rotation,
              scale: transform.scale ?? marker.scale,
            }
          : marker
      );
      
      // Call the parent's tour marker update function if available
      if (typeof onUpdateTourMarkers === 'function') {
        onUpdateTourMarkers(updatedTourMarkers);
      }
      
      return; // Exit early for tour markers
    }

    // Handle regular object transformation
    setObjs((prevObjects) => {
      const updated = prevObjects.map((obj) =>
        obj.id === id
          ? {
              ...obj,
              position: transform.position ?? obj.position,
              rotation: transform.rotation ?? obj.rotation,
              scale: transform.scale ?? obj.scale,
              intensity: transform.intensity ?? obj.intensity,
              color: transform.color ?? obj.color,
              angle: transform.angle ?? obj.angle,
              penumbra: transform.penumbra ?? obj.penumbra,
              imageFrameId: transform.imageFrameId ?? obj.imageFrameId,
              frameColor: transform.frameColor ?? obj.frameColor,
              canvasColor: transform.canvasColor ?? obj.canvasColor,
              albedo: transform.albedo ?? obj.albedo,
              normal: transform.normal ?? obj.normal,
              orm: transform.orm ?? obj.orm,
              transparent: transform.transparent ?? obj.transparent,
              aspectRatio: transform.aspectRatio ?? obj.aspectRatio,
              showImageDescription: transform.showImageDescription ?? obj.showImageDescription
            }
          : obj
      );

      setObjectTree(buildObjectTree(updated));

      if (onObjectsChange) {
        onObjectsChange(updated);
      }

      return updated;
    });
  };

  // ===== Thêm hoặc thay audio cho ảnh =====
  const handleAddOrReplaceAudio = (selectedId, audioUrl) => {
    if (!selectedId || !audioUrl) return;

    setObjs((prevObjs) => {
      const updated = prevObjs.map((obj) => {
        if (obj.id === selectedId && obj.type === "image") {
          return {
            ...obj,
            audio: audioUrl, // thêm hoặc thay link audioss
          };
        }
        return obj;
      });

      onObjectsChange?.(updated); // đồng bộ với parent
      return updated;
    });

    console.log(` Audio set for ${selectedId}:`, audioUrl);
  };

  // Function to teleport to a specific image
  const teleportToImage = (imageId) => {
    const imageObj = objs.find(obj => obj.id === imageId && obj.type === 'image');
    if (!imageObj) {
      console.warn('Image not found for teleportation:', imageId);
      return;
    }

    const parentWall = imageObj.parent ? objs.find(obj => obj.id === imageObj.parent) : null;
    if (!parentWall) {
      console.warn('Parent wall not found for image:', imageId);
      return;
    }

    const wallPosition = parentWall.position || [0, 0, 0];
    const wallRotation = parentWall.rotation || [0, 0, 0];
    const wallScale = parentWall.scale || [1, 1, 1];
    const imagePosition = imageObj.position;
    const imageRotation = imageObj.rotation || [0, 0, 0];

    // Calculate image world position
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
    
    // Calculate camera target position (move back from image)
    const DISTANCE = 2.0; // Distance from image
    const camTarget = imageWorldPos.clone().add(forward.clone().multiplyScalar(DISTANCE));
    camTarget.y = GROUND_LEVEL;

    // Set teleportation targets
    isTeleportingToImage.current = true;
    cameraTarget.current = { x: camTarget.x, y: camTarget.y, z: camTarget.z };
    cameraLookAtTarget.current = imageWorldPos.clone();
    setImageLerpFlag(true);
  };
  
  // Get current camera position and rotation
  const getCurrentCameraState = () => {
    if (!camera) {
      console.warn('Camera not available');
      return null;
    }
    
    // Get camera position
    const position = [camera.position.x, camera.position.y, camera.position.z];
    
    // Get camera rotation in degrees
    const rotation = [
      THREE.MathUtils.radToDeg(camera.rotation.x),
      THREE.MathUtils.radToDeg(camera.rotation.y), 
      THREE.MathUtils.radToDeg(camera.rotation.z)
    ];
    
    return { position, rotation };
  };
  
  // Expose the saveToFile and createWall methods to the parent component
  useImperativeHandle(ref, () => ({
    createWall: handleCreateWall,
    createSpotLight: handleCreateSpotLight,
    createSpotLightForImage: handleCreateSpotLightForImage,
    updateTransform: (id, transform) => handleTransformChange(id, transform),
    deleteObject: handleDeleteObject,
    startPlacingImageFrame: () => {
      setPlacingImageFrame(true);
    },
    startPlacingPhysicPlane: () => {
      setPlacingPhysicPlane(true);
    },
    replaceImageOnFrame: replaceImageOnFrame,
    handleAddOrReplaceAudio: handleAddOrReplaceAudio,
    getCurrentCameraState: getCurrentCameraState,
    teleportToImage: teleportToImage,
    cancelCameraMovement: () => {
      cameraTarget.current = null;
      cameraLookAtTarget.current = null;
    },
    getRoomPayload(typeRoom) {
      // build lại chính xác như logic cũ saveToFile nhưng KHÔNG download
      const objectJson = JSON.stringify({
        isPreset: objectData?.isPreset ?? false,
        objects,
        images,
        imageFrameList,
        tourMarkers
      });

      const environmentJson = JSON.stringify({
        sky: skySettings,
        ground: groundSettings,
        bloom: bloomSettings,
        selectedHdri: hdri,
        selectedGroundTexture: groundTexture,
        skySettingMode,
        groundSettingMode
      });

      if (typeRoom === "exhibition") {
        return {
          environment_config: {
            room: objectJson,
            environment: environmentJson
          }
        };
      } else {
        return {
          wall_config: {
            room: objectJson,
            environment: environmentJson
          }
        };
      }
    }
  }));

  // Recursive function to render objects
  const renderObject = (object, parentRef = null) => {
    if (object.type === 'wall') {
      // In edit mode, only render transparent walls if showTransparentWalls is true
      if (mode === 'edit' && object.transparent && !showTransparentWalls) {
        return null; // Don't render transparent walls when toggle is disabled
      }

      if (!wallRefs.current[object.id]) {
        wallRefs.current[object.id] = createRef();
      }
      const wallRef = wallRefs.current[object.id];

      return (
        <>
          <Fragment key={object.id}>
            <Wall
              key={object.id}
              id={object.id}
              albedo={object.albedo}
              normal={object.normal}
              orm={object.orm}
              scale={object.scale}
              position={object.position}
              rotation={object.rotation}
              color={object.color}
              mode={mode}
              selectedId={selectedId}
              gizmoActive={gizmoActive}
              hoveredId={hoveredId}
              gizmoMode={gizmoMode}
              snapEnabled={snapEnabled}
              onTransformChange={handleTransformChange}
              meshRef={wallRef}
              modelSrc={object.src}
              transparent={object.transparent}
              onBoundingBoxUpdate={handleBoundingBoxUpdate}
            />
            {object.children.map((child) => renderObject(child, wallRef))}
          </Fragment>
        </>
      );
    } else if (object.type === 'image') {
      if(object.src === physicPlane.src){
        return (
          <PhysicPlane
            key={`${object.id}-${object.imageFrameId}-${object.src}`}
            id={object.id}
            src={object}
            scale={object.scale}
            position={object.position}
            rotation={object.rotation}
            mode={mode}
            selectedId={selectedId}
            gizmoActive={gizmoActive}
            hoveredId={hoveredId}
            gizmoMode={gizmoMode}
            onTransformChange={handleTransformChange}
            parentRef={parentRef}
            title={object.title}
            alt={object.alt}
            imageFrameId={object.imageFrameId}
            imageFrameSrc = {physicPlane.src}
            frameColor = {object.frameColor}
            onHover={setTooltip}
            wallBoxes={wallBoxes}
            showTransparentWalls={showTransparentWalls}
          />
        );
      } else{
        return (
          <Image
            key={`${object.id}-${object.imageFrameId}-${object.src}`}
            id={object.id}
            src={object}
            scale={object.scale}
            data={object.description}
            position={object.position}
            rotation={object.rotation}
            mode={mode}
            selectedId={selectedId}
            gizmoActive={gizmoActive}
            hoveredId={hoveredId}
            gizmoMode={gizmoMode}
            snapEnabled={snapEnabled}
            onTransformChange={handleTransformChange}
            parentRef={parentRef}
            title={object.title}
            alt={object.alt}
            imageFrameId={object.imageFrameId}
            imageFrameSrc = {imageFrame.src}
            frameColor = {object.frameColor}
            canvasColor = {object.canvasColor || 'white'}
            showImageDescription={object.showImageDescription}
            onHover={setTooltip}
          />
        );
      }
    } else if (object.type === 'object') {
      return (
        <Object3D
          key={object.id}
          id={object.id}
          src={object.src}
          albedo={object.albedo}
          normal={object.normal}
          orm={object.orm}
          scale={object.scale}
          position={object.position}
          rotation={object.rotation}
          mode={mode}
          selectedId={selectedId}
          gizmoActive={gizmoActive}
          hoveredId={hoveredId}
          gizmoMode={gizmoMode}
          snapEnabled={snapEnabled}
          hdri={hdri}
          onTransformChange={handleTransformChange}
        />
      );
    } else if (object.type === 'spawn' && mode === "edit") {
        return (
            <SpawnMarker
                key={object.id}
                id={object.id}
                position={object.position}
                rotation={object.rotation}
                mode={mode}
                selectedId={selectedId}
                hoveredId={hoveredId}
                gizmoMode={gizmoMode}
                gizmoActive={gizmoActive}
                snapEnabled={snapEnabled}
                onTransformChange={handleTransformChange}
            />
        );
    } else if (object.type === 'spotLight') {
        if(object.imageParent && selectedId === object.imageParent){
          return (
            <SpotLightWithHelper
              key={object.id}
              id={object.id}
              imageParent={object.imageParent}
              scale={object.scale}
              intensity={object.intensity}
              color={object.color}
              angle={object.angle}     
              penumbra={object.penumbra}   
              mode={mode}
              gizmoMode={gizmoMode}
              selectedId={selectedId}
              gizmoActive={gizmoActive}
              snapEnabled={snapEnabled}
              onTransformChange={handleTransformChange}
              setSelectedId = {setSelectedId}
            />
          );
        } else{
          return (
            <SpotLightWithHelper
              key={object.id}
              id={object.id}
              position={object.position}
              rotation={object.rotation}
              scale={object.scale}
              intensity={object.intensity}
              color={object.color}
              angle={object.angle}     
              penumbra={object.penumbra}   
              mode={mode}
              gizmoMode={gizmoMode}
              selectedId={selectedId}
              gizmoActive={gizmoActive}
              snapEnabled={snapEnabled}
              onTransformChange={handleTransformChange}
              setSelectedId = {setSelectedId}
              setPopupVisible={setPopupVisible}
              setPopupPosition={setPopupPosition}
              setPopupData={setPopupData}
            />
          );
        }
    }
    return null;
  };


    // Thay ảnh trên frame (dùng chung cho click hoặc drag-drop)
  const replaceImageOnFrame = (frameId, newImage) => {

    console.log("???", newImage);
    const frameObj = objs.find(o => o.id === frameId && o.type === "image");
    if (!frameObj) return;

    // Kiểm tra loại file (ảnh hoặc video)
    const isVideo = /\.(mp4|webm|mov|ogg)$/i.test(newImage.file_url);

    if (isVideo) {
      console.log("Detected video file, skipping Image() load:", newImage.file_url);

      const updatedObjs = objs.map(o => {
        if (o.id === frameId) {

          return {
            ...o,
            src: newImage.file_url,
            alt: newImage.metadata.tac_gia || "Không tác giả",
            title: newImage.metadata.tieu_de || "Tranh không có tiêu đề",
            description: newImage.metadata || "Tranh không có thông tin",
            type: "image",
            ...(newImage.index !== undefined && { index: newImage.index }),
            ...(newImage.audio && { audio: newImage.audio }),
            scale: [1, 1, 1],         // tạm aspect ratio 16:9
            aspectRatio: [16/9, 1],   // Default video aspect ratio
            canvasColor: o.canvasColor || "white",  // preserve existing canvasColor or default
            frameColor: o.frameColor || "white",     // preserve existing frameColor or default
            showImageDescription: o.showImageDescription ?? true // preserve existing setting or default
          };
        }
        return o;
      });

      setObjs(updatedObjs);
      onObjectsChange?.(updatedObjs);
      return; //stop tại đây — không tạo new Image()
    }

    //Ảnh bình thường
    const img = new window.Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      const aspect = img.naturalWidth / img.naturalHeight;

      const updatedObjs = objs.map(o => {
        if (o.id === frameId) {
          return {
            ...o,
            src: newImage.thumbnail || newImage.file_url,
            alt: newImage.metadata.tac_gia || "Không tác giả",
            title: newImage.metadata.tieu_de || "Tranh không có tiêu đề",
            description: newImage.metadata || "Tranh không có thông tin",
            ...(newImage.index !== undefined && { index: newImage.index }),
            ...(newImage.audio && { audio: newImage.audio }),
            scale: [aspect, 1, 1],
            aspectRatio: [aspect, 1], // Store aspectRatio for toolbox dimension calculations
            canvasColor: o.canvasColor || "white",  // preserve existing canvasColor or default
            frameColor: o.frameColor || "white",     // preserve existing frameColor or default
            showImageDescription: o.showImageDescription ?? true // preserve existing setting or default
          };
        }
        return o;
      });

      setObjs(updatedObjs);
      onObjectsChange?.(updatedObjs);
    };

    img.onerror = (err) => {
      console.error("Failed to load image for frame replacement:", {
        frameId,
        newImageSrc: newImage.thumbnail || newImage.file_url,
        newImage,
        error: err,
        errorType: err.type,
        timestamp: new Date().toISOString()
      });
      
      alert(`Failed to load replacement image: ${newImage.src}\nPlease check if the image URL is valid and accessible.`);
    };

    img.src = newImage.thumbnail || newImage.file_url;
  };

  useEffect(() => {
    const handleDrop = (e) => {
      setSelectedId(null);
      e.preventDefault();
      if (!draggedImage) return;

      // Lấy vị trí chuột
      const rect = gl.domElement.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      mouse.current.set(x, y);
      raycaster.current.setFromCamera(mouse.current, camera);

      // Thu thập toàn bộ mesh để raycast
      const allMeshes = [];
      Array.from(meshRefs.values()).forEach(obj => {
        if (!obj) return;
        if (Array.isArray(obj)) allMeshes.push(...obj.filter(m => m && m.isMesh));
        else if (obj.isMesh) allMeshes.push(obj);
        else obj.traverse(c => {
          if (c.isMesh && c.material && c.visible && c.geometry) {
            if (!c.geometry.boundingSphere) c.geometry.computeBoundingSphere();
            allMeshes.push(c);
          }
        });
      });

      const intersects = raycaster.current.intersectObjects(allMeshes, false);
      if (intersects.length === 0) {
        setDraggedImage(null);
        return;
      }

      const intersection = intersects[0];
      const clickedObject = intersection.object;
      const clickedId = clickedObject.userData.id;
      const clickedObjData = objs.find(o => o.id === clickedId);
      const clickedObjectSrc = clickedObjData?.src;
      const imageSrc = draggedImage.src;
      const isVideo = /\.(mp4|webm|mov|ogg)$/i.test(imageSrc);

      // ============ CASE 1: Kéo thả vào khung ảnh (Image Frame) ============
      if (clickedObjectSrc === imageFrame.src) {
        console.log("🖼️ Replace content on frame:", clickedId);
        replaceImageOnFrame(clickedId, draggedImage); // ✅ dùng hàm chung xử lý ảnh/video
        setDraggedImage(null);
        return;
      }

      // ============ CASE 2: Đặt khung mới lên tường ============
      else if (draggedImage.src === imageFrame.src) {
        console.log("🧩 Dropping image frame on wall:", clickedId);
        const wallObj = objs.find(o => o.id === clickedId);
        if (!wallObj) return;

        // Tính toán hướng tường
        const normalMatrix = new THREE.Matrix3().getNormalMatrix(clickedObject.matrixWorld);
        const worldNormal = intersection.face.normal.clone().applyMatrix3(normalMatrix).normalize();
        const offset = 0.05;
        const worldPosition = intersection.point.clone().add(worldNormal.clone().multiplyScalar(offset));

        // Định hướng mặt ảnh song song với tường
        const worldUp = new THREE.Vector3(0, 1, 0);
        const right = new THREE.Vector3().crossVectors(worldUp, worldNormal).normalize();
        const up = new THREE.Vector3().crossVectors(worldNormal, right).normalize();

        const rotMatrix = new THREE.Matrix4().makeBasis(right, up, worldNormal);
        const euler = new THREE.Euler().setFromRotationMatrix(rotMatrix);

        const wallContainer = meshRefs.get(clickedId);
        const localPosition = wallContainer ? wallContainer.worldToLocal(worldPosition.clone()) : worldPosition.clone();

        const newFrame = {
          id: `image-${Date.now()}`,
          type: "image",
          src: imageFrame.src,
          alt: "New Frame",
          title: "Frame",
          position: [localPosition.x, localPosition.y, localPosition.z],
          rotation: [
            THREE.MathUtils.radToDeg(euler.x),
            THREE.MathUtils.radToDeg(euler.y),
            THREE.MathUtils.radToDeg(euler.z),
          ],
          scale: [1, 1, 1],
          parent: clickedId,
          imageFrameId: "imageFrame-1",
          frameColor: "white",
          aspectRatio: [1, 1] // Default square aspect ratio for placeholder
        };

        if (onObjectAdded) {
          onObjectAdded(
            newFrame.id,
            newFrame.position,
            newFrame.rotation,
            {
              scale: newFrame.scale,
              src: newFrame.src,
              alt: newFrame.alt,
              title: newFrame.title,
              parent: newFrame.parent,
              imageFrameId: newFrame.imageFrameId,
              frameColor: newFrame.frameColor,
            },
            "image"
          );
        }

        setObjs(prev =>
          prev
            .map(obj =>
              obj.id === clickedId && obj.type === "wall"
                ? { ...obj, children: [...(obj.children || []), newFrame.id] }
                : obj
            )
            .concat(newFrame)
        );

        setDraggedImage(null);
        return;
      } else{
        alert("Please drop the image onto an image frame to replace its content, or drop the image frame onto a wall to place a new frame.");
      }

    };

    const handleDragOver = (e) => e.preventDefault();

    gl.domElement.addEventListener("drop", handleDrop);
    gl.domElement.addEventListener("dragover", handleDragOver);

    return () => {
      gl.domElement.removeEventListener("drop", handleDrop);
      gl.domElement.removeEventListener("dragover", handleDragOver);
    };
  }, [draggedImage, objs, gl, camera, meshRefs, replaceImageOnFrame, imageFrame, onObjectAdded]);

  return (
    <group 
      onPointerMove={handleMouseMove}
      onTouchMove={handleMouseMove}
      onClick={handleMouseClick}
      onPointerDown={(e) => {       
        // Only track left mouse button for ground movement
        if (e.button === 0) {
          // Update NDC for raycast
          const { x, y } = eventToNDC(e, gl);
          mouse.current.x = x;
          mouse.current.y = y;
          
          // Track pointer down position and object
          pointerDownPoint.current = { x: e.clientX, y: e.clientY };
          
          // Raycast to find object under pointer on down
          raycaster.current.setFromCamera(mouse.current, camera);
          const allMeshes = collectRaycastableMeshes();
          const intersects = raycaster.current.intersectObjects(allMeshes, true);
          
          if (intersects.length > 0) {
            const clickedObject = intersects[0].object;
            pointerDownObjectId.current = clickedObject.userData.id;
          } else {
            pointerDownObjectId.current = null;
          }
        }
      }}
      onPointerUp={(e) => {
        // Delay reset to allow onClick handler to use the pointer down point
        setTimeout(() => {
          pointerDownPoint.current = null;
          pointerDownObjectId.current = null;
        }, 0);
      }}
      onPointerMissed={() => { setSelectedId(null); setGizmoMode(''); }}
    >
      {skySettingMode === 'sky' && (
        <>
          <Sky
            distance={skySettings.distance}
            sunPosition={skySettings.sunPosition}
            inclination={skySettings.inclination}
            azimuth={skySettings.azimuth}
            turbidity={skySettings.turbidity}
            rayleigh={skySettings.rayleigh}
            mieCoefficient={skySettings.mieCoefficient}
            mieDirectionalG={skySettings.mieDirectionalG}
            exposure={skySettings.exposure}
          />
          <directionalLight
            ref={sunLightRef}
            position={skySettings.sunPosition}
            intensity={20} 
            castShadow
            shadow-mapSize={[2048, 2048]}
          />
        </>

      )}

      {skySettingMode === 'preset' && hdri && !hdri.startsWith('/') && (
        <>
          <Environment preset={hdri} background = {false} />
          <SkyboxRenderer preset={hdri} />
        </>
      )}

      {skySettingMode === 'file' && hdri && (
        <>
          {hdri.match(/\.(hdr|exr)$/i) ? (
            // HDR/EXR: Use drei Environment for proper HDR handling
            <Environment files={hdri} background />
          ) : (
            // JPG/PNG/Custom files: Use SkyboxRenderer for both single files and cubemaps
            <SkyboxRenderer filePath={hdri} />
          )}
        </>
      )}

      {/* Skybox mode handled by SkyboxRenderer component */}
      {skySettingMode === 'skybox' && <SkyboxRenderer preset={hdri} />}

      <ambientLight intensity={1.2} />
      
      {/* {mode === 'view' && memoizedShadows} */}

      {objectTree.map((object) => renderObject(object))}

      {/* Render tour markers for images with tour indices - EDIT MODE ONLY */}
      {mode === 'edit' && markersVisible && tempTourIndices && objs.filter(obj => obj.type === 'image').map((image) => {
        const tourIndex = tempTourIndices.get(image.id);

        if (tourIndex !== undefined && tourIndex !== -1) {
          // Find the parent wall to get its position, rotation and scale
          const parentWall = objs.find(obj => obj.id === image.parent);
          const wallPosition = parentWall ? parentWall.position : [0, 0, 0];
          const wallRotation = parentWall ? parentWall.rotation : [0, 0, 0];
          const wallScale = parentWall ? parentWall.scale : [1, 1, 1];
          
          // Find the linked marker from tourMarkers array to get the actual marker ID and existing position
          const linkedMarker = tourMarkers.find(marker => 
            marker.imageId === image.id
          );
          
          // Use the actual marker ID or fallback to legacy format for backward compatibility
          const tourMarkerId = linkedMarker?.id || `tourmarker-${image.id}`;
          
          return (
            <TourMarker
              key={`tour-${image.id}`}
              id={tourMarkerId}
              type="image"
              imageId={image.id}
              imagePosition={image.position}
              imageRotation={image.rotation}
              wallPosition={wallPosition}
              wallRotation={wallRotation}
              wallScale={wallScale}
              tourIndex={tourIndex}
              mode={mode}
              selectedId={selectedId}
              gizmoMode={gizmoMode}
              gizmoActive={gizmoActive}
              hoveredId={hoveredId}
              snapEnabled={snapEnabled}
              onTransformChange={handleTransformChange}
              markerPosition={linkedMarker?.position} // Pass existing position if available
            />
          );
        }
        return null;
      })}

      {/* Camera Tour Markers */}
      {mode === 'edit' && markersVisible && tempTourIndices && tourMarkers
        .filter(marker => marker.type === 'camera')
        .map((cameraMarker) => {
          const itemId = cameraMarker.itemId || cameraMarker.id.replace('tourmarker-', '');
          const tourIndex = tempTourIndices.get(itemId);
          
          if (tourIndex !== undefined && tourIndex !== -1) {
            const tourMarkerId = cameraMarker.id; // Use the existing marker ID directly
            
            return (
              <TourMarker
                key={`camera-tour-${cameraMarker.id}`}
                id={tourMarkerId}
                type="camera"
                cameraPosition={cameraMarker.position}
                cameraRotation={cameraMarker.rotation}
                tourIndex={tourIndex}
                mode={mode}
                selectedId={selectedId}
                gizmoMode={gizmoMode}
                gizmoActive={gizmoActive}
                hoveredId={hoveredId}
                snapEnabled={snapEnabled}
                onTransformChange={handleTransformChange}
                markerPosition={cameraMarker.position} // For camera markers, use position directly
              />
            );
          }
          return null;
        })}

      {placingWall && (
        <Wall
          key={-1}
          id={-1}
          albedo="/textures/default/tex_default_alb.jpg"
          normal="/textures/default/tex_default_nor.jpg"
          orm="/textures/default/tex_default_orm.jpg"
          scale={[2.5, 3, 0.1]}
          position={tempWallPosition}
          rotation={[0, 0, 0]}
          mode={mode}
          selectedId={false}
          setSelectedId={() => {}}
          onTransformChange={handleTransformChange}
          gizmoActive={gizmoActive}
          hoveredId={hoveredId}
          setHoveredId={setHoveredId}
          gizmoMode={gizmoMode}
          snapEnabled={snapEnabled}
          modelSrc={null}
        />
      )}
      {placingSpotLight && (
        <mesh
            position={tempSpotLightPosition}
            scale={[2, 2, 2]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <coneGeometry args={[0.12, 0.3, 16]} />
            <meshBasicMaterial color={"White"} />
        </mesh>
      )}

      {placingImageFrame && (
        <group
          name="preview-group"
          position={tempImageFramePosition}
          rotation={tempImageFrameRotation}
        >
          <Image
            id="preview-image-frame"
            src={imageFrame}
            isPreview={true} 
            scale={[1, 1, 1]}
            position={[0, 0, 0]}
            rotation={[0, 0, 0]}
            mode={mode}
            selectedId={null}
            parentRef={null}
            snapEnabled={snapEnabled}
            imageFrameId="imageFrame-1"
            imageFrameSrc={imageFrame.src}
            frameColor="white"
            canvasColor="white"
          />
        </group>
      )}

      {placingPhysicPlane && (
        <group
          name="preview-group"
          position={tempImageFramePosition}
          rotation={tempImageFrameRotation}
        >
          <PhysicPlane
            id="preview-image-frame"
            src={physicPlane}
            isPreview={true} 
            scale={[1, 1, 1]}
            position={[0, 0, 0]}
            rotation={[0, 0, 0]}
            mode={mode}
            selectedId={null}
            parentRef={null}
            snapEnabled={snapEnabled}
            imageFrameId="imageFrame-1"
            imageFrameSrc={physicPlane.src}
          />
        </group>
      )}

      <Ground 
        mode={mode} 
        groundRef={groundRef} 
        groundSettings={groundSettings} 
        isReflective={isReflective} 
        groundSettingMode = {groundSettingMode}
        groundTexture={groundTexture}
        hideGround={objectData?.isPreset !== false} // Hide ground if isPreset is not false
      />

      <CameraMovement 
        gizmoActive={gizmoActive} 
        mode={mode} 
        cameraTarget={cameraTarget} 
        GROUND_LEVEL={GROUND_LEVEL} 
        spawnPositions={spawnPositions}
        spawnRotations={spawnRotations}
        cameraLookAtTarget={cameraLookAtTarget}
        imageLerpFlag={imageLerpFlag}
        mobileInput={mobileInput}
        isJoystickActive={isJoystickActive}
        tourMode={tourMode}
        tourPlaying={tourPlaying}
        onTourInterrupted={onTourInterrupted}
        onHideAnyInfoPanel={onHideAnyInfoPanel}
        wallBoxes={wallBoxes}
        isTeleportingToImage={isTeleportingToImage}
        onCancelCameraTarget={() => {
          cameraTarget.current = null;
          cameraLookAtTarget.current = null;
        }}
      />

      {bloomSettings?.enabled && (
        <EffectComposer disableNormalPass>
          <Bloom
            luminanceThreshold={bloomSettings?.luminanceThreshold || 1.0}
            luminanceSmoothing={bloomSettings?.luminanceSmoothing || 0.9}
            intensity={bloomSettings?.intensity || 1.5}
            mipmapBlur
          />
        </EffectComposer>
      )}
    </group>
  );
});

const Ground = ({ mode, groundRef, isReflective, groundSettings, groundSettingMode, groundTexture, hideGround = false }) => {

  const ground_Texture = useLoader(THREE.TextureLoader, groundTexture.image).clone();
  ground_Texture.wrapS = ground_Texture.wrapT = THREE.RepeatWrapping;
  ground_Texture.repeat.set(40, 40);

  const [albedoTex, normalTex, ormTex] = useTexture([
    groundTexture.alb,
    groundTexture.nor,
    groundTexture.orm,
  ]);

  const clonedAlbedo = albedoTex?.clone();
  const clonedNormal = normalTex?.clone();
  const clonedOrm = ormTex?.clone();

  [clonedAlbedo, clonedNormal, clonedOrm].forEach(tex => {
    if (tex) {
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(40, 40);
      tex.anisotropy = 16;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
    }
  });



  useEffect(() => {
    if (groundRef.current) {
      groundRef.current.layers.set(0);
      if (groundSettingMode === "preset") {
        groundRef.current.geometry.setAttribute('uv2', groundRef.current.geometry.attributes.uv);
      }
    }
  }, [groundRef, groundSettingMode]);

  if(groundSettingMode === "ground"){
    return (
        <mesh
          receiveShadow 
          ref={groundRef}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[200, 200]} />
          {hideGround ? (
            <meshBasicMaterial 
              transparent={true}
              opacity={0}
              colorWrite={false}
            />
          ) : (
            <MeshReflectorMaterial
              blur={groundSettings.blur}
              resolution={groundSettings.resolution}
              mixBlur={groundSettings.mixBlur}
              mixStrength={groundSettings.mixStrength}
              roughness={groundSettings.roughness}
              depthScale={groundSettings.depthScale}
              minDepthThreshold={groundSettings.minDepthThreshold}
              maxDepthThreshold={groundSettings.maxDepthThreshold}
              metalness={groundSettings.metalness}
              color={groundSettings.color}
            />
          )}
        </mesh>
      );
  } else if(groundSettingMode === "file"){
    return (
        <mesh
          receiveShadow 
          ref={groundRef}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[200, 200]} />
          {hideGround ? (
            <meshBasicMaterial 
              transparent={true}
              opacity={0}
              colorWrite={false}
            />
          ) : (
            <MeshReflectorMaterial
              map={ground_Texture}
              roughness={1}
              metalness={0}
            />
          )}
        </mesh>
      );
  } else if (groundSettingMode === "preset") {
    return (
      <mesh
        receiveShadow
        ref={groundRef}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[200, 200]} />
        {hideGround ? (
          <meshBasicMaterial 
            transparent={true}
            opacity={0}
            colorWrite={false}
          />
        ) : (
          <meshStandardMaterial
            map={clonedAlbedo}
            normalMap={clonedNormal}
            aoMap={clonedOrm}
            roughnessMap={clonedOrm}
            metalnessMap={clonedOrm}
            color={groundSettings.color}
          />
        )}
      </mesh>
    );
  }
}

export default Scene;