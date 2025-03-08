// World.js
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { Ground } from './Ground';
import { Markers } from './Markers';
import { Obstacles } from './Obstacles';

export class World {
  constructor(scene, physicsWorld) {
    this.scene = scene;
    this.physicsWorld = physicsWorld;
    this.worldGroup = new THREE.Group();
    this.scene.add(this.worldGroup);

    // Configuration
    this.segmentLength = 20;
    this.visibleSegments = 7;
    this.moveSpeed = 0.1;

    // Create instances of our modules
    this.ground = new Ground(this.worldGroup, this.segmentLength);
    this.markers = new Markers(this.worldGroup, this.physicsWorld, this.segmentLength);
    this.obstacles = new Obstacles(this.worldGroup, this.physicsWorld, this.segmentLength);

    this.initializeWorld();
  }

  initializeWorld() {
    // Create initial set of segments along with markers and obstacles
    for (
      let i = -Math.floor(this.visibleSegments / 2);
      i <= Math.floor(this.visibleSegments / 2);
      i++
    ) {
      const zPosition = i * this.segmentLength;
      this.ground.createSegment(zPosition);
      this.markers.createMarkers(zPosition, this.worldGroup.position.z);
      this.obstacles.createObstacle(zPosition, this.worldGroup.position.z);
    }
  }

  update(moveDirection) {
    // Move the world based on direction and current move speed
    let deltaZ = 0;
    if (moveDirection === 'left') {
      deltaZ = -this.moveSpeed;
      this.worldGroup.position.z += deltaZ;
    } else if (moveDirection === 'right') {
      deltaZ = this.moveSpeed;
      this.worldGroup.position.z += deltaZ;
    }

    // Update physics bodies if movement occurred
    if (deltaZ !== 0 && this.physicsWorld) {
      this.markers.updatePhysicsBodies(deltaZ);
      this.obstacles.updatePhysicsBodies(deltaZ);
    }

    // Adjust the visible range based on speed
    const speedFactor = this.moveSpeed / 0.1;
    const visibleRangeStart =
      -this.worldGroup.position.z - this.segmentLength * 3 * speedFactor;
    const visibleRangeEnd =
      -this.worldGroup.position.z + this.segmentLength * 3 * speedFactor;

    // Determine min and max z positions from ground segments
    let minZ = Infinity;
    let maxZ = -Infinity;
    this.ground.segments.forEach((segment) => {
      minZ = Math.min(minZ, segment.position.z);
      maxZ = Math.max(maxZ, segment.position.z);
    });

    // Add segments if needed at the beginning or end
    if (visibleRangeStart < minZ) {
      const newZ = minZ - this.segmentLength;
      this.ground.createSegment(newZ);
      this.markers.createMarkers(newZ, this.worldGroup.position.z);
      this.obstacles.createObstacle(newZ, this.worldGroup.position.z);
    }
    if (visibleRangeEnd > maxZ) {
      const newZ = maxZ + this.segmentLength;
      this.ground.createSegment(newZ);
      this.markers.createMarkers(newZ, this.worldGroup.position.z);
      this.obstacles.createObstacle(newZ, this.worldGroup.position.z);
    }

    // Remove segments that are far out of view
    const cleanupSegments = [];
    this.ground.segments.forEach((segment) => {
      if (
        segment.position.z <
          visibleRangeStart - this.segmentLength * 2 ||
        segment.position.z >
          visibleRangeEnd + this.segmentLength * 2
      ) {
        cleanupSegments.push(segment);
      }
    });
    cleanupSegments.forEach((segment) => {
      this.ground.removeSegment(segment);
    });

    // Cleanup physics bodies for markers and obstacles
    const cleanupMin = visibleRangeStart - this.segmentLength * 2;
    const cleanupMax = visibleRangeEnd + this.segmentLength * 2;
    this.markers.cleanupPhysicsBodies(cleanupMin, cleanupMax, this.worldGroup.position.z);
    this.obstacles.cleanupPhysicsBodies(cleanupMin, cleanupMax, this.worldGroup.position.z);
  }

  // Method to change the move speed
  setMoveSpeed(speed) {
    this.moveSpeed = speed;
  }

  reset() {
    // Remove all ground segments
    this.ground.segments.forEach((segment) => {
      this.worldGroup.remove(segment);
    });
    this.ground.segments = [];

    // Remove physics bodies for obstacles and markers
    if (this.physicsWorld) {
      this.obstacles.obstacles.forEach((body) => {
        this.physicsWorld.removeBody(body);
      });
      this.markers.markers.forEach((body) => {
        this.physicsWorld.removeBody(body);
      });
    }
    this.obstacles.obstacles = [];
    this.markers.markers = [];

    // Reset position and speed, then rebuild world
    this.worldGroup.position.set(0, 0, 0);
    this.moveSpeed = 0.1;
    this.initializeWorld();
  }
}
