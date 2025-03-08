// Markers.js
import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export class Markers {
  constructor(worldGroup, physicsWorld, segmentLength) {
    this.worldGroup = worldGroup;
    this.physicsWorld = physicsWorld;
    this.segmentLength = segmentLength;
    this.markers = [];
  }

  createMarkers(zPosition, worldOffset = 0) {
    // Create 5 markers per segment
    for (let j = 0; j < 5; j++) {
      const markerGeometry = new THREE.BoxGeometry(0.5, 0.2, 0.5);
      const markerMaterial = new THREE.MeshStandardMaterial({ color: 0x888888 });
      const markerZ = zPosition - j * (this.segmentLength / 5);
      const marker = new THREE.Mesh(markerGeometry, markerMaterial);
      marker.position.set(0, -0.9, markerZ);
      this.worldGroup.add(marker);

      if (this.physicsWorld) {
        const markerBody = new CANNON.Body({
          type: CANNON.Body.STATIC,
          shape: new CANNON.Box(new CANNON.Vec3(0.25, 0.1, 0.25)),
          position: new CANNON.Vec3(0, -0.9, markerZ + worldOffset),
        });
        this.physicsWorld.addBody(markerBody);
        marker.userData.physicsBody = markerBody;
        this.markers.push(markerBody);
      }
    }
  }

  updatePhysicsBodies(deltaZ) {
    this.markers.forEach((body) => {
      body.position.z += deltaZ;
    });
  }

  cleanupPhysicsBodies(minZ, maxZ, worldOffset) {
    if (!this.physicsWorld) return;
    const markerCleanup = [];
    this.markers.forEach((body) => {
      const localZ = body.position.z - worldOffset;
      if (localZ < minZ || localZ > maxZ) {
        markerCleanup.push(body);
      }
    });
    markerCleanup.forEach((body) => {
      this.physicsWorld.removeBody(body);
      const index = this.markers.indexOf(body);
      if (index !== -1) {
        this.markers.splice(index, 1);
      }
    });
  }
}
