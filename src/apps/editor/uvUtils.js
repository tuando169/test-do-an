// uvUtils.js
import * as THREE from 'three';

/** Box UV stable */
export function buildStableBoxUVGeometry(width, height, depth, TILE_SIZE = 1) {
  const geom = new THREE.BoxGeometry(width, height, depth);
  const g = geom.index ? geom.toNonIndexed() : geom;

  const pos = g.attributes.position.array;
  const uv = [];
  const axisIndexMap = { x: 0, y: 1, z: 2 };
  const size = { x: width, y: height, z: depth };

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

    const idxU = axisIndexMap[axisU];
    const idxV = axisIndexMap[axisV];

    for (let i = 0; i < 6; i++) {
      const vertIndex = face * 6 + i;
      const px = pos[vertIndex * 3 + idxU];
      const py = pos[vertIndex * 3 + idxV];

      // “toạ độ theo mét” / TILE_SIZE
      const u = (px + 0.5 * w) / TILE_SIZE;
      const v = (py + 0.5 * h) / TILE_SIZE;

      uv.push(u, v);
    }
  }

  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute('uv2', new THREE.Float32BufferAttribute(uv.slice(), 2));
  g.computeBoundingBox();
  g.computeBoundingSphere();
  return g;
}

/** Plane UV */
export function buildStablePlaneUVGeometry(width, height, TILE_SIZE = 1) {
  const geom = new THREE.PlaneGeometry(width, height);
  const g = geom.index ? geom.toNonIndexed() : geom;

  const pos = g.attributes.position.array;
  const uv = [];
  for (let i = 0; i < pos.length; i += 3) {
    const x = pos[i];     // -w/2..w/2
    const y = pos[i + 1]; // -h/2..h/2
    uv.push((x + width / 2) / TILE_SIZE, (y + height / 2) / TILE_SIZE);
  }

  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute('uv2', new THREE.Float32BufferAttribute(uv.slice(), 2));
  g.computeBoundingBox();
  g.computeBoundingSphere();
  return g;
}
