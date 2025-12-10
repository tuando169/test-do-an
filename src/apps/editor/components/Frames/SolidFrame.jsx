import * as THREE from "three";

export function generateSolidFrameGeometry({
  whiteFrameWidth,
  whiteFrameHeight,
  frameThickness,
  depth,
}) {

  const outerWidth = whiteFrameWidth + frameThickness * 2;
  const outerHeight = whiteFrameHeight + frameThickness * 2;

  const halfW = outerWidth / 2;
  const halfH = outerHeight / 2;

  // Build shape + hole BEFORE extruding
  const shape = new THREE.Shape()
    .moveTo(-halfW, -halfH)
    .lineTo(-halfW,  halfH)
    .lineTo( halfW,  halfH)
    .lineTo( halfW, -halfH)
    .lineTo(-halfW, -halfH);

  const hole = new THREE.Path()
    .moveTo(-whiteFrameWidth/2, -whiteFrameHeight/2)
    .lineTo(-whiteFrameWidth/2,  whiteFrameHeight/2)
    .lineTo( whiteFrameWidth/2,  whiteFrameHeight/2)
    .lineTo( whiteFrameWidth/2, -whiteFrameHeight/2)
    .lineTo(-whiteFrameWidth/2, -whiteFrameHeight/2);

  shape.holes.push(hole);

  // Extrude into frame
  const g = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: false
  });

  g.computeVertexNormals();

  // Convert to non-indexed
  const geom = g.index ? g.toNonIndexed() : g;
  const pos = geom.attributes.position;
  const normal = geom.attributes.normal;

  const uv = [];

  const W = outerWidth;
  const H = outerHeight;
  const D = depth;

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);

    const nx = normal.getX(i);
    const ny = normal.getY(i);
    const nz = normal.getZ(i);

    let u = 0, v = 0;

    // FRONT & BACK (normals ±Z)
    if (Math.abs(nz) > Math.abs(nx) && Math.abs(nz) > Math.abs(ny)) {
      u = (x + W/2);
      v = (y + H/2);
    }

    // LEFT & RIGHT (normals ±X)
    else if (Math.abs(nx) > Math.abs(ny) && Math.abs(nx) > Math.abs(nz)) {
      u = (z + D/2);
      v = (y + H/2);
    }

    // TOP & BOTTOM (normals ±Y)
    else {
      u = (x + W/2);
      v = (z + D/2);
    }

    uv.push(u, v);
  }

  geom.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geom.setAttribute("uv2", new THREE.Float32BufferAttribute([...uv], 2));
  geom.computeBoundingSphere();

  return geom;
}
