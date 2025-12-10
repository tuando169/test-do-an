import { TransformWidget } from './TransformWidget';
import * as THREE from 'three';
import { useRef, useEffect } from 'react';
import meshRefs from './meshRefs';
import { useLoader } from '@react-three/fiber';

// Validate gizmo mode to prevent TransformControls errors
const isValidGizmoMode = (m) =>
  m === 'translate' || m === 'rotate' || m === 'scale';

export const SpawnMarker = ({
    id,
    position = [0, 0.2, 0],
    rotation = [0, 0, 0],
    mode,
    selectedId,
    gizmoMode,
    gizmoActive,
    hoveredId,
    snapEnabled,
    onTransformChange,
}) => {
    const ref = useRef();

    const isHoveredAndEditable = hoveredId === id && mode === 'edit' && selectedId !== id;
    const texture = useLoader(THREE.TextureLoader, '/textures/spawn.png');

    useEffect(() => {
        if (ref.current) {
            // Register the mesh in meshRefs (for hover/select detection)
            ref.current.userData.id = id;
            meshRefs.set(id, [ref.current]);
        }
        return () => {
            meshRefs.delete(id);
        };
    }, [id]);

    return (
        <>
            {mode === 'edit' && selectedId === id && isValidGizmoMode(gizmoMode) && ref.current && (
                <TransformWidget
                    id={id}
                    objectRef={ref}
                    mode={gizmoMode}
                    gizmoActive={gizmoActive}
                    snapEnabled={snapEnabled}
                    onTransformChange={(transform) => {
                        transform.position[1] = 0.2; 
                        onTransformChange(id, transform);
                    }}
                    showZ={gizmoMode === 'translate' ? true : gizmoMode === 'rotate' ? false : false}
                    showX={gizmoMode === 'rotate' ? false : gizmoMode === 'translate' ? true : true}
                    showY={gizmoMode === 'rotate' ? true : gizmoMode === 'translate' ? false : true}
                />
            )}
            <mesh
                ref={ref}
                position={position}
                rotation={[
                    THREE.MathUtils.degToRad(rotation[0]),
                    THREE.MathUtils.degToRad(rotation[1]),
                    THREE.MathUtils.degToRad(rotation[2]),
                ]}
                scale={[1.5, 1.5, 1.5]}
            >
                <circleGeometry args={[1, 32]} />
                <meshBasicMaterial
                    map={texture}
                    color={isHoveredAndEditable ? 'yellow' : 'cyan'}
                    transparent
                    opacity={0.9}
                />
            </mesh>
            
        </>
    );
};
