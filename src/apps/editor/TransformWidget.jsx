import React, { useRef, useEffect } from 'react';
import { TransformControls } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

export const TransformWidget = ({
  id,
  objectRef,
  parentRef,
  mode = 'translate',
  gizmoActive,
  onTransformChange,
  translationSnap = 0.25,
  rotationSnap = 15,
  scaleSnap = 0.125,
  space = 'world',
  showX = true,
  showY = true,
  showZ = true,
}) => {
  const transformRef = useRef();
  const { camera, gl } = useThree();
  const suppressNextClick = useRef(false);

  useEffect(() => {
    if (transformRef.current && objectRef?.current) {
      const controls = transformRef.current;

      try {
        // Set snapping values
        controls.setTranslationSnap(translationSnap);
        controls.setRotationSnap(THREE.MathUtils.degToRad(rotationSnap));
        controls.setScaleSnap(scaleSnap);
      } catch (error) {
        console.warn('Error setting TransformControls snap values:', error);
        return;
      }

      const handleDraggingChanged = (e) => {
        gizmoActive.current = e.value;
        document.body.style.cursor = e.value ? 'grab' : 'default';
        if (!e.value) {
          // Set flag to suppress the next click
          suppressNextClick.current = true;
        }
      };

      // Listen for click on the canvas and suppress if needed
      const suppressEvent = (event) => {
        if (suppressNextClick.current) {
          event.stopPropagation();
          event.preventDefault();
          suppressNextClick.current = false;
        }
      };

      const handleObjectChange = () => {
        if (onTransformChange && objectRef.current) {
          // Get the world position, rotation, and scale
          const worldPosition = new THREE.Vector3();
          const worldQuaternion = new THREE.Quaternion();
          const worldScale = new THREE.Vector3();
          objectRef.current.updateMatrixWorld();
          objectRef.current.matrixWorld.decompose(worldPosition, worldQuaternion, worldScale);

          // Convert world transformations to local transformations relative to the parent
          if (parentRef?.current) {
            const parentInverseMatrix = new THREE.Matrix4().copy(parentRef.current.matrixWorld).invert();
            const localMatrix = new THREE.Matrix4().compose(worldPosition, worldQuaternion, worldScale).premultiply(parentInverseMatrix);

            const localPosition = new THREE.Vector3();
            const localQuaternion = new THREE.Quaternion();
            const localScale = new THREE.Vector3();
            localMatrix.decompose(localPosition, localQuaternion, localScale);

            // Notify the parent of the local transformations
            onTransformChange({
              position: localPosition.toArray(),
              rotation: [
                THREE.MathUtils.radToDeg(localQuaternion.x),
                THREE.MathUtils.radToDeg(localQuaternion.y),
                THREE.MathUtils.radToDeg(localQuaternion.z),
              ],
              scale: localScale.toArray(),
            });
          } else {
            // If no parent, use world transformations directly
            onTransformChange({
              position: worldPosition.toArray(),
              rotation: [
                THREE.MathUtils.radToDeg(objectRef.current.rotation.x),
                THREE.MathUtils.radToDeg(objectRef.current.rotation.y),
                THREE.MathUtils.radToDeg(objectRef.current.rotation.z),
              ],
              scale: objectRef.current.scale.toArray(),
            });
          }
        }
      };

      controls.addEventListener('dragging-changed', handleDraggingChanged);
      controls.addEventListener('objectChange', handleObjectChange);
      gl.domElement.addEventListener('pointerdown', suppressEvent, true);
      gl.domElement.addEventListener('click', suppressEvent, true);

      return () => {
        try {
          controls.removeEventListener('dragging-changed', handleDraggingChanged);
          controls.removeEventListener('objectChange', handleObjectChange);
          gl.domElement.removeEventListener('pointerdown', suppressEvent, true);
          gl.domElement.removeEventListener('click', suppressEvent, true);
        } catch (error) {
          console.warn('Error cleaning up TransformControls event listeners:', error);
        }
      };
    }
  }, [gizmoActive, onTransformChange, objectRef, id, gl]);

  // Safety check: only render if objectRef has a valid current object
  if (!objectRef?.current) {
    return null;
  }

  return (
    <TransformControls
      ref={transformRef}
      object={objectRef.current}
      mode={mode}
      camera={camera}
      domElement={gl.domElement}
      space={space}
      showX={showX}
      showY={showY}
      showZ={showZ}
    />
  );
};