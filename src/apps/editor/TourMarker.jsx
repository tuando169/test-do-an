import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { TransformWidget } from './TransformWidget';
import meshRefs from './meshRefs';

// Validate gizmo mode to prevent TransformControls errors
const isValidGizmoMode = (m) =>
  m === 'translate' || m === 'rotate' || m === 'scale';

const TourMarker = ({ 
  // For image markers
  imageId, 
  imagePosition, 
  imageRotation, 
  wallPosition = [0, 0, 0], 
  wallRotation = [0, 0, 0], 
  wallScale = [1, 1, 1],
  // For camera markers
  cameraPosition,
  cameraRotation = [0, 0, 0], // Camera rotation for controlling tour camera angle
  // Common props
  tourIndex, 
  type = 'image', // 'image' or 'camera'
  // Transform widget props
  mode,
  selectedId,
  gizmoMode,
  gizmoActive,
  hoveredId,
  snapEnabled,
  onTransformChange,
  id, // Unique ID for the tour marker
  // New prop for independent marker position
  markerPosition: providedMarkerPosition
}) => {
  const markerRef = useRef();
  const sphereRef = useRef();
  const textRef = useRef();
  const triangleRef = useRef();
  const ringRef = useRef();
  const directionGroupRef = useRef(); // Group for triangle and ring
  const MARKER_DISTANCE = 2; // Distance in front of the image to place the marker
  const CAMERA_HEIGHT = 1.7; // Camera height level for all tour markers
  
  const isHoveredAndEditable = hoveredId === id && mode === 'edit' && selectedId !== id;
  
  // Register mesh in meshRefs for hover/select detection
  useEffect(() => {
    if (markerRef.current && id) {
      markerRef.current.userData.id = id;
      // Register both the group and individual meshes for reliable clicking
      const meshes = [markerRef.current];
      if (sphereRef.current) {
        sphereRef.current.userData.id = id;
        meshes.push(sphereRef.current);
      }
      if (textRef.current) {
        textRef.current.userData.id = id;
        meshes.push(textRef.current);
      }
      if (triangleRef.current) {
        triangleRef.current.userData.id = id;
        meshes.push(triangleRef.current);
      }
      if (ringRef.current) {
        ringRef.current.userData.id = id;
        meshes.push(ringRef.current);
      }
      meshRefs.set(id, meshes);
    }
    return () => {
      if (id) {
        meshRefs.delete(id);
      }
    };
  }, [id]);
  
  // Calculate marker position based on type
  const markerPosition = React.useMemo(() => {
    if (type === 'camera') {
      // For camera markers, ensure they're at camera height level
      return [cameraPosition[0], CAMERA_HEIGHT, cameraPosition[2]];
    }
    
    // For image markers, use provided position if available but force camera height
    if (providedMarkerPosition && Array.isArray(providedMarkerPosition)) {
      return [providedMarkerPosition[0], CAMERA_HEIGHT, providedMarkerPosition[2]];
    }
    
    // Calculate default position (2 units in front of the image) for new markers
    // Validate input data
    if (!imagePosition || !imageRotation || !wallPosition || !wallRotation || !wallScale) {
      console.error('Missing required position data for image marker');
      return [0, 0, 0];
    }

    // Calculate image world position and move forward along its normal
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
    forward.multiplyScalar(MARKER_DISTANCE);
    
    // Final marker position = image world position + forward offset
    const markerPos = imageWorldPos.clone().add(forward);
    
    // Force Y position to camera height level
    const finalPosition = [markerPos.x, CAMERA_HEIGHT, markerPos.z];
    
    return finalPosition;
  }, [type, cameraPosition, providedMarkerPosition, imagePosition, imageRotation, wallPosition, wallRotation, wallScale]);

  // Make the marker always face the camera
  useFrame(({ camera }) => {
    if (markerRef.current) {
      if (type === 'camera') {
        // For camera markers, apply rotation to direction indicators only
        if (directionGroupRef.current) {
          directionGroupRef.current.rotation.set(
            THREE.MathUtils.degToRad(cameraRotation[0]),
            THREE.MathUtils.degToRad(cameraRotation[1]),
            THREE.MathUtils.degToRad(cameraRotation[2])
          );
        }
      } else {
        // For image markers, keep the whole marker facing camera
        markerRef.current.lookAt(camera.position);
      }

      // For both marker types, position text on sphere surface facing camera
      if (textRef.current) {
        // Use the marker position directly (world coordinates)
        const markerWorldPos = new THREE.Vector3(...markerPosition);
        
        // Calculate direction from sphere center to camera
        const dirToCamera = new THREE.Vector3();
        dirToCamera.copy(camera.position).sub(markerWorldPos).normalize();
        
        // Position text on sphere surface in direction of camera (world coordinates)
        const sphereRadius = 0.2;
        const textWorldPos = markerWorldPos.clone().add(
          dirToCamera.clone().multiplyScalar(sphereRadius + 0.01)
        );
        textRef.current.position.set(textWorldPos.x, textWorldPos.y, textWorldPos.z);
        
        // Make text face camera
        textRef.current.lookAt(camera.position);
      }
    }
  });

  // Safety check for valid marker position
  if (!markerPosition || markerPosition.some(n => !isFinite(n))) {
    console.error('🎯 Invalid marker position, not rendering:', markerPosition);
    return null;
  }

  return (
    <>
      {/* Transform Widget for edit mode */}
      {mode === 'edit' && selectedId === id && isValidGizmoMode(gizmoMode) && markerRef.current && (
        <TransformWidget
          id={id}
          objectRef={markerRef}
          mode={gizmoMode}
          gizmoActive={gizmoActive}
          snapEnabled={snapEnabled}
          onTransformChange={(transform) => {
            if (onTransformChange) {
              // Force Y position to camera height level
              transform.position[1] = CAMERA_HEIGHT;
              onTransformChange(id, transform);
            }
          }}
          showZ={gizmoMode === 'translate' ? true : false} // For translate: allow Z movement
          showX={gizmoMode === 'translate' ? true : false} // For translate: allow X movement  
          showY={gizmoMode === 'rotate' ? true : false} // For rotate: only allow Y-axis rotation
        />
      )}
      
      <group position={markerPosition} ref={markerRef}>
        {/* Main marker sphere */}
        <mesh 
          ref={sphereRef}
          userData={{ id: id }}
        >
          <sphereGeometry args={[0.2, 32, 32]} />
          <meshBasicMaterial 
            color={
              isHoveredAndEditable 
                ? 'yellow' 
                : type === 'camera' ? '#4CAF50' : '#ff6b35'
            } 
            transparent 
            opacity={0.9}
          />
        </mesh>
        
        {/* Direction indicators for camera markers - ring and triangle */}
        {type === 'camera' && (
          <group ref={directionGroupRef}>
            {/* Small ring around the sphere to show rotation */}
            <mesh ref={ringRef} userData={{ id: id }}>
              <torusGeometry args={[0.28, 0.015, 8, 32]} />
              <meshBasicMaterial 
                color="#2E7D32" // Green ring
                transparent 
                opacity={0.6}
              />
            </mesh>
            
            {/* Direction triangle protruding from sphere */}
            <mesh 
              ref={triangleRef}
              position={[0, 0, -0.3]} // Position in front of sphere
              rotation={[Math.PI / 2, 0, 0]} // Rotate to point forward
              userData={{ id: id }}
            >
              <coneGeometry args={[0.06, 0.15, 3]} />
              <meshBasicMaterial 
                color="#1B5E20" // Dark green triangle
                transparent 
                opacity={0.9}
              />
            </mesh>
          </group>
        )}
      </group>

      {/* Tour number as 3D text - same behavior for both marker types */}
      <Text
        ref={textRef}
        position={[0, 0, 0]}
        fontSize={0.15}
        color="white"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.01}
        outlineColor="black"
        userData={{ id: id }}
      >
        {tourIndex !== undefined ? tourIndex + 1 : '?'}
      </Text>
    </>
  );
};

export default TourMarker;
