import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useRoute } from 'wouter';
import { useCursor } from '@react-three/drei';
import { easing } from 'maath';
import { Image } from './Image';
import { Text } from '@react-three/drei';

export const Frame = ({
    id,
    url,
    position = [0, 0, 0],
    scale = [2.5, 3, 0.1],
    rotation = [0, 0, 0],
    mode,
    selectedId,
    setSelectedId,
    onTransformChange,
    gizmoActive,
    mouse,
    children,
    hoveredId,
    setHoveredId
}) => {
    const image = useRef(); // Reference to the image mesh
    const frame = useRef(); // Reference to the frame mesh
    const [, params] = useRoute('/item/:id'); // Route parameters to determine active item
    const [hovered, hover] = useState(false); // Hover state
    const [rnd] = useState(() => Math.random()); // Random seed for animation variation
    const isActive = params?.id === id; // Check if this frame is the currently active one
  
    useCursor(hovered); // Change cursor style on hover
  
    // Animation loop: adjust zoom and color based on hover/active state
    useFrame((state, dt) => {
      // Animate zoom effect on image material
      image.current.material.zoom = 2 + Math.sin(rnd * 10000 + state.clock.elapsedTime / 3) / 2;
  
      // Animate image scale with easing for hover effect
      easing.damp3(
        image.current.scale,
        [
          0.85 * (!isActive && hovered ? 0.85 : 1),
          0.9 * (!isActive && hovered ? 0.905 : 1),
          1
        ],
        0.1,
        dt
      );
  
      // Animate frame color on hover
      easing.dampC(frame.current.material.color, hovered ? 'orange' : 'white', 0.1, dt);
    });
  
    return (
      <group {...props}>
        <mesh
          name={id}
          onPointerOver={(e) => (e.stopPropagation(), hover(true))} // Start hover
          onPointerOut={() => hover(false)} // End hover
          scale={[1, GOLDENRATIO, 0.05]}
          position={[0, GOLDENRATIO / 2, 0]}
        >
          {/* Main box mesh (the backing for the frame) */}
          <boxGeometry />
          <meshStandardMaterial
            color="#151515"
            metalness={0.5}
            roughness={0.5}
            envMapIntensity={2}
          />
  
          {/* Frame overlay mesh */}
          <mesh
            ref={frame}
            raycast={() => null} // Disable raycast for interaction
            scale={[0.9, 0.93, 0.9]}
            position={[0, 0, 0.2]}
          >
            <boxGeometry />
            <meshBasicMaterial toneMapped={false} fog={false} />
          </mesh>
  
          {/* Image plane */}
          <Image
            raycast={() => null} // Disable raycast for interaction
            ref={image}
            position={[0, 0, 0.7]}
            url={url}
          />
        </mesh>
  
        {/* Text label displaying the image name */}
        <Text
          maxWidth={0.1}
          anchorX="left"
          anchorY="top"
          position={[0.55, GOLDENRATIO, 0]}
          fontSize={0.025}
        >
          {name.split('-').join(' ')}
        </Text>
      </group>
    );
  }
  