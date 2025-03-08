// World.js
import * as THREE from 'three';

export class World {
  constructor(scene) {
    this.scene = scene;
    this.worldGroup = new THREE.Group();
    this.scene.add(this.worldGroup);
    
    // Configuration
    this.segmentLength = 20;
    this.visibleSegments = 7;
    this.moveSpeed = 0.1;
    
    // Create segments array and initialize world
    this.segments = [];
    this.initializeWorld();
  }
  
  initializeWorld() {
    // Create initial set of segments
    for (let i = -Math.floor(this.visibleSegments/2); i <= Math.floor(this.visibleSegments/2); i++) {
      this.createSegment(i * this.segmentLength);
    }
  }
  
  // Create a segment at the specified z position
  createSegment(zPosition) {
    const planeGeometry = new THREE.PlaneGeometry(10, this.segmentLength);
    const planeMaterial = new THREE.MeshStandardMaterial({
      color: Math.abs(Math.floor(zPosition / this.segmentLength)) % 2 === 0 ? 0x444444 : 0x555555,
      side: THREE.DoubleSide
    });
    
    const segment = new THREE.Mesh(planeGeometry, planeMaterial);
    segment.rotation.x = Math.PI / 2;
    segment.rotation.z = Math.PI / 2;
    segment.position.y = -1;
    segment.position.z = zPosition;
    
    this.worldGroup.add(segment);
    this.segments.push(segment);
    
    // Add markers
    const markers = [];
    for (let j = 0; j < 5; j++) {
      const markerGeometry = new THREE.BoxGeometry(0.5, 0.2, 0.5);
      const markerMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x888888 
      });
      
      const marker = new THREE.Mesh(markerGeometry, markerMaterial);
      marker.position.set(0, -0.9, zPosition - j * (this.segmentLength / 5));
      
      this.worldGroup.add(marker);
      markers.push(marker);
    }
    
    // Add random obstacles (but not on the starting segment)
    if (Math.abs(zPosition) > this.segmentLength && Math.random() > 0.5) {
      const obstacleGeometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
      const obstacleMaterial = new THREE.MeshStandardMaterial({ color: 0xdd3333 });
      const obstacle = new THREE.Mesh(obstacleGeometry, obstacleMaterial);
      
      const randomX = (Math.random() * 6) - 3;
      obstacle.position.set(randomX, -0.6, zPosition - this.segmentLength * 0.5);
      
      this.worldGroup.add(obstacle);
    }
    
    return segment;
  }
  
  update(moveDirection) {
    // Move the world based on direction and current move speed
    if (moveDirection === 'left') {
      this.worldGroup.position.z -= this.moveSpeed;
    } else if (moveDirection === 'right') {
      this.worldGroup.position.z += this.moveSpeed;
    }
    
    // Check visible range (camera is at 0,0,0 in world space)
    // Adjust the visible range based on speed to ensure smooth loading at higher speeds
    const speedFactor = this.moveSpeed / 0.1; // Calculate how much faster we're moving
    const visibleRangeStart = -this.worldGroup.position.z - this.segmentLength * 3 * speedFactor;
    const visibleRangeEnd = -this.worldGroup.position.z + this.segmentLength * 3 * speedFactor;
    
    // Find the min and max Z positions of current segments
    let minZ = Infinity;
    let maxZ = -Infinity;
    
    this.segments.forEach(segment => {
      minZ = Math.min(minZ, segment.position.z);
      maxZ = Math.max(maxZ, segment.position.z);
    });
    
    // Add segments if needed
    if (visibleRangeStart < minZ) {
      // Need to add more segments at the beginning
      this.createSegment(minZ - this.segmentLength);
    }
    
    if (visibleRangeEnd > maxZ) {
      // Need to add more segments at the end
      this.createSegment(maxZ + this.segmentLength);
    }
    
    // Remove segments that are far out of view
    // This keeps memory usage in check during extended gameplay
    const cleanup = [];
    this.segments.forEach(segment => {
      if (segment.position.z < visibleRangeStart - this.segmentLength * 2 || 
          segment.position.z > visibleRangeEnd + this.segmentLength * 2) {
        cleanup.push(segment);
      }
    });
    
    // Remove the out-of-range segments
    cleanup.forEach(segment => {
      this.worldGroup.remove(segment);
      const index = this.segments.indexOf(segment);
      if (index !== -1) {
        this.segments.splice(index, 1);
      }
    });
  }
  
  // Method to change the move speed
  setMoveSpeed(speed) {
    this.moveSpeed = speed;
  }
  
  reset() {
    // Clear all segments
    this.segments.forEach(segment => {
      this.worldGroup.remove(segment);
    });
    this.segments = [];
    
    // Reset position
    this.worldGroup.position.set(0, 0, 0);
    
    // Reset to default walking speed
    this.moveSpeed = 0.1;
    
    // Rebuild world
    this.initializeWorld();
  }
}