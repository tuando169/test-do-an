import meshRefs from './meshRefs';
import { TransformWidget } from './TransformWidget';
import * as THREE from 'three';
import { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { OBB } from 'three/examples/jsm/math/OBB.js';

const isValidGizmoMode = (m) =>
  m === "translate" || m === "rotate" || m === "scale";

export const PhysicPlane = ({
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
  snapEnabled,
  imageFrameId,
  showTransparentWalls,
  wallBoxes
}) => {

  const meshRef = useRef();
  const imageOBBRef = useRef(null);

  const [texture, setTexture] = useState(null);
  const [aspectRatio, setAspectRatio] = useState([1, 1]);
  const [textureReady, setTextureReady] = useState(false);

  /** Hover highlight */
  const isHoveredAndEditable =
    hoveredId === id && mode === "edit" && selectedId !== id;

  /** Edit mesh visibility */
  const shouldShowMesh = mode === "edit" && showTransparentWalls;
  const shouldEnableRaycast = shouldShowMesh;

  /** Local transform */
  const [localTransform, setLocalTransform] = useState({
    position: initialPosition,
    rotation: initialRotation,
    scale: initialScale
  });

  /** Load image + texture */
  useEffect(() => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.src = src.src;

    img.onload = () => {
      setAspectRatio([img.naturalWidth / img.naturalHeight, 1]);

      const tex = new THREE.TextureLoader().load(src.src, () => {
        tex.anisotropy = 16;
        tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
        setTexture(tex);
        setTextureReady(true);
      });
    };

    img.onerror = () => {
      console.error("Failed loading texture:", src.src);
    };
  }, [src.src]);

  /** UV fix for circular frames */
  useEffect(() => {
    if (!textureReady || !texture) return;

    // circular frames
    if (["imageFrame-5", "imageFrame-6", "imageFrame-7"].includes(imageFrameId)) {
      texture.repeat.set(1, 1);
      texture.offset.set(0, 0);
      texture.center.set(0.5, 0.5);

      if (aspectRatio[0] > 1) {
        const s = 1 / aspectRatio[0];
        texture.repeat.set(s, 1);
        texture.offset.x = (1 - s) * 0.5;
      } else if (aspectRatio[0] < 1) {
        const s = aspectRatio[0];
        texture.repeat.set(1, s);
        texture.offset.y = (1 - s) * 0.5;
      }

      texture.needsUpdate = true;
    }
  }, [aspectRatio, textureReady, imageFrameId]);

  /** Raycast enable/disable */
  useEffect(() => {
    if (!meshRef.current) return;

    meshRef.current.traverse((child) => {
      if (child.isMesh) {
        child.raycast = shouldEnableRaycast
          ? THREE.Mesh.prototype.raycast
          : () => {};
      }
    });
  }, [shouldEnableRaycast]);

  /** Register mesh for raycast picking */
  useEffect(() => {
    if (!meshRef.current) return;

    meshRef.current.traverse((child) => {
      if (child.isMesh) child.userData.id = id;
    });

    meshRefs.set(id, meshRef.current);
    return () => meshRefs.delete(id);
  }, [id, textureReady]);

  /** WORLD POSITION UPDATE EACH FRAME */
  useFrame(() => {
    if (!parentRef?.current || !meshRef.current) return;

    parentRef.current.updateMatrixWorld();

    // Local → world
    const mesh = meshRef.current;
    const p = new THREE.Vector3(...localTransform.position);
    const worldPos = p.applyMatrix4(parentRef.current.matrixWorld);

    // Rotation
    const localEuler = new THREE.Euler(
      ...localTransform.rotation.map(THREE.MathUtils.degToRad)
    );
    const localQuat = new THREE.Quaternion().setFromEuler(localEuler);

    const parentQuat = new THREE.Quaternion();
    parentRef.current.getWorldQuaternion(parentQuat);

    const worldQuat = parentQuat.multiply(localQuat);

    mesh.position.copy(worldPos);
    mesh.quaternion.copy(worldQuat);

    const uniformScale = localTransform.scale[1];
    mesh.scale.set(uniformScale, uniformScale, 1);

    if (texture && src.src.match(/\.(mp4|webm|ogg)$/i)) {
      texture.needsUpdate = true;
    }
  });

  // -----------------------------------------------------
  //  ⭐ OBB — compute from mesh (same as Wall)
  // -----------------------------------------------------
  function computeOBB(mesh) {
    mesh.updateWorldMatrix(true, true);

    const geom = mesh.geometry;
    if (!geom.boundingBox) geom.computeBoundingBox();

    const box = geom.boundingBox;
    const obb = new OBB();

    obb.center.copy(box.getCenter(new THREE.Vector3()));
    obb.halfSize.copy(box.getSize(new THREE.Vector3()).multiplyScalar(0.5));
    obb.applyMatrix4(mesh.matrixWorld);

    return obb;
  }

  /** INITIAL + FRAME OBB UPDATE */
  useEffect(() => {
    if (!meshRef.current) return;

    const mesh = meshRef.current.children[0];
    const obb = computeOBB(mesh);

    imageOBBRef.current = obb;
    if (wallBoxes) wallBoxes.set(`image-${id}`, obb);

    return () => {
      if (wallBoxes) wallBoxes.delete(`image-${id}`);
    };
  }, [textureReady, localTransform]);

  useFrame(() => {
    if (!meshRef.current) return;

    const mesh = meshRef.current.children[0];
    const obb = computeOBB(mesh);

    imageOBBRef.current = obb;
    if (wallBoxes) wallBoxes.set(`image-${id}`, obb);
  });

  /** APPLY transform from gizmo */
  const handleTransformChange = () => {
    if (!parentRef?.current || !meshRef.current) return;

    meshRef.current.updateMatrixWorld();

    const worldPos = new THREE.Vector3();
    const worldQuat = new THREE.Quaternion();
    const worldScale = new THREE.Vector3();
    meshRef.current.matrixWorld.decompose(worldPos, worldQuat, worldScale);

    // local pos
    const parentInv = new THREE.Matrix4().copy(parentRef.current.matrixWorld).invert();
    const localPos = worldPos.clone().applyMatrix4(parentInv);

    // local rotation
    const parentQuat = new THREE.Quaternion();
    parentRef.current.getWorldQuaternion(parentQuat);

    const localQuat = worldQuat.clone().multiply(parentQuat.clone().invert());
    const euler = new THREE.Euler().setFromQuaternion(localQuat);

    const uniformScale = worldScale.y;

    const newTransform = {
      position: [localPos.x, localPos.y, localPos.z],
      rotation: [
        THREE.MathUtils.radToDeg(euler.x),
        THREE.MathUtils.radToDeg(euler.y),
        THREE.MathUtils.radToDeg(euler.z)
      ],
      scale: [uniformScale, uniformScale, 1]
    };

    setLocalTransform(newTransform);
    onTransformChange?.(id, newTransform);
  };

  // ⛔ Avoid rendering before texture is ready
  if (!textureReady) return null;

  return (
    <>
      {/* Gizmo */}
      {mode === "edit" &&
        selectedId === id &&
        isValidGizmoMode(gizmoMode) && (
          <TransformWidget
            id={id}
            objectRef={meshRef}
            parentRef={parentRef}
            mode={gizmoMode}
            gizmoActive={gizmoActive}
            snapEnabled={snapEnabled}
            onTransformChange={handleTransformChange}
            space="local"

            showZ={gizmoMode !== "translate"}
            showX={gizmoMode === "translate"}
            showY={true}
          />
        )}

      {/* IMAGE MESH */}
      <group ref={meshRef}>
        <mesh
          raycast={shouldEnableRaycast ? THREE.Mesh.prototype.raycast : () => {}}
          scale={isHoveredAndEditable ? [5.01, 5.01, 5.01] : [5, 5, 5]}
        >
          <planeGeometry args={[0.5, 0.5]} />
          <meshBasicMaterial
            map={texture}
            visible={shouldShowMesh}
            color={isHoveredAndEditable ? "yellow" : "white"}
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
};
