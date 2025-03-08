// Obstacles.js
import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export class Obstacles {
  constructor(worldGroup, physicsWorld, segmentLength) {
    this.worldGroup = worldGroup;
    this.physicsWorld = physicsWorld;
    this.segmentLength = segmentLength;
    this.obstacles = [];
  }

  createObstacle(zPosition, worldOffset = 0) {
    // Only add an obstacle if the segment is not the starting segment and passes a random chance
    if (Math.abs(zPosition) > this.segmentLength && Math.random() > 0.5) {
      const obstacleGeometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
      const obstacleMaterial = new THREE.MeshStandardMaterial({ color: 0xdd3333 });
      const randomX = (Math.random() * 6) - 3;
      const obstacleZ = zPosition - this.segmentLength * 0.5;
      const obstacle = new THREE.Mesh(obstacleGeometry, obstacleMaterial);
      obstacle.position.set(randomX, 0, obstacleZ);
      this.worldGroup.add(obstacle);

      if (this.physicsWorld) {
        const obstacleBody = new CANNON.Body({
          type: CANNON.Body.STATIC,
          shape: new CANNON.Box(new CANNON.Vec3(0.4, 0.4, 0.4)),
          position: new CANNON.Vec3(randomX, -0.6, obstacleZ + worldOffset),
        });
        this.physicsWorld.addBody(obstacleBody);
        obstacleBody.userData = { mesh: obstacle };
        obstacle.userData.physicsBody = obstacleBody;
        this.obstacles.push(obstacleBody);
      }
    }
  }

  updatePhysicsBodies(deltaZ) {
    this.obstacles.forEach((body) => {
      body.position.z += deltaZ;
    });
  }

  cleanupPhysicsBodies(minZ, maxZ, worldOffset) {
    if (!this.physicsWorld) return;
    const obstacleCleanup = [];
    this.obstacles.forEach((body) => {
      const localZ = body.position.z - worldOffset;
      if (localZ < minZ || localZ > maxZ) {
        obstacleCleanup.push(body);
      }
    });
    obstacleCleanup.forEach((body) => {
      this.physicsWorld.removeBody(body);
      const index = this.obstacles.indexOf(body);
      if (index !== -1) {
        this.obstacles.splice(index, 1);
      }
    });
  }
}
