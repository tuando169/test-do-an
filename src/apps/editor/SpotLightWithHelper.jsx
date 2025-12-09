import React, { useRef, useEffect, Fragment } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SpotLightHelper } from 'three';
import { TransformWidget } from './TransformWidget';
import meshRefs from './meshRefs';

// Chỉ 3 mode hợp lệ cho TransformControls
const isValidGizmoMode = (m) =>
  m === 'translate' || m === 'rotate' || m === 'scale';

export const SpotLightWithHelper = ({
  id,
  position = [0, 3, 5],
  rotation = [0, 0, 0], // deg
  intensity = 1,
  color = '#ffffff',
  angle = 30, // deg
  penumbra = 0.5,
  mode = 'view',
  gizmoMode,
  selectedId,
  gizmoActive,
  onTransformChange,
  setSelectedId,
  setPopupVisible,
  setPopupData,
  setPopupPosition,
}) => {
  const { scene } = useThree();
  const pivotRef = useRef();
  const lightRef = useRef();
  const helperRef = useRef();
  const targetRef = useRef();

  // Flag: có nên hiện gizmo?
  const shouldShowGizmo =
    mode === 'edit' && selectedId === id && isValidGizmoMode(gizmoMode);

  /* Gán target cho spotlight */
  useEffect(() => {
    if (lightRef.current && targetRef.current) {
      lightRef.current.target = targetRef.current;
    }
  }, []);

  /* SpotLightHelper chỉ hiện khi đang edit & selected */
  useEffect(() => {
    // cleanup cũ
    if (helperRef.current) {
      scene.remove(helperRef.current);
      helperRef.current.dispose();
      helperRef.current = null;
    }

    if (mode !== 'edit' || selectedId !== id || !lightRef.current) return;

    const helper = new SpotLightHelper(lightRef.current, new THREE.Color(color));
    scene.add(helper);
    helperRef.current = helper;

    return () => {
      if (helperRef.current) {
        scene.remove(helperRef.current);
        helperRef.current.dispose();
        helperRef.current = null;
      }
    };
  }, [mode, selectedId, id, color, scene]);

  useFrame(() => {
    helperRef.current?.update();
  });

  /* Đăng ký vào meshRefs cho raycaster */
  useEffect(() => {
    if (pivotRef.current) meshRefs.set(id, pivotRef.current);
    return () => meshRefs.delete(id);
  }, [id]);

  /* Sync props -> pivot */
  useEffect(() => {
    if (!pivotRef.current) return;
    pivotRef.current.position.set(position[0], position[1], position[2]);
    pivotRef.current.rotation.set(
      THREE.MathUtils.degToRad(rotation[0]),
      THREE.MathUtils.degToRad(rotation[1]),
      THREE.MathUtils.degToRad(rotation[2])
    );
  }, [position, rotation]);

  /* Callback cho TransformWidget */
  const handleTransform = ({ position: p, rotation: r }) => {
    // position
    let newPos = position;
    if (p) newPos = Array.isArray(p) ? p : p.toArray();

    // rotation
    let newRot = rotation;
    if (r) {
      if (Array.isArray(r)) {
        newRot = r;
      } else {
        newRot = [
          THREE.MathUtils.radToDeg(r.x),
          THREE.MathUtils.radToDeg(r.y),
          THREE.MathUtils.radToDeg(r.z),
        ];
      }
    }

    onTransformChange?.(id, { position: newPos, rotation: newRot });
  };

  return (
    <Fragment>
      {/* pivot: translate / rotate */}
      <group ref={pivotRef}>
        {/* main light */}
        <spotLight
          ref={lightRef}
          position={[0, 0, 0]}
          intensity={intensity}
          color={color}
          angle={THREE.MathUtils.degToRad(angle)}
          penumbra={penumbra}
          castShadow={false}
        />

        {/* bulb (clickable in edit) */}
        {mode === 'edit' && (
          <mesh
            userData={{ id }}
            position={[0, 0, 0]}
            scale={[2, 2, 2]}
            rotation={[Math.PI / 2, 0, 0]}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedId?.(id);
              setPopupVisible?.(true);
              setPopupPosition?.({ x: e.clientX, y: e.clientY });
              setPopupData?.({ id, type: 'spotLight' });
            }}
          >
            <coneGeometry args={[0.12, 0.3, 16]} />
            <meshBasicMaterial color={color} />
          </mesh>
        )}

        {/* target lùi 1m theo -Z */}
        <object3D ref={targetRef} position={[0, 0, -1]} />
      </group>

      {/* Gizmo: chỉ mount khi hợp lệ (tránh mode='') */}
      {shouldShowGizmo && (
        <TransformWidget
          id={id}
          objectRef={pivotRef}
          mode={gizmoMode} // luôn hợp lệ do shouldShowGizmo
          gizmoActive={gizmoActive}
          onTransformChange={handleTransform}
        />
      )}
    </Fragment>
  );
};

export default SpotLightWithHelper;
