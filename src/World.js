import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { Ground } from './Ground';
import { Markers } from './Markers';
import { Obstacles } from './Obstacles';
import { Trees } from './Trees';

export class World {
  constructor(scene, physicsWorld) {
    this.scene = scene;
    this.physicsWorld = physicsWorld;
    this.worldGroup = new THREE.Group();
    this.scene.add(this.worldGroup);
    this.segmentLength = 20;
    this.visibleSegments = 7;
    this.moveSpeed = 0.1;
    this.lastCollisionTime = 0;
    this.collisionCooldown = 500;
    this.ground = new Ground(this.worldGroup, this.segmentLength);
    this.markers = new Markers(this.worldGroup, this.physicsWorld, this.segmentLength);
    this.obstacles = new Obstacles(this.worldGroup, this.physicsWorld, this.segmentLength);
    this.trees = new Trees(this.worldGroup, this.segmentLength);

    // Configure trees x-range
    this.trees.setXRange(-8, 8);

    this.initializeWorld();
  }

  initializeWorld() {
    for (
      let i = -Math.floor(this.visibleSegments / 2);
      i <= Math.floor(this.visibleSegments / 2);
      i++
    ) {
      const zPosition = i * this.segmentLength;
      this.ground.createSegment(zPosition);
      this.markers.createMarkers(zPosition, this.worldGroup.position.z);
      this.obstacles.createObstacle(zPosition, this.worldGroup.position.z);
      this.trees.createTrees(zPosition);
    }
  }

  update(moveDirection, character) {
    let deltaZ = 0;
    if (moveDirection === 'left') {
      deltaZ = -this.moveSpeed;
      this.worldGroup.position.z += deltaZ;
    } else if (moveDirection === 'right') {
      deltaZ = this.moveSpeed;
      this.worldGroup.position.z += deltaZ;
    }
    if (character && character.physicsBody) {
      this.checkCollisions(character);
    }
    if (deltaZ !== 0 && this.physicsWorld) {
      this.markers.updatePhysicsBodies(deltaZ);
      this.obstacles.updatePhysicsBodies(deltaZ);
    }
    const speedFactor = this.moveSpeed / 0.1;
    const visibleRangeStart =
      -this.worldGroup.position.z - this.segmentLength * 3 * speedFactor;
    const visibleRangeEnd =
      -this.worldGroup.position.z + this.segmentLength * 3 * speedFactor;
    let minZ = Infinity;
    let maxZ = -Infinity;
    this.ground.segments.forEach((segment) => {
      minZ = Math.min(minZ, segment.position.z);
      maxZ = Math.max(maxZ, segment.position.z);
    });
    if (visibleRangeStart < minZ) {
      const newZ = minZ - this.segmentLength;
      this.ground.createSegment(newZ);
      this.markers.createMarkers(newZ, this.worldGroup.position.z);
      this.obstacles.createObstacle(newZ, this.worldGroup.position.z);
      this.trees.createTrees(newZ);
    }
    if (visibleRangeEnd > maxZ) {
      const newZ = maxZ + this.segmentLength;
      this.ground.createSegment(newZ);
      this.markers.createMarkers(newZ, this.worldGroup.position.z);
      this.obstacles.createObstacle(newZ, this.worldGroup.position.z);
      this.trees.createTrees(newZ);
    }
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
    const cleanupMin = visibleRangeStart - this.segmentLength * 2;
    const cleanupMax = visibleRangeEnd + this.segmentLength * 2;
    this.markers.cleanupPhysicsBodies(
      cleanupMin,
      cleanupMax,
      this.worldGroup.position.z
    );
    this.obstacles.cleanupPhysicsBodies(
      cleanupMin,
      cleanupMax,
      this.worldGroup.position.z
    );
    this.trees.cleanupTrees(
      cleanupMin,
      cleanupMax
    );
  }

  checkCollisions(character) {
    if (!character || !character.physicsBody) return false;
    const now = Date.now();
    if (now - this.lastCollisionTime < this.collisionCooldown) return false;
    const characterPosition = character.physicsBody.position;
    const worldOffset = this.worldGroup.position.z;
    if (this.obstacles.obstacle) {
      const obstacleBody = this.obstacles.obstacle.body;
      const obstaclePos = obstacleBody.position;
      const adjustedZ = obstaclePos.z - worldOffset;
      const dx = characterPosition.x - obstaclePos.x;
      const dy = characterPosition.y - obstaclePos.y;
      const dz = characterPosition.z - adjustedZ;
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
      const collisionThreshold = 1.0;
      if (distance < collisionThreshold) {
        if (obstacleBody.userData && obstacleBody.userData.mesh) {
          const mesh = obstacleBody.userData.mesh;
          if (mesh.material) {
            if (!mesh.userData.originalColor) {
              mesh.userData.originalColor = mesh.material.color.clone();
            }
            mesh.material.color.set(0xff0000);
            setTimeout(() => {
              if (mesh.userData.originalColor) {
                mesh.material.color.copy(mesh.userData.originalColor);
              }
            }, 300);
          }
        }
        this.lastCollisionTime = now;
        return true;
      }
    }
    return false;
  }

  setMoveSpeed(speed) {
    this.moveSpeed = speed;
  }

  reset() {
    this.ground.segments.forEach((segment) => {
      this.worldGroup.remove(segment);
    });
    this.ground.segments = [];
    if (this.physicsWorld) {
      if (this.obstacles.obstacle) {
        this.worldGroup.remove(this.obstacles.obstacle.mesh);
        this.physicsWorld.removeBody(this.obstacles.obstacle.body);
        this.obstacles.obstacle = null;
      }
      this.markers.markers.forEach((body) => {
        this.physicsWorld.removeBody(body);
      });
    }
    this.markers.markers = [];

    this.trees.trees.forEach((tree) => {
      this.worldGroup.remove(tree);
    });
    this.trees.trees = [];

    this.worldGroup.position.set(0, 0, 0);
    this.moveSpeed = 0.1;
    this.initializeWorld();
  }
}