import * as THREE from "three";
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export function generateCircularFrameGeometry({
  radius = 0.5,
  frameWidth = 0.05,
  depth = 0.05,
  radialSegments = 64,
  rotation = { x: 0, y: 0, z: 0 }
} = {}) {

  const group = [];

  const outerRadius = radius;
  const innerRadius = radius - frameWidth;
  const h = depth;

  // ----------------------------------------------------
  // 1. OUTER CYLINDER (side wall)
  // ----------------------------------------------------
  const outer = new THREE.CylinderGeometry(
    outerRadius,
    outerRadius,
    h,
    radialSegments,
    1,
    true
  );

  // ---- PROPER CYLINDRICAL UV MAPPING ----
  {
    const pos = outer.attributes.position;
    const uv = [];
    
    // Use consistent scaling factor that matches the front face
    const texelSize = 1.0; // Texture units per world unit
    
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);

      // U = height coordinate (swapped to align with front face)
      const u = (y + h/2) / texelSize;
      
      // V = cylindrical coordinate around circumference (swapped to align with front face)
      const angle = Math.atan2(z, x);
      const v = (angle + Math.PI) / (2 * Math.PI) * (2 * Math.PI * outerRadius) / texelSize;

      uv.push(u, v);
    }

    outer.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  }

  outer.translate(0, -h / 2, 0);
  group.push(outer);

  // ----------------------------------------------------
  // 2. INNER CYLINDER (side wall)
  // ----------------------------------------------------
  const inner = new THREE.CylinderGeometry(
    innerRadius,
    innerRadius,
    h,
    radialSegments,
    1,
    true
  );

  inner.scale(1, 1, -1); // flip normals inward

  // ---- PROPER CYLINDRICAL UV MAPPING FOR INNER ----
  {
    const pos = inner.attributes.position;
    const uv = [];
    
    // Use same scaling factor for consistency
    const texelSize = 1.0;

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);

      // U = height coordinate (swapped to align with front face)
      const u = (y + h/2) / texelSize;
      
      // V = cylindrical coordinate around circumference (swapped to align with front face)
      const angle = Math.atan2(z, x);
      const v = (angle + Math.PI) / (2 * Math.PI) * (2 * Math.PI * innerRadius) / texelSize;

      uv.push(u, v);
    }

    inner.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  }

  inner.translate(0, -h / 2, 0);
  group.push(inner);

  // ----------------------------------------------------
  // 3. FRONT RING (flat front face)
  // ----------------------------------------------------
  const front = new THREE.RingGeometry(innerRadius, outerRadius, radialSegments);
  front.rotateX(-Math.PI / 2);
  
  // ---- CONSISTENT UV MAPPING FOR FRONT RING ----
  {
    const pos = front.attributes.position;
    const uv = [];
    
    const texelSize = 1.0; // Same scaling as cylinders
    
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i); // Note: after rotation, Y becomes Z
      
      // Map X,Z coordinates directly to U,V with consistent scaling
      const u = x / texelSize;
      const v = z / texelSize;
      
      uv.push(u, v);
    }
    
    front.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  }
  
  group.push(front);

  // ----------------------------------------------------
  // 4. MERGE GEOMETRIES
  // ----------------------------------------------------
  const merged = BufferGeometryUtils.mergeGeometries(group, true);

  // ----------------------------------------------------
  // 5. ROTATE ENTIRE FRAME
  // ----------------------------------------------------
  merged.rotateX(rotation.x || 0);
  merged.rotateY(rotation.y || 0);
  merged.rotateZ(rotation.z || 0);

  return merged;
}
