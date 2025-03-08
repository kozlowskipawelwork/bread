'use client'
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
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
    camera.position.set(20, 5, 6);
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

    // Variables for the bread warrior
    let breadWarrior;
    let mixer;
    let walkAction;
    let idleAction;
    let currentAction;
    
    // Load the bread warrior model
    const loader = new GLTFLoader();
    loader.load('/breadwarrior.glb', (gltf) => {
      breadWarrior = gltf.scene;
      breadWarrior.scale.set(1000, 1000, 1000); // Keeping your scale
      breadWarrior.position.set(0, 0, 0); // Set initial position
      scene.add(breadWarrior);
      
      // Set up animation mixer
      mixer = new THREE.AnimationMixer(breadWarrior);
      
      // Get animations
      const animations = gltf.animations;
      
      // Find the walk and idle animations
      const idleAnim = animations.find(anim => anim.name === 'breadidle');
      const walkAnim = animations.find(anim => anim.name === 'breadwalk');
      
      if (idleAnim) {
        idleAction = mixer.clipAction(idleAnim);
        idleAction.setEffectiveTimeScale(1.0);
        idleAction.setEffectiveWeight(1.0);
      } else {
        console.error("Idle animation 'breadidle' not found!");
      }
      
      if (walkAnim) {
        walkAction = mixer.clipAction(walkAnim);
        walkAction.setEffectiveTimeScale(1.0);
        walkAction.setEffectiveWeight(1.0);
      } else {
        console.error("Walk animation 'breadwalk' not found!");
      }
      
      // Start with idle animation
      if (idleAction) {
        idleAction.play();
        currentAction = idleAction;
      }
    });

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    // Movement controls with more immediate response
    const keys = {
      left: false,
      right: false
    };

    // Improved transition between animations
    const setAction = (newAction) => {
      if (currentAction === newAction) return;
      
      if (currentAction) {
        currentAction.fadeOut(0.1);
      }
      
      newAction.reset().fadeIn(0.1).play();
      currentAction = newAction;
    };

    // Key event listeners with immediate direction handling
    const handleKeyDown = (event) => {
      switch (event.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
          keys.left = true;
          if (breadWarrior) {
            breadWarrior.rotation.y = 0; // Immediately face right when moving left
          }
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          keys.right = true;
          if (breadWarrior) {
            breadWarrior.rotation.y = Math.PI; // Immediately face left when moving right
          }
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
    const clock = new THREE.Clock();
    
    const animate = () => {
      requestAnimationFrame(animate);
      
      const delta = clock.getDelta();
      
      // More responsive movement detection
      const isMovingLeft = keys.left;
      const isMovingRight = keys.right;
      const isMoving = isMovingLeft || isMovingRight;
      
      // Update animations and character orientation
      if (breadWarrior && mixer) {
        // Update the animation mixer
        mixer.update(delta);
        
        // Switch animations immediately based on movement
        if (isMoving) {
          if (walkAction && currentAction !== walkAction) {
            setAction(walkAction);
          }
        } else {
          if (idleAction && currentAction !== idleAction) {
            setAction(idleAction);
          }
        }
        
        // Update orientation - handle priority if both keys are pressed
        if (isMovingLeft && isMovingRight) {
          // If both keys are pressed, use the last pressed key
          // This is handled by the keydown event for immediate response
        } else if (isMovingLeft) {
          breadWarrior.rotation.y = 0; // Face right when moving left
        } else if (isMovingRight) {
          breadWarrior.rotation.y = Math.PI; // Face left when moving right
        }
      }
      
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
      
      // Properly dispose animations
      if (mixer) {
        mixer.stopAllAction();
      }
    };
  }, []);

  return null;
};

export default App;