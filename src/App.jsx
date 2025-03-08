'use client'
import * as THREE from 'three';
import { useEffect } from 'react';
import { createResizeHandler, setupResizeListener } from './utils/resizeHandler';
import { World } from './World';
import * as CANNON from 'cannon-es';
import CannonDebugger from 'cannon-es-debugger';
import { CharacterController } from './CharacterController';

const App = () => {
  useEffect(() => {
    const init = async () => {
      // Create Cannon physics world with no gravity
      const physicsWorld = new CANNON.World({
        gravity: new CANNON.Vec3(0, 0, 0)
      });
      
      // Set up physics world
      physicsWorld.defaultContactMaterial.friction = 0.1;
      physicsWorld.defaultContactMaterial.restitution = 0.3;
      
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
      camera.position.set(20, 5, 3);
      camera.lookAt(0, 0, 0);

      // Create Renderer
      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(window.devicePixelRatio);
      
      // Remove any existing canvas before adding a new one
      document.querySelectorAll('canvas').forEach(canvas => canvas.remove());
      document.body.appendChild(renderer.domElement);

      // Set up window resize handler using our utility
      const handleResize = createResizeHandler(camera, renderer);
      const cleanupResizeListener = setupResizeListener(handleResize);

      // Create ground collider
      const groundBody = new CANNON.Body({
        type: CANNON.Body.STATIC,
        shape: new CANNON.Box(new CANNON.Vec3(50.0, 0.1, 50.0)),
        position: new CANNON.Vec3(0, -1, 0)
      });
      physicsWorld.addBody(groundBody);

      // Create our game world
      const gameWorld = new World(scene, physicsWorld);

      // Set up Cannon.js debugger
      const cannonDebugger = CannonDebugger(scene, physicsWorld);

      // Create character controller
      const character = new CharacterController(scene, physicsWorld);

      // Add lighting
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
      scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
      directionalLight.position.set(5, 5, 5);
      scene.add(directionalLight);

      // Animation Loop
      const clock = new THREE.Clock();

      const animate = () => {
        requestAnimationFrame(animate);

        const delta = Math.min(clock.getDelta(), 0.1); // Cap delta to avoid huge jumps

        // Step the physics world
        physicsWorld.step(1/60, delta, 3);
        
        // Update the cannon debugger
        cannonDebugger.update();

        // Update character
        character.update(delta);
        
        // Get movement info from character controller
        const moveDirection = character.getMovementDirection();
        const isRunning = character.isRunning();
        
        // Set the appropriate speed based on running state
        const moveSpeed = isRunning ? 0.3 : 0.1;
        
        // Update world speed and direction
        if (gameWorld) {
          gameWorld.moveSpeed = moveSpeed;
          
          if (moveDirection) {
            gameWorld.update(moveDirection);
          }
        }

        // Render Scene
        renderer.render(scene, camera);
      };

      animate();

      // Cleanup
      return () => {
        cleanupResizeListener();
        character.cleanup();
        document.body.removeChild(renderer.domElement);
      };
    };

    // Start initialization
    init().catch(console.error);
  }, []);

  return null;
};

export default App;