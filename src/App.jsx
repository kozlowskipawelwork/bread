// App.jsx
'use client'
import React, { useEffect, useState } from 'react';
import * as THREE from 'three';
import { createResizeHandler, setupResizeListener } from './utils/resizeHandler';
import { World } from './World';
import * as CANNON from 'cannon-es';
import CannonDebugger from 'cannon-es-debugger';
import { CharacterController } from './CharacterController';
import HeroHealth from './HeroHealth';
import PickupBreadPrompt from './PickupBreadPrompt';

export const COLLISION_GROUPS = {
  PLAYER: 1,
  OBSTACLE: 2,
  MARKER: 4,
  GROUND: 8
};

const App = () => {
  // State to track when to show the pickup prompt
  const [pickupVisible, setPickupVisible] = useState(false);

  useEffect(() => {
    const init = async () => {
      const physicsWorld = new CANNON.World({
        gravity: new CANNON.Vec3(0, 0, 0)
      });
      
      physicsWorld.defaultContactMaterial.friction = 0.1;
      physicsWorld.defaultContactMaterial.restitution = 0.3;
      
      // Improved physics settings
      physicsWorld.broadphase = new CANNON.SAPBroadphase(physicsWorld);
      physicsWorld.solver.iterations = 10;
      physicsWorld.allowSleep = false;
      
      // Set up materials for better collision response
      const playerMaterial = new CANNON.Material('playerMaterial');
      const obstacleMaterial = new CANNON.Material('obstacleMaterial');
      
      const playerObstacleContactMaterial = new CANNON.ContactMaterial(
        playerMaterial,
        obstacleMaterial,
        {
          friction: 0.0,
          restitution: 0.0,     // No bouncing
          contactEquationStiffness: 1e8,
          contactEquationRelaxation: 3,
          frictionEquationStiffness: 0, // No friction response
          contactEquationRegularizationTime: 0.3, // Reduce solving iterations
          collisionResponse: false  // Most important - no physical response
        }
      );
      
      physicsWorld.addContactMaterial(playerObstacleContactMaterial);
      
      // Listen for collision events
      physicsWorld.addEventListener('beginContact', (event) => {
        const bodyA = event.bodyA;
        const bodyB = event.bodyB;
        
        if (
          (bodyA.userData?.type === 'player' && bodyB.userData?.type === 'obstacle') ||
          (bodyA.userData?.type === 'obstacle' && bodyB.userData?.type === 'player')
        ) {
          console.log('CANNON COLLISION DETECTED: Player hit obstacle!');
          // Show the pickup prompt when collision occurs
          setPickupVisible(true);
        }
      });

      physicsWorld.addEventListener('endContact', (event) => {
        const { bodyA, bodyB } = event;
      
        // Player <-> obstacle end of contact
        if (
          (bodyA.userData?.type === 'player' && bodyB.userData?.type === 'obstacle') ||
          (bodyA.userData?.type === 'obstacle' && bodyB.userData?.type === 'player')
        ) {
          setPickupVisible(false);
      
          // Find which one is the character's body, then update the CharacterController
          // If you have a reference to your CharacterController instance as, say, `character`,
          // do something like this:
          if (bodyA.userData?.name === 'breadWarrior') {
            // That means bodyA belongs to the player
            character.isCollidingWithObstacle = false;
          } else if (bodyB.userData?.name === 'breadWarrior') {
            // That means bodyB belongs to the player
            character.isCollidingWithObstacle = false;
          }
        }
      });
      
      
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x111111);
      
      const camera = new THREE.PerspectiveCamera(
        50,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
      );
      camera.position.set(50, 10, 14);
      camera.lookAt(3, 1, 10);
      
      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(window.devicePixelRatio);
      
      // Remove any existing canvas elements and append the new canvas
      document.querySelectorAll('canvas').forEach(canvas => canvas.remove());
      document.body.appendChild(renderer.domElement);
      
      const handleResize = createResizeHandler(camera, renderer);
      const cleanupResizeListener = setupResizeListener(handleResize);
      
      const groundBody = new CANNON.Body({
        type: CANNON.Body.STATIC,
        shape: new CANNON.Box(new CANNON.Vec3(50.0, 0.1, 50.0)),
        position: new CANNON.Vec3(0, -1, 0),
        material: obstacleMaterial
      });
      
      groundBody.userData = { 
        type: 'ground',
        name: 'mainGround'
      };
      groundBody.collisionFilterGroup = COLLISION_GROUPS.GROUND;
      groundBody.collisionFilterMask = COLLISION_GROUPS.PLAYER;
      
      physicsWorld.addBody(groundBody);
      
      const gameWorld = new World(scene, physicsWorld);
      const cannonDebugger = CannonDebugger(scene, physicsWorld);
      const character = new CharacterController(scene, physicsWorld, playerMaterial);
      
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
      scene.add(ambientLight);
      
      const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
      directionalLight.position.set(5, 5, 5);
      scene.add(directionalLight);
      
      // Create debug helper function in window
      window.debugCollision = () => {
        console.log('Debug info:');
        console.log('Character position:', character.physicsBody?.position);
        console.log('Obstacles:', gameWorld.obstacles.obstacles.map(o => ({
          position: o.position,
          adjustedZ: o.position.z - gameWorld.worldGroup.position.z
        })));
        
        // Force collision check
        gameWorld.checkCollisions(character);
      };
      
      const clock = new THREE.Clock();
      const animate = () => {
        requestAnimationFrame(animate);
        const delta = Math.min(clock.getDelta(), 0.1);
        
        physicsWorld.step(1/60, delta, 3);
        cannonDebugger.update();
        
        // Only update if character is ready
        if (character && character.physicsBody) {
          character.update(delta);
          
          const moveDirection = character.getMovementDirection();
          const isRunning = character.isRunning();
          
          const moveSpeed = isRunning ? 0.3 : 0.1;
          
          if (gameWorld) {
            gameWorld.moveSpeed = moveSpeed;
            
            // Pass character to world update for collision detection
            if (moveDirection) {
              gameWorld.update(moveDirection, character);
            } else {
              // Even if not moving, still check collisions
              gameWorld.update(null, character);
            }
          }
        }
        
        renderer.render(scene, camera);
      };
      animate();
      
      return () => {
        cleanupResizeListener();
        character.cleanup();
        document.body.removeChild(renderer.domElement);
      };
    };
    
    init().catch(console.error);
    
    // Global keydown listener for picking up bread
    const handlePickup = (event) => {
      if (event.key === 'e' || event.key === 'E') {
        console.log('Bread pickup triggered');
        setPickupVisible(false);
        // Additional logic to actually pick up the bread can be added here.
      }
    };
    window.addEventListener('keydown', handlePickup);
    
    return () => {
      window.removeEventListener('keydown', handlePickup);
    };
  }, []);
  
  return (
    <>
      {pickupVisible && <PickupBreadPrompt />}
      <HeroHealth />
    </>
  );
};

export default App;
