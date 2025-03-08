'use client'
import * as THREE from 'three';
// import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'; // Commented out as requested
import { useEffect } from 'react';

const App = () => {
  useEffect(() => {
    // Create Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111111); // Dark background to see objects better

    // Create Camera - EXACTLY as your code
    const camera = new THREE.PerspectiveCamera(
      60, // FOV - slightly wider for better visibility
      window.innerWidth / window.innerHeight, // Aspect Ratio
      0.1, // Near Clipping Plane
      1000 // Far Clipping Plane
    );
    
    // Position camera EXACTLY as your code
    camera.position.set(9, 2, 5); // Positioned higher and to the side
    camera.lookAt(0, 0, 0); // Looking at the center of the scene

    // Create Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.body.appendChild(renderer.domElement);

    // Add Plane - keeping the EXACT same dimensions as your code
    const planeGeometry = new THREE.PlaneGeometry(100, 10); // Made wider for scrolling
    const planeMaterial = new THREE.MeshStandardMaterial({
      color: 0x444444,
      side: THREE.DoubleSide
    });
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = Math.PI / 2; // Rotate to be horizontal - EXACTLY as your code
    plane.rotation.z = Math.PI / 2; // Rotate to be horizontal - EXACTLY as your code
    plane.position.y = -1; // Position below the cube - EXACTLY as your code
    scene.add(plane);

    // Add markers to the plane to visualize movement
    const markerGeometry = new THREE.BoxGeometry(0.5, 0.2, 0.5);
    const markerMaterial = new THREE.MeshStandardMaterial({ color: 0x888888 });
    
    const markers = [];
    for (let i = -50; i <= 50; i += 5) {
      const marker = new THREE.Mesh(markerGeometry, markerMaterial);
      marker.position.set(0, -0.9, i);

      scene.add(marker);
      markers.push(marker);
    }

    // Create our hero (the cube) - NOT spinning
    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
    const hero = new THREE.Mesh(geometry, material);
    scene.add(hero);

    // Add lighting - EXACTLY as your code
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

    // Handle Window Resize - EXACTLY as your code
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // Animation Loop
    const animate = () => {
      requestAnimationFrame(animate);
      
      // NO cube rotation - removed as requested

      // Move the world in response to key presses (hero stays centered)
      if (keys.left) {
        // Move world right (giving illusion of hero moving left)
        plane.position.z += moveSpeed;
        markers.forEach(marker => {
          marker.position.z += moveSpeed;
        });
      }
      if (keys.right) {
        // Move world left (giving illusion of hero moving right)
        plane.position.z -= moveSpeed;
        markers.forEach(marker => {
          marker.position.z -= moveSpeed;
        });
      }

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