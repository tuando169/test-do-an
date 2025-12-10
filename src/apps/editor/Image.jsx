import meshRefs from './meshRefs';
import { TransformWidget } from './TransformWidget';
import * as THREE from 'three';
import { useRef, useEffect, useState, useMemo } from 'react';
import { useLoader, useFrame, useThree } from '@react-three/fiber';
import { buildStableBoxUVGeometry } from './uvUtils';
import { generateCircularFrameGeometry } from './components/Frames/CircularFrame.jsx';
import { generateSolidFrameGeometry } from './components/Frames/SolidFrame.jsx';

const buildLODUrl = (url, width) => {
  if (!url.includes("supabase.co")) return url;
  return `${url}&width=${width}`;
};
const LOD_LEVELS = [10, 100, 200, 500, 1024];
const isValidGizmoMode = (m) =>
  m === 'translate' || m === 'rotate' || m === 'scale';

const CanvasFrame = ({ width, height, depth = 0.01, tileSize, albedoTex, normalTex, ormTex, color }) => {
  const geometry = useMemo(
    () => buildStableBoxUVGeometry(width, height, depth, tileSize),
    [width, height, depth, tileSize]
  );

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial
        map={albedoTex}
        normalMap={normalTex}
        aoMap={ormTex}
        roughnessMap={ormTex}
        metalnessMap={ormTex}
        color={color}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};

const SolidFrame = ({ whiteFrameWidth, whiteFrameHeight, frameThickness, depth, color, albedoTex, normalTex, ormTex }) => {
  const geometry = useMemo(() => {
    return generateSolidFrameGeometry({
      whiteFrameWidth,
      whiteFrameHeight,
      frameThickness,
      depth
    });
  }, [whiteFrameWidth, whiteFrameHeight, frameThickness, depth]);

  return (
    <mesh geometry={geometry} position={[0, 0, -0.05]}>
      <meshStandardMaterial
        map={albedoTex}
        normalMap={normalTex}
        aoMap={ormTex}
        roughnessMap={ormTex}
        metalnessMap={ormTex}
        color={color}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};

const GlassFrame = ({ whiteFrameWidth, whiteFrameHeight, frameThickness, depth, color }) => {
  const geometry = useMemo(() => {
    const outerWidth = whiteFrameWidth + frameThickness * 2;
    const outerHeight = whiteFrameHeight + frameThickness * 2;

    const frameShape = new THREE.Shape();
    frameShape.moveTo(-outerWidth / 2, -outerHeight / 2);
    frameShape.lineTo(-outerWidth / 2, outerHeight / 2);
    frameShape.lineTo(outerWidth / 2, outerHeight / 2);
    frameShape.lineTo(outerWidth / 2, -outerHeight / 2);
    frameShape.lineTo(-outerWidth / 2, -outerHeight / 2);

    const hole = new THREE.Path();
    hole.moveTo(-whiteFrameWidth / 2, -whiteFrameHeight / 2);
    hole.lineTo(-whiteFrameWidth / 2, whiteFrameHeight / 2);
    hole.lineTo(whiteFrameWidth / 2, whiteFrameHeight / 2);
    hole.lineTo(whiteFrameWidth / 2, -whiteFrameHeight / 2);
    hole.lineTo(-whiteFrameWidth / 2, -whiteFrameHeight / 2);

    frameShape.holes.push(hole);

    return new THREE.ExtrudeGeometry(frameShape, { depth, bevelEnabled: false });
  }, [whiteFrameWidth, whiteFrameHeight, frameThickness, depth]);

  return (
    <mesh geometry={geometry} position={[0, 0, -0.05]}>
      <meshPhysicalMaterial
          color={color}
          transmission={1}
          opacity={0.7}
          transparent
          roughness={0.5}
          metalness={0}
          thickness={1}
          ior={1.5}
          side={THREE.DoubleSide}
        />
    </mesh>
  );
};

const CircularFrame = ({ radius, frameWidth, depth = 0.01, color, albedoTex, normalTex, ormTex, tileSize, userData, rotation = { x: 0, y: 0, z: 0 } }) => {
  const geometry = useMemo(() => {
    return generateCircularFrameGeometry({
      radius: radius + frameWidth, // Use outer radius
      frameWidth,
      depth,
      radialSegments: 64,
      rotation
    });
  }, [radius, frameWidth, depth, tileSize, rotation.x, rotation.y, rotation.z]);

  return (
    <mesh geometry={geometry} position={[0, 0, 0.0]} userData={userData}>
      <meshStandardMaterial
        map={albedoTex}
        normalMap={normalTex}
        aoMap={ormTex}
        roughnessMap={ormTex}
        metalnessMap={ormTex}
        color={color}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};

export const Image = ({
  id,
  src,
  position: initialPosition = [0, 0, 0.6],
  rotation: initialRotation = [0, 0, 0],
  scale: initialScale = [1, 1, 1],
  data,
  mode,
  selectedId,
  onTransformChange,
  gizmoActive, 
  hoveredId,
  parentRef,
  gizmoMode,
  snapEnabled,
  title,
  alt,
  imageFrameId,
  frameColor = "white",
  canvasColor = "white",
  imageFrameSrc,
  onHover,
}) => {
  const [lodLevel, setLodLevel] = useState(0);
  const [lodTextureCache] = useState(() => new Map());
  const { camera } = useThree();
  const meshRef = useRef();
  const [texture, setTexture] = useState(null);
  const [aspectRatio, setAspectRatio] = useState([1, 1]);
  const isHoveredAndEditable = hoveredId === id && mode === 'edit' && selectedId != id;
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [textureReady, setTextureReady] = useState(false);

  // hệ số scale thực tế dựa trên metadata
  const realWorldScale = useMemo(() => {
    const raw = data?.kich_thuoc_trong_khong_gian;

    if (!raw || typeof raw !== "string") return 1;

    // "CD x CR" → tách 2 phần số
    const parts = raw.split(/x|×/i).map(v => Number(v.trim()));

    if (parts.length < 2) return 1;

    const cr = parts[1]; // chỉ lấy chiều cao thực

    if (!cr || cr <= 0) return 1;

    return cr / 100; // cm → mét
  }, [data?.kich_thuoc_trong_khong_gian]);

  const tryPlay = () => {
    if (!isPlaying && videoRef.current) {
      videoRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => { });
    }
  };
  
  // Local state for the Image's transformations
  const [localTransform, setLocalTransform] = useState({
    position: initialPosition,
    rotation: initialRotation,
    scale: initialScale,
  });

  const [albedoTexWood, normalTexWood, ormTexWood] = useLoader(THREE.TextureLoader, [
    'https://nsumwobjesbawigigfwy.supabase.co/storage/v1/object/public/textures/textures/24-11-2025/cd06679f-216f-442c-a37c-c7602f7c0fe7/albedo_f6430e3d-d739-4a0c-85c0-22919eece750.png',
    'https://nsumwobjesbawigigfwy.supabase.co/storage/v1/object/public/textures/textures/24-11-2025/cd06679f-216f-442c-a37c-c7602f7c0fe7/normal_111d8330-93a2-4475-836d-04d66100dcd4.png',
    'https://nsumwobjesbawigigfwy.supabase.co/storage/v1/object/public/textures/textures/24-11-2025/cd06679f-216f-442c-a37c-c7602f7c0fe7/orm_39e38781-ffa9-4908-96f5-caedfc089b97.png',
  ]);
  [albedoTexWood, normalTexWood, ormTexWood].forEach((t) => {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = 16;
    t.minFilter = THREE.LinearMipmapLinearFilter;
    t.magFilter = THREE.LinearFilter;
  });

  const [albedoTexCanvas, normalTexCanvas, ormTexCanvas] = useLoader(THREE.TextureLoader, [
    '/textures/canvas/tex_canvas_alb.jpg',
    '/textures/canvas/tex_canvas_nor.jpg',
    '/textures/canvas/tex_canvas_orm.jpg',
  ]);
  [albedoTexCanvas, normalTexCanvas, ormTexCanvas].forEach((t) => {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = 16;
    t.minFilter = THREE.LinearMipmapLinearFilter;
    t.magFilter = THREE.LinearFilter;
  });

  useEffect(() => {
    if (src.src.match(/\.(mp4|webm|ogg)$/i)) {
      const video = document.createElement('video');
      video.src = src.src;
      video.crossOrigin = 'anonymous';
      video.loop = true;
      video.muted = true;
      video.playsInline = true;
      video.setAttribute('playsinline', '');
      video.setAttribute('webkit-playsinline', '');
      videoRef.current = video;

      tryPlay();

      const videoTexture = new THREE.VideoTexture(video);
      videoTexture.minFilter = THREE.LinearFilter;
      videoTexture.magFilter = THREE.LinearFilter;
      videoTexture.format = THREE.RGBAFormat;
      setTexture(videoTexture);

      window.addEventListener('click', tryPlay, { once: true });
      window.addEventListener('touchstart', tryPlay, { once: true });
      window.addEventListener('scroll', tryPlay, { passive: true });

      video.addEventListener('loadeddata', () => {
        if (video.videoWidth && video.videoHeight) {
          const newAspectRatio = [video.videoWidth / video.videoHeight, 1];
          setAspectRatio(newAspectRatio);
          
          // Update parent with aspectRatio immediately when video loads
          if (onTransformChange) {
            onTransformChange(id, {
              position: initialPosition,
              rotation: initialRotation,
              scale: initialScale,
              aspectRatio: newAspectRatio
            });
          }
        }
      });

      setTextureReady(true);

      return () => {
        video.pause();
        video.src = '';
        videoRef.current = null;
        videoTexture.dispose?.();
        window.removeEventListener('click', tryPlay);
        window.removeEventListener('touchstart', tryPlay);
        window.removeEventListener('scroll', tryPlay);
      };
    } else {
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      img.src = src.src;

      img.onload = () => {
        const newAspectRatio = [img.naturalWidth / img.naturalHeight, 1];
        setAspectRatio(newAspectRatio);

        const tex = new THREE.TextureLoader().load(src.src, () => {
          setTextureReady(true);
        });
        tex.anisotropy = 16;
        tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
        setTexture(tex);

        // Update parent with aspectRatio immediately when image loads
        if (onTransformChange) {
          onTransformChange(id, {
            position: initialPosition,
            rotation: initialRotation,
            scale: initialScale,
            aspectRatio: newAspectRatio
          });
        }
      };

      img.onerror = () => {
        console.error("❌ Lỗi load ảnh:", src.src);
        setTextureReady(false);
      };
    }
  }, [src.src]);

  useEffect(() => {
    if (!src?.src) return;

    const url = buildLODUrl(src.src, LOD_LEVELS[lodLevel]);

    // Cache: nếu texture LOD này đã load thì dùng luôn
    if (lodTextureCache.has(lodLevel)) {
      setTexture(lodTextureCache.get(lodLevel));
      setTextureReady(true);
      return;
    }

    // Load texture LOD mới
    const loader = new THREE.TextureLoader();
    loader.load(
      url,
      (tex) => {
        tex.anisotropy = 16;
        tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
        lodTextureCache.set(lodLevel, tex); // cache lại
        setTexture(tex);
        setTextureReady(true);
      },
      undefined,
      (err) => console.warn("LOD texture load error", err)
    );
  }, [lodLevel, src.src]);

  useEffect(() => {
    setLocalTransform({
      position: initialPosition,
      rotation: initialRotation,
      scale: initialScale,
    });
  }, [initialPosition, initialRotation, initialScale]);

  // Recalculate UVs for image textures based on frame type and aspect ratio
  useEffect(() => {
    if (!meshRef.current || !textureReady || !texture) return;

    // For circular frames, adjust texture properties to prevent stretching
    if (imageFrameId === "imageFrame-5" || imageFrameId === "imageFrame-6" || 
        imageFrameId === "imageFrame-7") {
      
      // Reset texture transforms first
      texture.repeat.set(1, 1);
      texture.offset.set(0, 0);
      texture.center.set(0.5, 0.5);
      
      // Apply consistent aspect ratio correction for circular frames
      if (aspectRatio[0] > 1) {
        // Landscape image - scale down horizontally to prevent stretching
        const scale = 1 / aspectRatio[0];
        texture.repeat.set(scale, 1);
        texture.offset.set((1 - scale) * 0.5, 0);
      } else if (aspectRatio[0] < 1) {
        // Portrait image - scale down vertically to prevent stretching
        const scale = aspectRatio[0];
        texture.repeat.set(1, scale);
        texture.offset.set(0, (1 - scale) * 0.5);
      }
      
      texture.needsUpdate = true;
    }
    
  }, [aspectRatio, imageFrameId, textureReady, texture]);

  // Create custom geometries for frames outside of conditional rendering to avoid hooks violations
  const canvasGeometryFrame6 = useMemo(() => {
    const g = new THREE.CylinderGeometry(0.5, 0.5, 0.002, 64);
    
    // Proper UV mapping for cylinder geometry
    const positionAttribute = g.attributes.position;
    const normalAttribute = g.attributes.normal;
    const uv = [];
    
    for (let i = 0; i < positionAttribute.count; i++) {
      const x = positionAttribute.getX(i);
      const y = positionAttribute.getY(i);
      const z = positionAttribute.getZ(i);
      
      const nx = normalAttribute.getX(i);
      const ny = normalAttribute.getY(i);
      const nz = normalAttribute.getZ(i);
      
      // Determine if this is a top/bottom face or side face
      if (Math.abs(ny) > 0.9) {
        // Top/bottom faces (Y normal in cylinder coords) - use radial mapping
        const u = (x + 0.5) / 1.0;
        const v = (z + 0.5) / 1.0;
        uv.push(u, v);
      } else {
        // Side faces - use proper cylindrical mapping
        const angle = Math.atan2(z, x);
        const u = (angle + Math.PI) / (2 * Math.PI);
        const v = (y + 0.001) / 0.002;
        uv.push(u, v);
      }
    }
    
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setAttribute('uv2', new THREE.Float32BufferAttribute(uv.slice(), 2));
    return g;
  }, []);

  const canvasGeometryFrame7 = useMemo(() => {
    const g = new THREE.CylinderGeometry(0.6, 0.6, 0.015, 64);
    
    // Proper UV mapping for cylinder geometry
    const positionAttribute = g.attributes.position;
    const normalAttribute = g.attributes.normal;
    const uv = [];
    
    for (let i = 0; i < positionAttribute.count; i++) {
      const x = positionAttribute.getX(i);
      const y = positionAttribute.getY(i);
      const z = positionAttribute.getZ(i);
      
      const nx = normalAttribute.getX(i);
      const ny = normalAttribute.getY(i);
      const nz = normalAttribute.getZ(i);
      
      // Determine if this is a top/bottom face or side face
      if (Math.abs(ny) > 0.9) {
        // Top/bottom faces (Y normal in cylinder coords) - use radial mapping
        const u = (x + 0.6) / 1.2;
        const v = (z + 0.6) / 1.2;
        uv.push(u, v);
      } else {
        // Side faces - use proper cylindrical mapping
        const angle = Math.atan2(z, x);
        const u = (angle + Math.PI) / (2 * Math.PI);
        const v = (y + 0.0075) / 0.015;
        uv.push(u, v);
      }
    }
    
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setAttribute('uv2', new THREE.Float32BufferAttribute(uv.slice(), 2));
    return g;
  }, []);

  // Register the mesh in the global meshRefs
  useEffect(() => {
    if (!meshRef.current) return;
    meshRef.current.traverse((child) => {
      if (child && child.isMesh) {
        child.userData.id = id;
      }
    });
    // Cập nhật refs cho raycaster
    meshRefs.set(id, meshRef.current);
    return () => {
      meshRefs.delete(id);
    };
  }, [id, imageFrameId, src.src, textureReady]);

  // Update the Image's position, rotation, and scale relative to the parent
  useFrame(() => {
    if (!parentRef?.current || !meshRef.current) return;

    // Update parent's world matrix
    parentRef.current.updateMatrixWorld();

    // Calculate world position
    const localPosition = new THREE.Vector3(...localTransform.position);
    const worldPosition = localPosition.applyMatrix4(parentRef.current.matrixWorld);

    // Calculate world rotation
    const localEuler = new THREE.Euler(...localTransform.rotation.map(THREE.MathUtils.degToRad));
    const localQuaternion = new THREE.Quaternion().setFromEuler(localEuler);
    const parentQuaternion = new THREE.Quaternion();
    parentRef.current.getWorldQuaternion(parentQuaternion);
    const worldQuaternion = localQuaternion.multiply(parentQuaternion);

    // Apply transforms to mesh
    const uniformScale = localTransform.scale[1] * realWorldScale;
    meshRef.current.position.copy(worldPosition);
    meshRef.current.quaternion.copy(worldQuaternion);
    meshRef.current.scale.set(uniformScale, uniformScale, 1);
    if (src.src.match(/\.(mp4|webm|ogg)$/i) && texture) {
      texture.needsUpdate = true;
    }
    if (meshRef.current) {
      const dist = camera.position.distanceTo(meshRef.current.getWorldPosition(new THREE.Vector3()));

      let newLOD = 0;

      if (dist < 2) newLOD = 4;       
      else if (dist < 4) newLOD = 3; 
      else if (dist < 8) newLOD = 2;  
      else if (dist < 12) newLOD = 1; 
      else newLOD = 0;               

      if (newLOD !== lodLevel) {
        setLodLevel(newLOD);
      }
    }
  });

  const handleTransformChange = () => {
    if (!parentRef?.current || !meshRef.current) return;

    // Update parent's world matrix
    parentRef.current.updateMatrixWorld();

    // Get mesh's world position, quaternion, and scale
    meshRef.current.updateMatrixWorld();
    const worldPosition = new THREE.Vector3();
    const worldQuaternion = new THREE.Quaternion();
    const worldScale = new THREE.Vector3();
    meshRef.current.matrixWorld.decompose(worldPosition, worldQuaternion, worldScale);

    // Get parent's inverse world matrix
    const parentInverse = new THREE.Matrix4().copy(parentRef.current.matrixWorld).invert();

    // Calculate local position
    const localPosition = worldPosition.clone().applyMatrix4(parentInverse);

    // Calculate local rotation
    const parentQuaternion = new THREE.Quaternion();
    parentRef.current.getWorldQuaternion(parentQuaternion);
    const localQuaternion = worldQuaternion.clone().multiply(parentQuaternion.clone().invert());
    const localEuler = new THREE.Euler().setFromQuaternion(localQuaternion);
    const logicScale = worldScale.y / realWorldScale;

    const newTransform = {
      position: [localPosition.x, localPosition.y, localPosition.z],
      rotation: [
        THREE.MathUtils.radToDeg(localEuler.x),
        THREE.MathUtils.radToDeg(localEuler.y),
        THREE.MathUtils.radToDeg(localEuler.z)
      ],
      scale: [logicScale, logicScale, 1],
      aspectRatio: aspectRatio // Include aspectRatio in transform updates
    };

    setLocalTransform(newTransform);
    if (onTransformChange) {
      onTransformChange(id, newTransform);
    }
  };
  if(textureReady){
    if(src.src === imageFrameSrc){
      return (
        <>
          {mode === 'edit' && selectedId === id && isValidGizmoMode(gizmoMode) && (
            <TransformWidget
              id={id}
              objectRef={meshRef}
              mode={gizmoMode}
              gizmoActive={gizmoActive}
              parentRef={parentRef}
              snapEnabled={snapEnabled}
              onTransformChange={handleTransformChange}
              space="local"
              translationSnap={null}
              // Enable position and Y,Z rotation, disable X rotation
              showZ={true}
              showX={gizmoMode === 'rotate' ? false : true}
              showY={true}
            />
          )}
          <group ref={meshRef} key={`${id}-${imageFrameId}-${src.src}`}>
            <mesh 
              position={[0, 0, 0]}
              scale={isHoveredAndEditable ? [2.01, 2.01, 2.01] : [2, 2, 2] }
              onPointerEnter={(e) => {
                onHover?.({
                  visible: true,
                  x: e.clientX + 12,
                  y: e.clientY + 12,
                  title,
                  alt,
                });
              }}
              onPointerMove={(e) => {
                onHover?.({
                  visible: true,
                  x: e.clientX + 12,
                  y: e.clientY + 12,
                  title,
                  alt,
                });
              }}
              onPointerLeave={() => {
                onHover?.({
                  visible: false,
                  x: 0,
                  y: 0,
                  title: "",
                  alt: "",
                });
              }}
            >
              <planeGeometry args={[0.5, 0.5]} />
              <meshBasicMaterial
                map={textureReady ? texture : null}
                color={textureReady ? (isHoveredAndEditable ? 'yellow' : 'white') : '#999'} // fallback xám
                transparent
                alphaTest={0.1}
                toneMapped={false}
                polygonOffset
                polygonOffsetFactor={-1}
                polygonOffsetUnits={-1}
              />
            </mesh>
          </group>
        </>
      );
    } else{
        return (
        <>
          {mode === 'edit' && selectedId === id && isValidGizmoMode(gizmoMode) && (
            <TransformWidget
              id={id}
              objectRef={meshRef}
              mode={gizmoMode}
              gizmoActive={gizmoActive}
              parentRef={parentRef}
              snapEnabled={snapEnabled}
              onTransformChange={handleTransformChange}
              space="local"
              translationSnap={null}
              // Enable position and Y,Z rotation, disable X rotation
              showZ={true}
              showX={gizmoMode === 'rotate' ? false : true}
              showY={true}
            />
          )}
          {imageFrameId === "imageFrame-0" && (
            <group ref={meshRef} key={`${id}-${imageFrameId}-${src.src}`}>
              <mesh 
                position={[0, 0, 0]}
                scale={[1, 1, 1]}
                onPointerEnter={(e) => {
                  onHover?.({
                    visible: true,
                    x: e.clientX + 12,
                    y: e.clientY + 12,
                    title,
                    alt,
                  });
                }}
                onPointerMove={(e) => {
                  onHover?.({
                    visible: true,
                    x: e.clientX + 12,
                    y: e.clientY + 12,
                    title,
                    alt,
                  });
                }}
                onPointerLeave={() => {
                  onHover?.({
                    visible: false,
                    x: 0,
                    y: 0,
                    title: "",
                    alt: "",
                  });
                }}
              >
                <planeGeometry args={[aspectRatio[0], 1]} />
                <meshBasicMaterial
                  map={textureReady ? texture : null}
                  color={isHoveredAndEditable ? 'yellow' : 'white'}
                  transparent
                  alphaTest={0.1}
                  toneMapped={false}
                  polygonOffset={true}
                  polygonOffsetFactor={-1}
                  polygonOffsetUnits={-1}
                />
              </mesh>
            </group>
          )}
          {imageFrameId === "imageFrame-1" && (
            <group ref={meshRef} key={`${id}-${imageFrameId}-${src.src}`}>
              <CanvasFrame
                width={aspectRatio[0]}
                height={aspectRatio[1]}
                depth={0.05}
                color={isHoveredAndEditable ? 'yellow' : "white"}
                tileSize={0.5}
                albedoTex={albedoTexCanvas}
                normalTex={normalTexCanvas}
                ormTex={ormTexCanvas}
              />
              <mesh 
                position={[0, 0, 0.026]} // Half of depth (0.05/2) + small offset
                scale={[1, 1, 1]}
                onPointerEnter={(e) => {
                  onHover?.({
                    visible: true,
                    x: e.clientX + 12,
                    y: e.clientY + 12,
                    title,
                    alt,
                  });
                }}
                onPointerMove={(e) => {
                  onHover?.({
                    visible: true,
                    x: e.clientX + 12,
                    y: e.clientY + 12,
                    title,
                    alt,
                  });
                }}
                onPointerLeave={() => {
                  onHover?.({
                    visible: false,
                    x: 0,
                    y: 0,
                    title: "",
                    alt: "",
                  });
                }}
              >
                <planeGeometry args={[aspectRatio[0], 1]} />
                <meshBasicMaterial
                  map={textureReady ? texture : null}
                  color={isHoveredAndEditable ? 'yellow' : 'white'}
                  transparent
                  alphaTest={0.1}
                  toneMapped={false}
                />
              </mesh>
            </group>
          )}
          {imageFrameId === "imageFrame-2" && (
            <group ref={meshRef} key={`${id}-${imageFrameId}-${src.src}`}>
              <CanvasFrame
                width={aspectRatio[0] + 0.2}
                height={aspectRatio[1] + 0.2}
                depth={0.05}
                color={isHoveredAndEditable ? 'yellow' : "white"}
                tileSize={0.5}
                albedoTex={albedoTexCanvas}
                normalTex={normalTexCanvas}
                ormTex={ormTexCanvas}
              />
              <mesh 
                position={[0, 0, 0.026]} // Half of depth (0.05/2) + small offset
                scale={[1, 1, 1]}
                onPointerEnter={(e) => {
                  onHover?.({
                    visible: true,
                    x: e.clientX + 12,
                    y: e.clientY + 12,
                    title,
                    alt,
                  });
                }}
                onPointerMove={(e) => {
                  onHover?.({
                    visible: true,
                    x: e.clientX + 12,
                    y: e.clientY + 12,
                    title,
                    alt,
                  });
                }}
                onPointerLeave={() => {
                  onHover?.({
                    visible: false,
                    x: 0,
                    y: 0,
                    title: "",
                    alt: "",
                  });
                }}
              >
                <planeGeometry args={[aspectRatio[0], 1]} />
                <meshBasicMaterial
                  map={textureReady ? texture : null}
                  color={isHoveredAndEditable ? 'yellow' : 'white'}
                  transparent
                  alphaTest={0.1}
                  toneMapped={false}
                />
              </mesh>
            </group>
          )}
          {imageFrameId === "imageFrame-3" && (
            <group ref={meshRef} key={`${id}-${imageFrameId}-${src.src}`}>
              <SolidFrame
                whiteFrameWidth={aspectRatio[0] + 0.4} 
                whiteFrameHeight={aspectRatio[1] + 0.4}
                frameThickness={0.05} 
                depth={0.05} 
                color={isHoveredAndEditable ? 'yellow' : frameColor}
                albedoTex={albedoTexWood}
                normalTex={normalTexWood}
                ormTex={ormTexWood}
                tileSize = {10}
              />
              <mesh position={[0, 0, -0.04]}>
                <boxGeometry args={[aspectRatio[0] + 0.4, aspectRatio[1] +0.4, 0.01]} />
                <meshStandardMaterial color={isHoveredAndEditable ? 'yellow' : canvasColor} />
              </mesh>
              <mesh 
                position={[0, 0, -0.03]}
                scale={[1, 1, 1]}
                onPointerEnter={(e) => {
                  onHover?.({
                    visible: true,
                    x: e.clientX + 12,
                    y: e.clientY + 12,
                    title,
                    alt,
                  });
                }}
                onPointerMove={(e) => {
                  onHover?.({
                    visible: true,
                    x: e.clientX + 12,
                    y: e.clientY + 12,
                    title,
                    alt,
                  });
                }}
                onPointerLeave={() => {
                  onHover?.({
                    visible: false,
                    x: 0,
                    y: 0,
                    title: "",
                    alt: "",
                  });
                }}
              >
                <planeGeometry args={[aspectRatio[0], 1]} />
                <meshBasicMaterial
                  map={textureReady ? texture : null}
                  color={isHoveredAndEditable ? 'yellow' : 'white'}
                  transparent
                  alphaTest={0.1}
                  toneMapped={false}
                />
              </mesh>
            </group>
          )}
          {imageFrameId === "imageFrame-4" && (
            <group ref={meshRef} key={`${id}-${imageFrameId}-${src.src}`}>
              <GlassFrame
                whiteFrameWidth={aspectRatio[0] + 0.3} 
                whiteFrameHeight={aspectRatio[1] + 0.3}
                frameThickness={0.05} 
                depth={0.2} 
                color={isHoveredAndEditable ? 'yellow' : '#6F9AB0'}
              />
              <mesh>
                <boxGeometry args={[aspectRatio[0]+ 0.1, aspectRatio[1] +0.1, 0.1]} />
                <meshPhysicalMaterial
                  color={"#6F9AB0"}
                  transmission={1}
                  opacity={0.7}
                  transparent
                  roughness={0}
                  metalness={0}
                  thickness={1}
                  ior={1.5}
                />
              </mesh>
              <mesh 
                position={[0, 0, 0.051]}
                scale={[1, 1, 1]}
                onPointerEnter={(e) => {
                  onHover?.({
                    visible: true,
                    x: e.clientX + 12,
                    y: e.clientY + 12,
                    title,
                    alt,
                  });
                }}
                onPointerMove={(e) => {
                  onHover?.({
                    visible: true,
                    x: e.clientX + 12,
                    y: e.clientY + 12,
                    title,
                    alt,
                  });
                }}
                onPointerLeave={() => {
                  onHover?.({
                    visible: false,
                    x: 0,
                    y: 0,
                    title: "",
                    alt: "",
                  });
                }}
              >
                <planeGeometry args={[aspectRatio[0], 1]} />
                <meshBasicMaterial
                  map={textureReady ? texture : null}
                  color={isHoveredAndEditable ? 'yellow' : 'white'}
                  transparent
                  alphaTest={0.1}
                  toneMapped={false}
                />
              </mesh>
            </group>
          )}
          {imageFrameId === "imageFrame-5" && (
            <group ref={meshRef} key={`${id}-${imageFrameId}-${src.src}`}>
              <mesh
                position={[0, 0, -0.025]} // White background circle behind the image
                rotation={[Math.PI / 2, 0, 0]} // Rotate 90 degrees to face upward
                userData={{ id: id }} // Associate with the image ID
                onPointerDown={(e) => e.stopPropagation()} // Prevent interference with selection
              >
                <cylinderGeometry args={[0.5, 0.5, 0.05, 64]} />
                <meshBasicMaterial
                  color="white"
                  side={THREE.DoubleSide}
                />
              </mesh>
              <mesh 
                position={[0, 0, 0.001]} // Move image slightly forward
                userData={{ id: id }}
                onPointerEnter={(e) => {
                  onHover?.({
                    visible: true,
                    x: e.clientX + 12,
                    y: e.clientY + 12,
                    title,
                    alt,
                  });
                }}
                onPointerMove={(e) => {
                  onHover?.({
                    visible: true,
                    x: e.clientX + 12,
                    y: e.clientY + 12,
                    title,
                    alt,
                  });
                }}
                onPointerLeave={() => {
                  onHover?.({
                    visible: false,
                    x: 0,
                    y: 0,
                    title: "",
                    alt: "",
                  });
                }}
              >
                <circleGeometry args={[0.5, 64]} />
                <meshBasicMaterial
                  map={textureReady ? texture : null}
                  color={isHoveredAndEditable ? 'yellow' : 'white'}
                  transparent
                  alphaTest={0.1}
                  toneMapped={false}
                />
              </mesh>
            </group>
          )}
          {imageFrameId === "imageFrame-6" && (
            <group ref={meshRef} key={`${id}-${imageFrameId}-${src.src}`}>
              <CircularFrame
                radius={0.5}
                frameWidth={0.05}
                depth={0.05}
                tileSize={10}
                albedoTex={albedoTexWood}
                normalTex={normalTexWood}
                ormTex={ormTexWood}
                color={isHoveredAndEditable ? 'yellow' : frameColor}
                userData={{ id: id }}
                rotation={{ x: Math.PI / 2 }} // 90 degrees clockwise around X-axis
              />
              <mesh userData={{ id: id }} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.04]} geometry={canvasGeometryFrame6}>
                <meshStandardMaterial 
                  map={albedoTexCanvas}
                  normalMap={normalTexCanvas}
                  aoMap={ormTexCanvas}
                  roughnessMap={ormTexCanvas}
                  metalnessMap={ormTexCanvas}
                  color={isHoveredAndEditable ? 'yellow' : canvasColor} 
                />
              </mesh>
              <mesh 
                position={[0, 0, -0.03]}
                userData={{ id: id }}
                onPointerEnter={(e) => {
                  onHover?.({
                    visible: true,
                    x: e.clientX + 12,
                    y: e.clientY + 12,
                    title,
                    alt,
                  });
                }}
                onPointerMove={(e) => {
                  onHover?.({
                    visible: true,
                    x: e.clientX + 12,
                    y: e.clientY + 12,
                    title,
                    alt,
                  });
                }}
                onPointerLeave={() => {
                  onHover?.({
                    visible: false,
                    x: 0,
                    y: 0,
                    title: "",
                    alt: "",
                  });
                }}
              >
                <circleGeometry args={[0.5, 64]} />
                <meshBasicMaterial
                  map={textureReady ? texture : null}
                  color={isHoveredAndEditable ? 'yellow' : 'white'}
                  transparent
                  alphaTest={0.1}
                  toneMapped={false}
                />
              </mesh>
            </group>
          )}
          {imageFrameId === "imageFrame-7" && (
            <group ref={meshRef} key={`${id}-${imageFrameId}-${src.src}`}>
              <CircularFrame
                radius={0.6}
                frameWidth={0.05}
                depth={0.05}
                tileSize={10}
                albedoTex={albedoTexWood}
                normalTex={normalTexWood}
                ormTex={ormTexWood}
                color={isHoveredAndEditable ? 'yellow' : frameColor}
                userData={{ id: id }}
                rotation={{ x: Math.PI / 2 }} // 90 degrees clockwise around X-axis
              />
              <mesh userData={{ id: id }} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.04]} geometry={canvasGeometryFrame7}>
                <meshStandardMaterial 
                  map={albedoTexCanvas}
                  normalMap={normalTexCanvas}
                  aoMap={ormTexCanvas}
                  roughnessMap={ormTexCanvas}
                  metalnessMap={ormTexCanvas}
                  color={isHoveredAndEditable ? 'yellow' : canvasColor} 
                />
              </mesh>
              <mesh 
                position={[0, 0, -0.03]}
                userData={{ id: id }}
                onPointerEnter={(e) => {
                  onHover?.({
                    visible: true,
                    x: e.clientX + 12,
                    y: e.clientY + 12,
                    title,
                    alt,
                  });
                }}
                onPointerMove={(e) => {
                  onHover?.({
                    visible: true,
                    x: e.clientX + 12,
                    y: e.clientY + 12,
                    title,
                    alt,
                  });
                }}
                onPointerLeave={() => {
                  onHover?.({
                    visible: false,
                    x: 0,
                    y: 0,
                    title: "",
                    alt: "",
                  });
                }}
              >
                <circleGeometry args={[0.5, 64]} />
                <meshBasicMaterial
                  map={textureReady ? texture : null}
                  color={isHoveredAndEditable ? 'yellow' : 'white'}
                  transparent
                  alphaTest={0.1}
                  toneMapped={false}
                />
              </mesh>
            </group>
          )}
        </>
      );
    }
  }
};

const degToRad = (degrees) => degrees.map((deg) => THREE.MathUtils.degToRad(deg));