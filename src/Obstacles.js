// Obstacles.js
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { COLLISION_GROUPS } from './App';
import useHeroStore from './heroStore';

export class Obstacles {
  constructor(worldGroup, physicsWorld, segmentLength) {
    this.worldGroup = worldGroup;
    this.physicsWorld = physicsWorld;
    this.segmentLength = segmentLength;
    this.obstacle = null;
    this.breadloafModel = null;
    this.loadBreadloafModel();
  }

  loadBreadloafModel() {
    const loader = new GLTFLoader();
    loader.load(
      '/breadloafs.glb',
      (gltf) => {
        this.breadloafModel = gltf.scene;
        this.breadloafModel.scale.set(3, 4, 3);
      },
      undefined,
      (error) => {
        console.error('Error loading breadloaf model:', error);
      }
    );
  }

  createObstacle(zPosition, worldOffset = 0) {
    if (!this.obstacle && this.breadloafModel && Math.abs(zPosition) > this.segmentLength) {
      const randomX = 0;
      const obstacleZ = zPosition - this.segmentLength * 0.5;
      const obstacleMesh = this.breadloafModel.clone();
      obstacleMesh.position.set(randomX, 0, obstacleZ);
      this.worldGroup.add(obstacleMesh);

      if (this.physicsWorld) {
        const obstacleBody = new CANNON.Body({
          type: CANNON.Body.STATIC,
          shape: new CANNON.Box(new CANNON.Vec3(0.4, 0.4, 0.4)),
          position: new CANNON.Vec3(randomX, 0.5, obstacleZ + worldOffset),
          collisionResponse: false
        });
        obstacleBody.userData = {
          type: 'obstacle',
          name: 'breadloaf',
          mesh: obstacleMesh
        };
        obstacleBody.collisionFilterGroup = COLLISION_GROUPS.OBSTACLE;
        obstacleBody.collisionFilterMask = COLLISION_GROUPS.PLAYER;

        this.physicsWorld.addBody(obstacleBody);
        obstacleMesh.userData.physicsBody = obstacleBody;
        this.obstacle = { body: obstacleBody, mesh: obstacleMesh };
      }
    }
  }

  removeObstacle() {
    if (this.obstacle) {
      if (this.obstacle.mesh) {
        this.worldGroup.remove(this.obstacle.mesh);
      }
      if (this.obstacle.body && this.physicsWorld) {
        this.physicsWorld.removeBody(this.obstacle.body);
      }
      this.obstacle = null;
    }
  }

  updatePhysicsBodies(deltaZ) {
    if (this.obstacle) {
      this.obstacle.body.position.z += deltaZ;
    }
    if (useHeroStore.getState().pickupFinished) {
      this.removeObstacle();
      useHeroStore.getState().setPickupFinished(false);
    }
  }

  cleanupPhysicsBodies(minZ, maxZ, worldOffset) {
    if (!this.physicsWorld || !this.obstacle) return;
    const localZ = this.obstacle.body.position.z - worldOffset;
    if (localZ < minZ || localZ > maxZ) {
      this.removeObstacle();
    }
  }
}
