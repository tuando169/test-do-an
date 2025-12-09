import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

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
  // Common props
  tourIndex, 
  onClick,
  type = 'image' // 'image' or 'camera'
}) => {
  const markerRef = useRef();
  const MARKER_DISTANCE = 2; // Distance in front of the image to place the marker
  
  // Calculate marker position based on type
  const markerPosition = React.useMemo(() => {
    if (type === 'camera') {
      // For camera markers, use the position directly
      return cameraPosition;
    }
    
    // For image markers, calculate position in front of the image
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
    // Extract rotation quaternion from the world matrix
    const quaternion = new THREE.Quaternion();
    const scale = new THREE.Vector3();
    const position = new THREE.Vector3();
    worldImageMatrix.decompose(position, quaternion, scale);
    
    // Image normal vector (pointing outward from the image surface)
    // Use negative Z as forward direction (standard in Three.js)
    const imageNormal = new THREE.Vector3(0, 0, -1);
    imageNormal.applyQuaternion(quaternion);
    
    // Position marker 2 units in front of image along its normal
    const forward = imageNormal.multiplyScalar(MARKER_DISTANCE);
    
    // Get world position of image and add forward offset
    const imageWorldPosition = new THREE.Vector3();
    imageWorldPosition.setFromMatrixPosition(worldImageMatrix);
    imageWorldPosition.add(forward);
    
    return [imageWorldPosition.x, imageWorldPosition.y, imageWorldPosition.z];
  }, [type, cameraPosition, imagePosition, imageRotation, wallPosition, wallRotation, wallScale]);

  // Make the marker always face the camera
  useFrame(({ camera }) => {
    if (markerRef.current) {
      markerRef.current.lookAt(camera.position);
    }
  });

  return (
    <group position={markerPosition} ref={markerRef}>
      {/* Main marker sphere */}
      <mesh onClick={onClick}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshBasicMaterial 
          color={type === 'camera' ? '#4CAF50' : '#ff6b35'} 
          transparent 
          opacity={0.8}
        />
      </mesh>
      
      {/* Pulsing animation ring (only for image markers) */}
      {type === 'image' && (
        <mesh>
          <ringGeometry args={[0.2, 0.25, 16]} />
          <meshBasicMaterial 
            color="#ff6b35" 
            transparent 
            opacity={0.3}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
      
      {/* Tour number as 3D text on top of sphere */}
      <Text
        position={[0, 0, 0.16]}
        fontSize={0.12}
        color="white"
        anchorX="center"
        anchorY="middle"
        onClick={onClick}
      >
        {tourIndex + 1}
      </Text>
    </group>
  );
};

export default TourMarker;
