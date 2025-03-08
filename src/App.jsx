'use client'
import * as THREE from 'three';
import { useEffect } from 'react';

const App = () => {
  useEffect(() => {
    // Create Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111111);

    // Create Camera
    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    
    camera.position.set(9, 2, 5);
    camera.lookAt(0, 0, 0);

    // Create Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.body.appendChild(renderer.domElement);

    // INFINITE SCROLLING SETUP
    // Create multiple ground segments that will be recycled
    const segmentLength = 20; // Length of each ground segment
    const visibleSegments = 5; // Number of segments visible at any time
    const segmentPool = []; // Pool of ground segments to recycle
    
    // Create ground segments
    for (let i = 0; i < visibleSegments; i++) {
      // Create a ground segment
      const planeGeometry = new THREE.PlaneGeometry(10, segmentLength);
      const planeMaterial = new THREE.MeshStandardMaterial({
        color: i % 2 === 0 ? 0x444444 : 0x555555, // Alternate colors for visibility
        side: THREE.DoubleSide
      });
      
      const segment = new THREE.Mesh(planeGeometry, planeMaterial);
      segment.rotation.x = Math.PI / 2;
      segment.rotation.z = Math.PI / 2;
      segment.position.y = -1;
      segment.position.z = -i * segmentLength; // Initial position, spaced out
      
      scene.add(segment);
      segmentPool.push(segment);
      
      // Add markers to each segment
      addMarkersToSegment(segment, i, segmentLength);
    }
    
    // Function to add markers to a segment
    function addMarkersToSegment(segment, segmentIndex, segmentLength) {
      const markers = [];
      const markerCount = 5; // Number of markers per segment
      
      for (let j = 0; j < markerCount; j++) {
        const markerGeometry = new THREE.BoxGeometry(0.5, 0.2, 0.5);
        // Use different colors for different segment types
        const markerColor = segmentIndex % 2 === 0 ? 0x888888 : 0x777777;
        const markerMaterial = new THREE.MeshStandardMaterial({ color: markerColor });
        
        const marker = new THREE.Mesh(markerGeometry, markerMaterial);
        
        // Position marker within the segment
        const zPos = -segmentIndex * segmentLength - j * (segmentLength / markerCount);
        marker.position.set(0, -0.9, zPos);
        
        scene.add(marker);
        markers.push(marker);
        
        // Store markers with their parent segment for recycling
        if (!segment.userData.markers) {
          segment.userData.markers = [];
        }
        segment.userData.markers.push(marker);
      }
      
      // Add some random obstacles to some segments
      if (segmentIndex > 0 && Math.random() > 0.5) {
        const obstacleGeometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
        const obstacleMaterial = new THREE.MeshStandardMaterial({ color: 0xdd3333 });
        const obstacle = new THREE.Mesh(obstacleGeometry, obstacleMaterial);
        
        // Random position within segment
        const randomX = (Math.random() * 6) - 3; // Between -3 and 3
        const zPos = -segmentIndex * segmentLength - segmentLength * 0.5;
        obstacle.position.set(randomX, -0.6, zPos);
        
        scene.add(obstacle);
        
        if (!segment.userData.obstacles) {
          segment.userData.obstacles = [];
        }
        segment.userData.obstacles.push(obstacle);
      }
    }
    
    // Function to recycle a segment when it goes off-screen
    function recycleSegment(segment, newPosition) {
      // Move the segment
      segment.position.z = newPosition;
      
      // Move all associated markers
      if (segment.userData.markers) {
        const markerCount = segment.userData.markers.length;
        segment.userData.markers.forEach((marker, idx) => {
          marker.position.z = newPosition - idx * (segmentLength / markerCount);
        });
      }
      
      // Move any obstacles
      if (segment.userData.obstacles) {
        segment.userData.obstacles.forEach(obstacle => {
          // Keep X position, update Z relative to segment
          const offsetZ = obstacle.position.z - segment.position.z;
          obstacle.position.z = newPosition + offsetZ;
        });
      }
    }

    // Create our hero (the cube)
    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
    const hero = new THREE.Mesh(geometry, material);
    scene.add(hero);

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    // Movement controls
    const moveSpeed = 0.1;
    const keys = {
      left: false,
      right: false
    };

    // Key event listeners
    const handleKeyDown = (event) => {
      switch (event.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
          keys.left = true;
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          keys.right = true;
          break;
      }
    };

    const handleKeyUp = (event) => {
      switch (event.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
          keys.left = false;
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          keys.right = false;
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Handle Window Resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // Game state
    let scrollPosition = 0;
    const scrollThreshold = segmentLength;

    // Animation Loop
    const animate = () => {
      requestAnimationFrame(animate);
      
      // Move the world
      if (keys.left) {
        // Move world backward (giving illusion of hero moving left)
        segmentPool.forEach(segment => {
          segment.position.z -= moveSpeed;
          
          // Move associated markers
          if (segment.userData.markers) {
            segment.userData.markers.forEach(marker => {
              marker.position.z -= moveSpeed;
            });
          }
          
          // Move associated obstacles
          if (segment.userData.obstacles) {
            segment.userData.obstacles.forEach(obstacle => {
              obstacle.position.z -= moveSpeed;
            });
          }
        });
        
        scrollPosition += moveSpeed;
      }
      
      if (keys.right) {
        // Move world forward (giving illusion of hero moving right)
        segmentPool.forEach(segment => {
          segment.position.z += moveSpeed;
          
          // Move associated markers
          if (segment.userData.markers) {
            segment.userData.markers.forEach(marker => {
              marker.position.z += moveSpeed;
            });
          }
          
          // Move associated obstacles
          if (segment.userData.obstacles) {
            segment.userData.obstacles.forEach(obstacle => {
              obstacle.position.z += moveSpeed;
            });
          }
        });
        
        scrollPosition -= moveSpeed;
      }
      
      // Check if we need to recycle segments
      segmentPool.forEach(segment => {
        // If a segment has moved far enough past the camera, recycle it
        if (segment.position.z > scrollThreshold) {
          // Find the current farthest segment in the negative z direction
          const farthestSegment = segmentPool.reduce((prev, curr) => 
            curr.position.z < prev.position.z ? curr : prev, segment);
          
          // Place this segment behind the farthest one
          recycleSegment(segment, farthestSegment.position.z - segmentLength);
        }
        // If a segment has moved far enough in the negative direction, recycle it
        else if (segment.position.z < -scrollThreshold * visibleSegments) {
          // Find the current farthest segment in the positive z direction
          const farthestSegment = segmentPool.reduce((prev, curr) => 
            curr.position.z > prev.position.z ? curr : prev, segment);
          
          // Place this segment ahead of the farthest one
          recycleSegment(segment, farthestSegment.position.z + segmentLength);
        }
      });

      // Render Scene
      renderer.render(scene, camera);
    };
    animate();

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      document.body.removeChild(renderer.domElement);
    };
  }, []);

  return null;
};

export default App;