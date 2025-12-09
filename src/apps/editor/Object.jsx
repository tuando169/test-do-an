import { TransformWidget } from './TransformWidget';
import * as THREE from 'three';
import { useMemo, useEffect, useRef } from 'react';
import { useLoader } from '@react-three/fiber';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader';
import meshRefs from './meshRefs';

export const Object3D = ({
    id,
    src,
    albedo,
    normal,
    orm,
    scale = [1, 1, 1],
    position = [0, 0, 0],
    rotation = [0, 0, 0],
    mode,
    selectedId,
    onTransformChange,
    gizmoActive,
    hoveredId,
    gizmoMode,
    hdri, // Add hdri parameter
}) => {
    const ref = useRef();
    const isHoveredAndEditable = hoveredId === id && mode === 'edit' && selectedId != id;
    // Detect file extension and choose loader
    const ext = src.split('.').pop().toLowerCase();
    let loadedScene;
    if (ext === 'fbx') {
        loadedScene = useLoader(FBXLoader, src);
    } else if (ext === 'glb' || ext === 'gltf') {
        const gltf = useLoader(GLTFLoader, src, (loader) => {
            // Configure DRACOLoader for Draco-compressed geometries
            const dracoLoader = new DRACOLoader();
            dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
            loader.setDRACOLoader(dracoLoader);
            
            // Configure MeshoptDecoder for Meshopt compression
            loader.setMeshoptDecoder(MeshoptDecoder);
        });
        loadedScene = gltf.scene;
    } else {
        loadedScene = null;
    }

    useEffect(() => {
        if (loadedScene) {
            const meshes = [];
            loadedScene.traverse((child) => {
                if (child.isMesh) {
                    child.userData.id = id;
                    meshes.push(child);
                }
            });
            meshRefs.set(id, meshes);
        }
        return () => {
            meshRefs.delete(id);
        };
    }, [id, loadedScene]);

    // Load textures
    const textures = useMemo(() => {
        const loader = new THREE.TextureLoader();
        return {
            albedo: albedo ? loader.load(albedo) : null,
            normal: normal ? loader.load(normal) : null,
            orm: orm ? loader.load(orm) : null,
        };
    }, [albedo, normal, orm]);

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

    useEffect(() => {
        if (loadedScene) {
            loadedScene.traverse((child) => {
                if (child.isMesh && child.material) {
                    // Optionally apply custom textures if provided
                    if (textures.albedo) {
                        child.material.map = textures.albedo;
                        child.material.map.wrapS = child.material.map.wrapT = THREE.RepeatWrapping;
                        child.material.map.repeat.set(1, 1);
                    }
                    if (textures.normal) {
                        child.material.normalMap = textures.normal;
                        child.material.normalMap.wrapS = child.material.normalMap.wrapT = THREE.RepeatWrapping;
                        child.material.normalMap.repeat.set(1, 1);
                    }
                    if (textures.orm) {
                        child.material.aoMap = textures.orm;
                        child.material.roughnessMap = textures.orm;
                        child.material.metalnessMap = textures.orm;
                        child.material.aoMap.wrapS = child.material.aoMap.wrapT = THREE.RepeatWrapping;
                        child.material.roughnessMap.wrapS = child.material.roughnessMap.wrapT = THREE.RepeatWrapping;
                        child.material.metalnessMap.wrapS = child.material.metalnessMap.wrapT = THREE.RepeatWrapping;
                        child.material.aoMap.repeat.set(1, 1);
                        child.material.roughnessMap.repeat.set(1, 1);
                        child.material.metalnessMap.repeat.set(1, 1);

                        // Ensure uv2 exists for aoMap
                        if (!child.geometry.attributes.uv2 && child.geometry.attributes.uv) {
                            child.geometry.setAttribute('uv2', child.geometry.attributes.uv);
                        }
                    }

                    // Apply lightmap if available
                    if (lightmapTexture) {
                        child.material.lightMap = lightmapTexture;
                        child.material.lightMapIntensity = 1.0;
                        
                        // Ensure uv2 exists for lightMap (required for lightmaps)
                        if (!child.geometry.attributes.uv2 && child.geometry.attributes.uv) {
                            child.geometry.setAttribute('uv2', child.geometry.attributes.uv);
                        }
                        
                        child.material.needsUpdate = true;
                        console.log(`Applied lightmap to mesh: ${child.name || 'unnamed'}`);
                    }

                    // Highlight on hover/select
                    child.material.color.set(isHoveredAndEditable ? 'yellow' : 'white');
                    child.material.needsUpdate = true;
                }
            });
        }
    }, [loadedScene, textures, lightmapTexture, isHoveredAndEditable]);

    return (
        <>
            {mode === 'edit' && selectedId === id && (
                <TransformWidget
                    id={id}
                    objectRef={ref}
                    mode={gizmoMode}
                    gizmoActive={gizmoActive}
                    onTransformChange={(transform) => onTransformChange(id, transform)}
                />
            )}
            {loadedScene && (
                <primitive
                    ref={ref}
                    object={loadedScene}
                    position={position}
                    rotation={degToRad(rotation)}
                    scale={scale}
                />
            )}
        </>
    );
};

const degToRad = (degrees) => degrees.map((deg) => THREE.MathUtils.degToRad(deg)); 