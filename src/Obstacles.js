// Obstacles.js
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { COLLISION_GROUPS } from './App';
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
      const randomX = 0;  // Fixed position for testing
      const obstacleZ = zPosition - this.segmentLength * 0.5;
      const obstacle = new THREE.Mesh(obstacleGeometry, obstacleMaterial);
      obstacle.position.set(randomX, 0, obstacleZ);
      this.worldGroup.add(obstacle);
      
      if (this.physicsWorld) {
        // Create a ghost body for collision detection only
        const obstacleBody = new CANNON.Body({
          type: CANNON.Body.STATIC,
          shape: new CANNON.Box(new CANNON.Vec3(0.4, 0.4, 0.4)),
          position: new CANNON.Vec3(randomX, 0.5, obstacleZ + worldOffset),
          collisionResponse: false  // This makes it a "ghost" body - detects collisions but doesn't respond
        });
        
        // Add userData for collision identification
        obstacleBody.userData = { 
          type: 'obstacle',
          id: `obstacle-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          name: 'redCube',
          mesh: obstacle  // Store mesh reference directly
        };
        
        // Set collision groups
        obstacleBody.collisionFilterGroup = COLLISION_GROUPS.OBSTACLE;
        obstacleBody.collisionFilterMask = COLLISION_GROUPS.PLAYER;
        
        this.physicsWorld.addBody(obstacleBody);
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
      // Remove the mesh from the scene if it exists
      if (body.userData && body.userData.mesh) {
        this.worldGroup.remove(body.userData.mesh);
      }
      
      // Remove the body from the physics world
      this.physicsWorld.removeBody(body);
      
      // Remove from our array
      const index = this.obstacles.indexOf(body);
      if (index !== -1) {
        this.obstacles.splice(index, 1);
      }
    });
  }
}