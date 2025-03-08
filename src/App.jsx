'use client'
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { useEffect } from 'react';
import { createResizeHandler, setupResizeListener } from './utils/resizeHandler';
import { World } from './World';
import * as RAPIER from '@dimforge/rapier3d-compat';

const App = () => {
  useEffect(() => {
    // Async initialization function to load RAPIER
    const init = async () => {
      // Init Rapier physics
      await RAPIER.init();
      
      // Create physics world
      const gravity = { x: 0.0, y: -9.81, z: 0.0 };
      const world = new RAPIER.World(gravity);
      
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
      const groundColliderDesc = RAPIER.ColliderDesc.cuboid(50.0, 0.1, 50.0);
      groundColliderDesc.translation = { x: 0.0, y: -1.0, z: 0.0 };
      world.createCollider(groundColliderDesc);

      // Create our game world
      const gameWorld = new World(scene);

      // Variables for the bread warrior
      let breadWarrior;
      let characterBody;
      let mixer;
      let walkAction;
      let idleAction;
      let runAction;
      let currentAction;
      let canJump = true;

      // Load the bread warrior model
      const loader = new GLTFLoader();
      loader.load('/breadwarrior.glb', (gltf) => {
        breadWarrior = gltf.scene;
        breadWarrior.scale.set(1000, 1000, 1000);
        breadWarrior.position.set(0, 0, 0);
        scene.add(breadWarrior);

        // Create rigid body for character
        const bodyDesc = RAPIER.RigidBodyDesc.dynamic()
          .setTranslation(0, 1, 0)
          .setLinearDamping(1.0)
          .setAngularDamping(1.0);
        
        characterBody = world.createRigidBody(bodyDesc);
        
        // Create character collider
        const colliderDesc = RAPIER.ColliderDesc.capsule(0.5, 0.2);
        world.createCollider(colliderDesc, characterBody);

        // Set up animation mixer
        mixer = new THREE.AnimationMixer(breadWarrior);

        // Get animations
        const animations = gltf.animations;

        // Find animations
        const idleAnim = animations.find(anim => anim.name === 'breadidle');
        const walkAnim = animations.find(anim => anim.name === 'breadwalk');
        const runAnim = animations.find(anim => anim.name === 'breadrun');

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
          runAction.setEffectiveTimeScale(1.2);
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

      // Movement controls
      const keys = {
        left: false,
        right: false,
        shift: false,
        lastDirectionKey: null
      };

      // Animation transition
      const setAction = (newAction) => {
        if (currentAction === newAction) return;

        if (currentAction) {
          currentAction.fadeOut(0.1);
        }

        newAction.reset().fadeIn(0.1).play();
        currentAction = newAction;
      };

      // Function to update character orientation
      const updateCharacterOrientation = () => {
        if (!breadWarrior) return;

        if (keys.left && keys.right) {
          if (keys.lastDirectionKey === 'left') {
            breadWarrior.rotation.y = 0;
          } else if (keys.lastDirectionKey === 'right') {
            breadWarrior.rotation.y = Math.PI;
          }
        } else if (keys.left) {
          breadWarrior.rotation.y = 0;
        } else if (keys.right) {
          breadWarrior.rotation.y = Math.PI;
        }
      };

      // Key event listeners
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
            keys.shift = true;
            break;
        }
      };

      const handleKeyUp = (event) => {
        switch (event.key) {
          case 'ArrowLeft':
          case 'a':
          case 'A':
            keys.left = false;
            if (keys.lastDirectionKey === 'left' && keys.right) {
              keys.lastDirectionKey = 'right';
            }
            updateCharacterOrientation();
            break;
          case 'ArrowRight':
          case 'd':
          case 'D':
            keys.right = false;
            if (keys.lastDirectionKey === 'right' && keys.left) {
              keys.lastDirectionKey = 'left';
            }
            updateCharacterOrientation();
            break;
          case 'Shift':
            keys.shift = false;
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
        const isRunning = isMoving && keys.shift;

        // Update animations and character orientation
        if (breadWarrior && mixer) {
          // Update the animation mixer
          mixer.update(delta);

          // Switch animations based on movement and running state
          if (isMoving) {
            if (isRunning && runAction) {
              if (currentAction !== runAction) {
                setAction(runAction);
              }
            } else if (walkAction) {
              if (currentAction !== walkAction) {
                setAction(walkAction);
              }
            }
          } else {
            if (idleAction && currentAction !== idleAction) {
              setAction(idleAction);
            }
          }
        }

        // Set the appropriate speed based on running state
        const moveSpeed = isRunning ? 0.3 : 0.1;

        // Update world based on key presses and priority
        if (gameWorld && gameWorld.moveSpeed !== undefined) {
          gameWorld.moveSpeed = moveSpeed;
        }

        // Update physics
        world.step();

        // Sync character with physics
        if (characterBody && breadWarrior) {
          const pos = characterBody.translation();
          breadWarrior.position.set(pos.x, pos.y, pos.z);
        }

        // Update world based on key presses
        if (keys.left && keys.right) {
          if (keys.lastDirectionKey === 'left') {
            gameWorld.update('left');
          } else if (keys.lastDirectionKey === 'right') {
            gameWorld.update('right');
          }
        } else if (keys.left) {
          gameWorld.update('left');
        } else if (keys.right) {
          gameWorld.update('right');
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

        // Cleanup physics
        world.free();

        // Properly dispose animations
        if (mixer) {
          mixer.stopAllAction();
        }
      };
    };

    // Start initialization
    init().catch(console.error);
  }, []);

  return null;
};

export default App;