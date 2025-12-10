import * as THREE from 'three';
import { useMemo, useEffect, useRef } from 'react';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader';
import { useFrame, useLoader } from '@react-three/fiber';
import { TransformWidget } from './TransformWidget';
import meshRefs from './meshRefs';
import { OBB } from 'three/examples/jsm/math/OBB.js';

// Gizmo mode hợp lệ
const isValidGizmoMode = (m) =>
  m === 'translate' || m === 'rotate' || m === 'scale';

export const Wall = ({
  id,
  albedo,
  normal,
  orm,
  scale = [2.5, 3, 0.1],
  position = [0, 0, 0],
  rotation = [0, 0, 0], // degrees
  mode,
  transparent,
  selectedId,
  onTransformChange,
  gizmoActive,
  hoveredId,
  gizmoMode,
  snapEnabled,
  meshRef,
  onParentTransformChange,
  color = '#b6b898',
  modelSrc,
  hdri,
  onBoundingBoxUpdate
}) => {
  const materialRef = useRef();
  const localMeshRef = useRef(null);
  const ref = meshRef || localMeshRef;

  // Gizmo rendering check
  const shouldShowGizmo =
    mode === 'edit' && selectedId === id && id !== -1 && isValidGizmoMode(gizmoMode);

  // Highlight wall when hovered and editable
  const isHoveredAndEditable =
    hoveredId === id && mode === 'edit' && selectedId !== id;

  const TILE_SIZE = 2; // mét / 1 tile

  // Load textures
  const [albedoTex, normalTex, ormTex] = useLoader(
    THREE.TextureLoader,
    [albedo, normal, orm].map((url) => url || '')
  );

  // Load GLB model if modelSrc is provided
  let glbScene = null;
  if (modelSrc) {
    const gltf = useLoader(GLTFLoader, modelSrc, (loader) => {
      // Configure Draco decoder for geometry compression
      const dracoLoader = new DRACOLoader();
      dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
      loader.setDRACOLoader(dracoLoader);
      
      // Configure Meshopt decoder for additional compression
      loader.setMeshoptDecoder(MeshoptDecoder);
    });
    glbScene = gltf.scene;
  }

  // Configure texture properties
  const configureTexture = (t) => {
    if (t) {
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.anisotropy = 16;
      t.minFilter = THREE.LinearMipmapLinearFilter;
      t.magFilter = THREE.LinearFilter;
    }
  };
  configureTexture(albedoTex);
  configureTexture(normalTex);
  configureTexture(ormTex);

  // Load lightmap texture if hdri is provided and points to a texture file
  let lightmapTexture = null;
  if (hdri && (hdri.includes('lightmap') || hdri.includes('texture'))) {
    try {
      if (hdri.endsWith('.exr')) {
        lightmapTexture = useLoader(EXRLoader, hdri);
      } else if (hdri.endsWith('.webp') || hdri.endsWith('.jpg') || hdri.endsWith('.png')) {
        lightmapTexture = useLoader(THREE.TextureLoader, hdri);
      }
    } catch (error) {
      console.warn('Failed to load lightmap texture:', error);
      lightmapTexture = null;
    }
  }

  // Register ref into meshRefs for raycasting
  useEffect(() => {
    if (ref.current) {
      if (glbScene) {
        // For GLB models, collect all meshes and configure them properly
        const meshes = [];
        ref.current.traverse((child) => {
          if (child.isMesh && child.material && child.geometry) {
            // Set userData for raycasting
            child.userData.id = id;
            
            // ✅ Đảm bảo material có ánh sáng
            if (!(child.material instanceof THREE.MeshStandardMaterial)) {
              const oldMat = child.material;
              child.material = new THREE.MeshStandardMaterial({
                map: oldMat.map || null,
                normalMap: oldMat.normalMap || null,
                roughnessMap: oldMat.roughnessMap || null,
                metalnessMap: oldMat.metalnessMap || null,
                aoMap: oldMat.aoMap || null,
                color: oldMat.color || new THREE.Color(0xffffff),
              });
              oldMat.dispose();
            }

            // ✅ Nhận và đổ bóng
            child.castShadow = true;
            child.receiveShadow = true;
            // Configure material textures for better quality
            if (child.material.map) {
              child.material.map.anisotropy = 16;
              child.material.map.minFilter = THREE.LinearMipmapLinearFilter;
              child.material.map.magFilter = THREE.LinearFilter;
              child.material.map.generateMipmaps = true;
            }
            if (child.material.normalMap) {
              child.material.normalMap.anisotropy = 16;
              child.material.normalMap.minFilter = THREE.LinearMipmapLinearFilter;
              child.material.normalMap.magFilter = THREE.LinearFilter;
            }
            if (child.material.roughnessMap) {
              child.material.roughnessMap.anisotropy = 16;
              child.material.roughnessMap.minFilter = THREE.LinearMipmapLinearFilter;
              child.material.roughnessMap.magFilter = THREE.LinearFilter;
            }
            if (child.material.metalnessMap) {
              child.material.metalnessMap.anisotropy = 16;
              child.material.metalnessMap.minFilter = THREE.LinearMipmapLinearFilter;
              child.material.metalnessMap.magFilter = THREE.LinearFilter;
            }
            if (child.material.aoMap) {
              child.material.aoMap.anisotropy = 16;
              child.material.aoMap.minFilter = THREE.LinearMipmapLinearFilter;
              child.material.aoMap.magFilter = THREE.LinearFilter;
            }
            
            // Apply lightmap if available
            if (lightmapTexture) {
              child.material.lightMap = lightmapTexture;
              child.material.lightMapIntensity = 1.0;
              
              // Ensure uv2 exists for lightMap (required for lightmaps)
              if (!child.geometry.attributes.uv2 && child.geometry.attributes.uv) {
                child.geometry.setAttribute('uv2', child.geometry.attributes.uv);
              }
              
              console.log(`Applied lightmap to wall mesh: ${child.name || 'unnamed'}`);
            }
            
            // Force material update
            child.material.needsUpdate = true;
            
            // Ensure proper raycasting setup
            child.raycast = THREE.Mesh.prototype.raycast;
            child.visible = true;
            
            // Ensure geometry is properly set up
            if (child.geometry.boundingSphere === null) {
              child.geometry.computeBoundingSphere();
            }
            if (child.geometry.boundingBox === null) {
              child.geometry.computeBoundingBox();
            }
            
            // Set layers for SSAO compatibility
            child.layers.enable(0);
            child.layers.enable(1);
            
            meshes.push(child);
          }
        });
        
        // Store both the meshes array and the container
        meshRefs.set(id, ref.current);
      } else {
        // For regular geometry, set ID on direct mesh children
        ref.current.children.forEach((child) => {
          if (child.isMesh) {
            child.userData.id = id;
          }
        });
        meshRefs.set(id, ref.current);
      }
    }
    return () => {
      meshRefs.delete(id);
    };
  }, [id, glbScene, lightmapTexture]);

  useEffect(() => {
    if (materialRef.current) {
      if (mode === 'view') {
        // VIEW MODE
        if (transparent) {
          materialRef.current.transparent = true;
          materialRef.current.opacity = 0; // Ẩn hoàn toàn
        } else {
          materialRef.current.transparent = false;
          materialRef.current.opacity = 1; // Hiển thị bình thường
        }
      } else if (mode === 'edit') {
        // EDIT MODE
        materialRef.current.transparent = !!transparent;
        materialRef.current.opacity = transparent ? 0.8 : 1; // 0.8 khi bật transparent
      }

      // Ép Three.js cập nhật lại
      materialRef.current.needsUpdate = true;
    }
  }, [transparent, mode]);

  useFrame(() => {
    if (ref.current && onParentTransformChange) {
      const p = new THREE.Vector3();
      const q = new THREE.Quaternion();
      const s = new THREE.Vector3();
      ref.current.updateMatrixWorld();
      ref.current.matrixWorld.decompose(p, q, s);
      onParentTransformChange({ position: p, quaternion: q, scale: s });
    }
    if (ref.current && onBoundingBoxUpdate && !modelSrc) {
      ref.current.updateWorldMatrix(true, true);

      // Lấy mesh chính
      const mesh = ref.current.children.find((c) => c.isMesh);
      if (!mesh || !mesh.geometry) return;

      // Nếu chưa có boundingBox → tính một lần
      if (!mesh.geometry.boundingBox) {
        mesh.geometry.computeBoundingBox();
      }

      // Tạo OBB LƯU GIÁ TRỊ LOCAL
      const obb = new OBB();
      const box3 = mesh.geometry.boundingBox;
      obb.center.copy(box3.getCenter(new THREE.Vector3()));
      obb.halfSize.copy(
        box3.getSize(new THREE.Vector3()).multiplyScalar(0.5)
      );

      // Apply transform sang world space
      obb.applyMatrix4(ref.current.matrixWorld);

      // Gửi OBB lên component cha
      onBoundingBoxUpdate(id, obb);
    }

  });

  // Recalculate UVs based on scale (only for box geometry, not GLB models)
  useEffect(() => {
    if (!ref.current || glbScene) return; // Skip UV recalculation for GLB models

    // Get the actual mesh from the group
    const group = ref.current;
    const mesh = group.children.find((c) => c.isMesh);
    if (!mesh || !mesh.geometry) return;

    const originalGeom = mesh.geometry.clone();
    const nonIndexedGeom = originalGeom.index
      ? originalGeom.toNonIndexed()
      : originalGeom;

    const pos = nonIndexedGeom.attributes.position.array;
    const uv = [];

    const axisIndexMap = { x: 0, y: 1, z: 2 };
    const size = { x: scale[0], y: scale[1], z: scale[2] };

    const faces = [
      { axes: ['z', 'y'], size: [size.z, size.y] }, // front
      { axes: ['z', 'y'], size: [size.z, size.y] }, // back
      { axes: ['x', 'z'], size: [size.x, size.z] }, // top
      { axes: ['x', 'z'], size: [size.x, size.z] }, // bottom
      { axes: ['x', 'y'], size: [size.x, size.y] }, // right
      { axes: ['x', 'y'], size: [size.x, size.y] }, // left
    ];

    for (let face = 0; face < 6; face++) {
      const { axes, size } = faces[face];
      const [axisU, axisV] = axes;
      const [w, h] = size;
      const repeatU = w / TILE_SIZE;
      const repeatV = h / TILE_SIZE;

      const idxU = axisIndexMap[axisU];
      const idxV = axisIndexMap[axisV];

      for (let i = 0; i < 6; i++) {
        const vertIndex = face * 6 + i;
        const px = pos[vertIndex * 3 + idxU];
        const py = pos[vertIndex * 3 + idxV];
        const u = (px + 0.5) * repeatU;
        const v = (py + 0.5) * repeatV;
        uv.push(u, v);
      }
    }

    const uvAttr = new THREE.Float32BufferAttribute(uv, 2);
    nonIndexedGeom.setAttribute('uv', uvAttr);
    nonIndexedGeom.setAttribute('uv2', uvAttr.clone());

    nonIndexedGeom.attributes.uv.needsUpdate = true;
    nonIndexedGeom.attributes.uv2.needsUpdate = true;
    nonIndexedGeom.computeBoundingBox();
    nonIndexedGeom.computeBoundingSphere();

    mesh.geometry.dispose();
    mesh.geometry = nonIndexedGeom;
    mesh.userData.id = id;

    mesh.geometry.attributes.uv.needsUpdate = true;
    mesh.geometry.attributes.uv2.needsUpdate = true;

    // No cleanup needed for geometry changes
    // eslint-disable-next-line
  }, [scale, ref, id, glbScene]);

  // Material props
  const materialProps = useMemo(() => {
    if (transparent) {
      // Transparent walls: no textures, red color
      return {
        color: isHoveredAndEditable ? 'yellow' : 'red',
        roughness: 0.7,
      };
    } else {
      // Normal walls: with textures
      return {
        map: albedoTex || undefined,
        normalMap: normalTex || undefined,
        aoMap: ormTex || undefined,
        roughnessMap: ormTex || undefined,
        metalnessMap: ormTex || undefined,
        color: isHoveredAndEditable ? 'yellow' : color,
        roughness: 0.7,
      };
    }
  }, [albedoTex, normalTex, ormTex, isHoveredAndEditable, color, transparent]);

  // Giữ chân tường khi scale theo Y
  const handleWallTransformChange = (idArg, transform) => {
    onTransformChange(idArg, transform); 
  };

  return (
    <>
      {shouldShowGizmo && (
        <TransformWidget
          id={id}
          objectRef={ref}
          mode={gizmoMode} // luôn hợp lệ do shouldShowGizmo
          gizmoActive={gizmoActive}
          snapEnabled={snapEnabled}
          onTransformChange={(tr) => handleWallTransformChange(id, tr)}
        />
      )}
      {glbScene ? (
        <group
          ref={ref}
          position={[position[0], position[1], position[2]]}
          rotation={rotation.map(THREE.MathUtils.degToRad)}
          scale={scale}
        >
          <primitive object={glbScene} />
        </group>
      ) : (
        <group
          ref={ref}
          position={[position[0], position[1], position[2]]}
          rotation={rotation.map(THREE.MathUtils.degToRad)}
          scale={scale}
        >
          <mesh castShadow receiveShadow>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial
              ref={materialRef}
              {...materialProps}
            />
          </mesh>
        </group>
      )}
    </>
  );
};