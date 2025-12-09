import meshRefs from './meshRefs';
import { TransformWidget } from './TransformWidget';
import * as THREE from 'three';
import { useRef, useEffect, useState, useMemo } from 'react';
import { useLoader, useFrame } from '@react-three/fiber';
import { buildStableBoxUVGeometry, buildStablePlaneUVGeometry } from './uvUtils';

const isValidGizmoMode = (m) =>
  m === 'translate' || m === 'rotate' || m === 'scale';

const CanvasFrame = ({ width, height, depth = 0.01, tileSize, albedoTex, normalTex, ormTex, color }) => {

  const TILE_SIZE = tileSize;

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

const SolidFrame = ({ whiteFrameWidth, whiteFrameHeight, frameThickness, depth, color, albedoTex, normalTex, ormTex, tileSize }) => {
  const TILE_SIZE = tileSize;

  const geometry = useMemo(() => {
    const outerWidth = whiteFrameWidth + frameThickness * 2;
    const outerHeight = whiteFrameHeight + frameThickness * 2;
    const shape = new THREE.Shape()
      .moveTo(-outerWidth/2, -outerHeight/2)
      .lineTo(-outerWidth/2, outerHeight/2)
      .lineTo(outerWidth/2, outerHeight/2)
      .lineTo(outerWidth/2, -outerHeight/2)
      .lineTo(-outerWidth/2, -outerHeight/2);
    const hole = new THREE.Path()
      .moveTo(-whiteFrameWidth/2, -whiteFrameHeight/2)
      .lineTo(-whiteFrameWidth/2, whiteFrameHeight/2)
      .lineTo(whiteFrameWidth/2, whiteFrameHeight/2)
      .lineTo(whiteFrameWidth/2, -whiteFrameHeight/2)
      .lineTo(-whiteFrameWidth/2, -whiteFrameHeight/2);
    shape.holes.push(hole);
    const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false });
    g.computeBoundingBox();
    const min = g.boundingBox.min, max = g.boundingBox.max;
    const uv = [];
    for (let i = 0; i < g.attributes.position.count; i++) {
      const x = g.attributes.position.getX(i);
      const y = g.attributes.position.getY(i);
      uv.push((x - min.x) / tileSize, (y - min.y) / tileSize);
    }
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    return g;
  }, [whiteFrameWidth, whiteFrameHeight, frameThickness, depth, tileSize]);

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

export const Image = ({
  id,
  src,
  position: initialPosition = [0, 0, 0.6],
  rotation: initialRotation = [0, 0, 0],
  scale: initialScale = [1, 1, 1],
  mode,
  selectedId,
  onTransformChange,
  gizmoActive, 
  hoveredId,
  parentRef,
  gizmoMode,
  title,
  alt,
  imageFrameId,
  frameColor = "white",
  imageFrameSrc,
  onHover,
}) => {
  const meshRef = useRef();
  const [texture, setTexture] = useState(null);
  const [aspectRatio, setAspectRatio] = useState([1, 1]);
  const isHoveredAndEditable = hoveredId === id && mode === 'edit' && selectedId != id;
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [textureReady, setTextureReady] = useState(false);

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
    '/textures/wood/tex_wood_alb.jpg',
    '/textures/wood/tex_wood_nor.jpg',
    '/textures/wood/tex_wood_orm.jpg',
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
          setAspectRatio([video.videoWidth / video.videoHeight, 1]);
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
        setAspectRatio([img.naturalWidth / img.naturalHeight, 1]);

        const tex = new THREE.TextureLoader().load(src.src, () => {
          setTextureReady(true);
        });
        tex.anisotropy = 16;
        tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
        setTexture(tex);
      };

      img.onerror = () => {
        console.error("❌ Lỗi load ảnh:", src.src);
        setTextureReady(false);
      };
    }
  }, [src.src]);

  useEffect(() => {
    setLocalTransform({
      position: initialPosition,
      rotation: initialRotation,
      scale: initialScale,
    });
  }, [initialPosition, initialRotation, initialScale]);

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
    const uniformScale = localTransform.scale[1];
    meshRef.current.position.copy(worldPosition);
    meshRef.current.quaternion.copy(worldQuaternion);
    meshRef.current.scale.set(uniformScale, uniformScale, 1);
    if (src.src.match(/\.(mp4|webm|ogg)$/i) && texture) {
      texture.needsUpdate = true;
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
    const uniformScale = worldScale.y;

    const newTransform = {
      position: [localPosition.x, localPosition.y, localPosition.z],
      rotation: [
        THREE.MathUtils.radToDeg(localEuler.x),
        THREE.MathUtils.radToDeg(localEuler.y),
        THREE.MathUtils.radToDeg(localEuler.z)
      ],
      scale: [uniformScale, uniformScale, 1]
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
              onTransformChange={handleTransformChange}
              space="local"
              translationSnap={null}
              // tuỳ theo mode thì ẩn các trục không cần thiết
              showZ={gizmoMode === 'translate' ? false : gizmoMode === 'rotate' ? true : false}
              showX={gizmoMode === 'rotate' ? false : gizmoMode === 'scale' ? false : true}
              showY={gizmoMode === 'rotate' ? false : true}
            />
          )}
          <group ref={meshRef} key={`${id}-${imageFrameId}-${src.src}`}>
            <mesh 
              position={[0, 0, 0]}
              scale={isHoveredAndEditable ? [5.01, 5.01, 5.01] : [5, 5, 5] }
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
              onTransformChange={handleTransformChange}
              space="local"
              translationSnap={null}
              // tuỳ theo mode thì ẩn các trục không cần thiết
              showZ={gizmoMode === 'translate' ? false : gizmoMode === 'rotate' ? true : false}
              showX={gizmoMode === 'rotate' ? false : gizmoMode === 'scale' ? false : true}
              showY={gizmoMode === 'rotate' ? false : true}
            />
          )}
          {imageFrameId === "imageFrame-1" && (
            <group ref={meshRef} key={`${id}-${imageFrameId}-${src.src}`}>
              <mesh
                position={[0, 0, -0.05]} // Slightly behind the image plane, in front of the box
                renderOrder={-1}
              >
                <planeGeometry args={[aspectRatio[0] + 0.02, aspectRatio[1] + 0.02]} />
                <meshStandardMaterial
                  color="black"
                  opacity={0.18}
                  transparent 
                  depthWrite={false}
                  roughness={1}
                  metalness={0}
                />
              </mesh>
              <CanvasFrame
                width={aspectRatio[0]}
                height={aspectRatio[1]}
                depth={0.1}
                color={isHoveredAndEditable ? 'yellow' : "white"}
                tileSize={0.5}
                albedoTex={albedoTexCanvas}
                normalTex={normalTexCanvas}
                ormTex={ormTexCanvas}
              />
              <mesh 
                position={[0, 0, 0.06]}
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
                  toneMapped={false}
                  polygonOffset={true}
                  polygonOffsetFactor={-1}
                  polygonOffsetUnits={-1}
                />
              </mesh>
            </group>
          )}
          {imageFrameId === "imageFrame-2" && (
            <group ref={meshRef} key={`${id}-${imageFrameId}-${src.src}`}>
              <mesh
                position={[0, 0, -0.05]} // Slightly behind the image plane, in front of the box
                renderOrder={-1}
              >
                <planeGeometry args={[aspectRatio[0] + 0.02, aspectRatio[1] + 0.02]} />
                <meshStandardMaterial
                  color="black"
                  opacity={0.18}
                  transparent 
                  depthWrite={false}
                  roughness={1}
                  metalness={0}
                />
              </mesh>
              <CanvasFrame
                width={aspectRatio[0] + 0.2}
                height={aspectRatio[1] + 0.2}
                depth={0.1}
                color={isHoveredAndEditable ? 'yellow' : "white"}
                tileSize={0.5}
                albedoTex={albedoTexCanvas}
                normalTex={normalTexCanvas}
                ormTex={ormTexCanvas}
              />
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
                depth={0.12} 
                color={isHoveredAndEditable ? 'yellow' : frameColor}
                albedoTex={albedoTexWood}
                normalTex={normalTexWood}
                ormTex={ormTexWood}
                tileSize = {10}
              />
              <mesh
                position={[0, 0, -0.05]} // Slightly behind the image plane, in front of the box
                renderOrder={-1}
              >
                <planeGeometry args={[aspectRatio[0] + 0.02, aspectRatio[1] + 0.02]} />
                <meshStandardMaterial
                  color="black"
                  opacity={0.18}
                  transparent
                  depthWrite={false}
                  roughness={1}
                  metalness={0}
                />
              </mesh>
              <mesh>
                <boxGeometry args={[aspectRatio[0] + 0.4, aspectRatio[1] +0.4, 0.01]} />
                <meshStandardMaterial color={isHoveredAndEditable ? 'yellow' : 'white'} />
              </mesh>
              <mesh 
                position={[0, 0, 0.02]}
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