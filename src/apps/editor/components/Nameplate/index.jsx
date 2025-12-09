// src/components/Nameplate.tsx
import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { Text } from '@react-three/drei';

export const Nameplate = ({
  id,
  title,
  alt,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = [1, 1, 1],
}) => {
  const plateRef = useRef();

  useEffect(() => {
    if (plateRef.current) {
      plateRef.current.userData.id = id;
    }
  }, [id]);

  return (
    <group position={position} rotation={rotation} scale={scale} ref={plateRef}>
      {/* Brass plate */}
      <mesh>
        <planeGeometry args={[1.4, 0.4]} />
        <meshStandardMaterial
          color="#b08d57"
          metalness={0.9}
          roughness={0.3}
        />
      </mesh>

      {/* Text title */}
      <Text
        position={[0, 0.07, 0.01]}
        fontSize={0.09}
        color="#fff8dc"
        anchorX="center"
        anchorY="middle"
      >
        {title}
      </Text>

      {/* Text alt/description */}
      {alt && (
        <Text
          position={[0, -0.08, 0.01]}
          fontSize={0.06}
          color="#e0e0d0"
          anchorX="center"
          anchorY="middle"
        >
          {alt}
        </Text>
      )}
    </group>
  );
};
