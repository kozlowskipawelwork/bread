'use client'
import * as THREE from 'three';
import { useEffect } from 'react';
import { createResizeHandler, setupResizeListener } from './utils/resizeHandler';
import { World } from './World';

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

    // Set up window resize handler using our utility
    const handleResize = createResizeHandler(camera, renderer);
    const cleanupResizeListener = setupResizeListener(handleResize);

    // Create our world
    const world = new World(scene);

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

    // Animation Loop
    const animate = () => {
      requestAnimationFrame(animate);
      
      // Update world based on key presses
      if (keys.left) {
        world.update('left');
      }
      
      if (keys.right) {
        world.update('right');
      }
      
      // Render Scene
      renderer.render(scene, camera);
    };
    animate();

    // Cleanup
    return () => {
      cleanupResizeListener();
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      document.body.removeChild(renderer.domElement);
    };
  }, []);

  return null;
};

export default App;