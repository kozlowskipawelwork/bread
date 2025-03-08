// Ground.js
import * as THREE from 'three';

export class Ground {
  constructor(worldGroup, segmentLength) {
    this.worldGroup = worldGroup;
    this.segmentLength = segmentLength;
    this.segments = [];
  }

  createSegment(zPosition) {
    const planeGeometry = new THREE.PlaneGeometry(10, this.segmentLength);
    const color =
      Math.abs(Math.floor(zPosition / this.segmentLength)) % 2 === 0
        ? 0x444444
        : 0x555555;
    const planeMaterial = new THREE.MeshStandardMaterial({
      color: color,
      side: THREE.DoubleSide,
    });
    const segment = new THREE.Mesh(planeGeometry, planeMaterial);
    segment.rotation.x = Math.PI / 2;
    segment.rotation.z = Math.PI / 2;
    segment.position.y = -1;
    segment.position.z = zPosition;

    this.worldGroup.add(segment);
    this.segments.push(segment);
    return segment;
  }

  removeSegment(segment) {
    this.worldGroup.remove(segment);
    const index = this.segments.indexOf(segment);
    if (index !== -1) {
      this.segments.splice(index, 1);
    }
  }
}
