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
    camera.position.set(20, 5, 3);
    camera.lookAt(0, 0, 0);

    // Create Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.body.appendChild(renderer.domElement);

    // Set up window resize handler using our utility
    const handleResize = createResizeHandler(camera, renderer);
    const cleanupResizeListener = setupResizeListener(handleResize);

    // Create our world with configurable speed
    const world = new World(scene);

    // Variables for the bread warrior
    let breadWarrior;
    let mixer;
    let walkAction;
    let idleAction;
    let runAction; // New variable for run animation
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

      // Find the walk, idle, and run animations
      const idleAnim = animations.find(anim => anim.name === 'breadidle');
      const walkAnim = animations.find(anim => anim.name === 'breadwalk');
      const runAnim = animations.find(anim => anim.name === 'breadrun'); // Get the run animation

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

      if (runAnim) {
        runAction = mixer.clipAction(runAnim);
        runAction.setEffectiveTimeScale(1.2); // Make the run animation slightly faster
        runAction.setEffectiveWeight(1.0);
      } else {
        console.error("Run animation 'breadrun' not found!");
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
      right: false,
      shift: false, // Add shift key state
      lastDirectionKey: null // Track the last direction key pressed
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

    // Function to update character orientation based on the active direction
    const updateCharacterOrientation = () => {
      if (!breadWarrior) return;

      // If both keys are pressed, use the last direction key
      if (keys.left && keys.right) {
        if (keys.lastDirectionKey === 'left') {
          breadWarrior.rotation.y = 0; // Face right when moving left
        } else if (keys.lastDirectionKey === 'right') {
          breadWarrior.rotation.y = Math.PI; // Face left when moving right
        }
      } else if (keys.left) {
        breadWarrior.rotation.y = 0; // Face right when moving left
      } else if (keys.right) {
        breadWarrior.rotation.y = Math.PI; // Face left when moving right
      }
    };

    // Key event listeners with improved priority handling
    const handleKeyDown = (event) => {
      switch (event.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
          keys.left = true;
          keys.lastDirectionKey = 'left';
          updateCharacterOrientation();
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          keys.right = true;
          keys.lastDirectionKey = 'right';
          updateCharacterOrientation();
          break;
        case 'Shift':
          keys.shift = true; // Set shift key state to true
          break;
      }
    };

    const handleKeyUp = (event) => {
      switch (event.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
          keys.left = false;
          // If this was the last pressed key and right is still down, make right the active direction
          if (keys.lastDirectionKey === 'left' && keys.right) {
            keys.lastDirectionKey = 'right';
          }
          updateCharacterOrientation();
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          keys.right = false;
          // If this was the last pressed key and left is still down, make left the active direction
          if (keys.lastDirectionKey === 'right' && keys.left) {
            keys.lastDirectionKey = 'left';
          }
          updateCharacterOrientation();
          break;
        case 'Shift':
          keys.shift = false; // Set shift key state to false
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
      const isRunning = isMoving && keys.shift; // Check if player is running

      // Update animations and character orientation
      if (breadWarrior && mixer) {
        // Update the animation mixer
        mixer.update(delta);

        // Switch animations based on movement and running state
        if (isMoving) {
          if (isRunning && runAction) {
            // Use running animation when moving and shift is pressed
            if (currentAction !== runAction) {
              setAction(runAction);
            }
          } else if (walkAction) {
            // Use walking animation when moving without shift
            if (currentAction !== walkAction) {
              setAction(walkAction);
            }
          }
        } else {
          // Use idle animation when not moving
          if (idleAction && currentAction !== idleAction) {
            setAction(idleAction);
          }
        }

        // Character orientation is handled by the updateCharacterOrientation function
      }

      // Set the appropriate speed based on running state
      const moveSpeed = isRunning ? 0.3 : 0.1;

      // Update world.moveSpeed if available
      if (world && world.moveSpeed !== undefined) {
        world.moveSpeed = moveSpeed;
      }

      // Update world based on key presses and priority
      if (keys.left && keys.right) {
        // If both keys are pressed, use the last direction key pressed
        if (keys.lastDirectionKey === 'left') {
          world.update('left');
        } else if (keys.lastDirectionKey === 'right') {
          world.update('right');
        }
      } else if (keys.left) {
        world.update('left');
      } else if (keys.right) {
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