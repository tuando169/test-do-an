import React, {
  useRef,
  Fragment,
  useMemo,
  useEffect,
} from "react";
import * as THREE from "three";
import { useLoader, useFrame } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { SkeletonUtils } from "three-stdlib";
import { TransformWidget } from "./TransformWidget";

/** chỉ cho 3 mode hợp lệ */
const isValidGizmoMode = (m) =>
  m === "translate" || m === "rotate" || m === "scale";

export const SimpleModel3D = ({
  id,
  src,

  // init transform
  position = [0, 0, 0],
  rotation = [0, 0, 0], // deg
  scale = [1, 1, 1],

  // editor state
  mode = "view",
  selectedId,
  gizmoMode,
  gizmoActive,
  snapEnabled,

  // callbacks
  setSelectedId,
  setPopupVisible,
  setPopupData,
  setPopupPosition,
  onTransformChange,
}) => {
  /** pivot cho gizmo */
  const pivotRef = useRef(null);

  /** animation */
  const mixerRef = useRef(null);

  /** load gltf */
  const gltf = useLoader(GLTFLoader, src);

  /**
   * CLONE ĐÚNG CHO MODEL CÓ ARMATURE
   */
  const modelScene = useMemo(() => {
    const cloned = SkeletonUtils.clone(gltf.scene);

    cloned.traverse((obj) => {
      obj.matrixAutoUpdate = true;

      if (obj.isMesh) {
        obj.frustumCulled = false;
        if (obj.geometry) obj.geometry = obj.geometry.clone();
        if (obj.material) obj.material = obj.material.clone();
      }
    });

    // offset group để center model (KHÔNG đụng skeleton)
    const offsetGroup = new THREE.Group();
    offsetGroup.add(cloned);

    const box = new THREE.Box3().setFromObject(cloned);
    const center = box.getCenter(new THREE.Vector3());
    offsetGroup.position.sub(center);

    return offsetGroup;
  }, [gltf.scene]);

  /**
   * INIT TRANSFORM 1 LẦN
   */
  const initedRef = useRef(false);
  useEffect(() => {
    if (!pivotRef.current || initedRef.current) return;

    pivotRef.current.position.fromArray(position);
    pivotRef.current.rotation.set(
      THREE.MathUtils.degToRad(rotation[0]),
      THREE.MathUtils.degToRad(rotation[1]),
      THREE.MathUtils.degToRad(rotation[2])
    );
    pivotRef.current.scale.fromArray(scale);
    pivotRef.current.updateMatrixWorld(true);

    initedRef.current = true;
  }, []);

  useEffect(() => {
    if (!pivotRef.current || !initedRef.current) return;

    if (gizmoActive.current) return; 

    pivotRef.current.position.fromArray(position);
    pivotRef.current.scale.fromArray(scale);
  }, [position, rotation, scale]);

  /**
   * AUTO PLAY ANIMATION (NẾU CÓ)
   */
  useEffect(() => {
    if (!gltf.animations || gltf.animations.length === 0) return;

    // gắn mixer vào cloned scene (root bên trong offsetGroup)
    const realScene = modelScene.children[0];
    const mixer = new THREE.AnimationMixer(realScene);

    const clip = gltf.animations[0]; // auto clip đầu tiên
    const action = mixer.clipAction(clip);
    action.reset();
    action.setLoop(THREE.LoopRepeat, Infinity);
    action.play();

    mixerRef.current = mixer;

    return () => {
      mixer.stopAllAction();
      mixerRef.current = null;
    };
  }, [modelScene, gltf.animations]);

  /**
   * UPDATE ANIMATION
   */
  useFrame((_, delta) => {
    mixerRef.current?.update(delta);
  });

  /**
   * gizmo
   */
  const shouldShowGizmo =
    mode === "edit" &&
    selectedId === id &&
    isValidGizmoMode(gizmoMode);

  const handleTransformCommit = ({ position, rotation, scale }) => {
  onTransformChange?.(id, {
    position,
    rotation,
    scale,
  });
};

  return (
    <Fragment>
      {shouldShowGizmo && (
        <TransformWidget
          id={id}
          objectRef={pivotRef}
          mode={gizmoMode}
          gizmoActive={gizmoActive}
          snapEnabled={snapEnabled}
          objectType="model" 
          onTransformChange={handleTransformCommit}
        />
      )}

      <group
        ref={pivotRef}
        onClick={(e) => {
          e.stopPropagation();
          if (mode !== "edit") return;

          setSelectedId?.(id);
          setPopupVisible?.(true);
          setPopupPosition?.({ x: e.clientX, y: e.clientY });
          setPopupData?.({ id, type: "model" });
        }}
      >
        <primitive object={modelScene} />
      </group>
    </Fragment>
  );
};

export default SimpleModel3D;
