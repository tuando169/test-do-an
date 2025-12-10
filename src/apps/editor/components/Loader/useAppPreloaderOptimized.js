import { useState, useEffect, useRef } from "react";
import { TextureLoader } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

export default function useAppPreloader({ hdri, groundTextures, images, objects }) {
  const [ready, setReady] = useState(false);
  const [progress, setProgress] = useState(0);

  const hasStartedRef = useRef(false);
  const hasFinishedRef = useRef(false);

  useEffect(() => {
    // Already loaded → do nothing
    if (hasStartedRef.current || hasFinishedRef.current) return;

    // Check if we have at least some data to load
    const hasHdri = hdri && typeof hdri === 'string';
    const hasGroundTextures = groundTextures && Object.keys(groundTextures).length > 0;
    const hasImages = images && Array.isArray(images) && images.length > 0;
    const hasObjects = objects && Array.isArray(objects) && objects.length > 0;
    
    const hasDataToLoad = hasHdri || hasGroundTextures || hasImages || hasObjects;
    
    if (!hasDataToLoad) {
      setReady(true);
      return;
    }

    hasStartedRef.current = true;

    // Use requestIdleCallback or setTimeout to prevent blocking
    const startLoading = () => {
      let loaded = 0;
      let total = 0;
      const BATCH_SIZE = 3; // Load assets in batches to prevent blocking

      const updateProgress = () => {
        // Use requestAnimationFrame to ensure smooth UI updates
        requestAnimationFrame(() => {
          const newProgress = Math.round((loaded / total) * 100);
          setProgress(newProgress);
        });
      };

      const tasks = [];
      const textureLoader = new TextureLoader();
      const gltfLoader = new GLTFLoader();

      function track(promise) {
        total++;
        tasks.push(
          promise
            .catch(() => {
              // Silently handle errors to prevent console spam
            })
            .finally(() => {
              loaded++;
              updateProgress();
            })
        );
      }

      // HDRI
      if (hdri) {
        track(
          new Promise((resolve, reject) => {
            textureLoader.load(hdri, resolve, undefined, reject);
          })
        );
      }

      // Ground textures (albedo, normal, orm)
      if (groundTextures) {
        ["albedo", "normal", "orm"].forEach((key) => {
          const url = groundTextures[key];
          if (url) {
            track(
              new Promise((resolve, reject) => {
                textureLoader.load(url, resolve, undefined, reject);
              })
            );
          }
        });
      }

      // Batch load images to prevent blocking - limit to prevent overload
      if (images && Array.isArray(images)) {
        const imageUrls = images.filter(img => img?.url).slice(0, 15); // Limit to 15 images
        imageUrls.forEach((img) => {
          track(
            new Promise((resolve, reject) => {
              textureLoader.load(img.url, resolve, undefined, reject);
            })
          );
        });
      }

      // GLB models with batching - limit to prevent overload
      if (objects && Array.isArray(objects)) {
        const glbObjects = objects.filter(obj => obj?.glbUrl).slice(0, 8); // Limit to 8 GLB models
        glbObjects.forEach((obj) => {
          track(
            new Promise((resolve, reject) => {
              gltfLoader.load(obj.glbUrl, resolve, undefined, reject);
            })
          );
        });
      }

      // If no assets to load, mark as ready immediately
      if (total === 0) {
        hasFinishedRef.current = true;
        setReady(true);
        return;
      }

      // Process tasks in batches to prevent blocking
      const processBatch = async (batchTasks) => {
        return Promise.allSettled(batchTasks);
      };

      const processAllBatches = async () => {
        const batches = [];
        for (let i = 0; i < tasks.length; i += BATCH_SIZE) {
          batches.push(tasks.slice(i, i + BATCH_SIZE));
        }

        for (const batch of batches) {
          await processBatch(batch);
          // Small delay between batches to prevent blocking the main thread
          await new Promise(resolve => setTimeout(resolve, 16)); // ~1 frame delay
        }

        hasFinishedRef.current = true;
        // Use requestAnimationFrame for smooth state update
        requestAnimationFrame(() => {
          setReady(true);
        });
      };

      processAllBatches();
    };

    // Use requestIdleCallback if available, otherwise setTimeout
    // This ensures loading doesn't block the main thread
    if (window.requestIdleCallback) {
      requestIdleCallback(startLoading, { timeout: 1000 });
    } else {
      setTimeout(startLoading, 0);
    }

  }, [hdri, groundTextures, images, objects]);

  return { ready, progress };
}