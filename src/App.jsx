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
  const [pickupVisible, setPickupVisible] = useState(false);

  useEffect(() => {
    const init = async () => {
      const physicsWorld = new CANNON.World({
        gravity: new CANNON.Vec3(0, 0, 0)
      });
      
      physicsWorld.defaultContactMaterial.friction = 0.1;
      physicsWorld.defaultContactMaterial.restitution = 0.3;
      
      physicsWorld.broadphase = new CANNON.SAPBroadphase(physicsWorld);
      physicsWorld.solver.iterations = 10;
      physicsWorld.allowSleep = false;
      
      const playerMaterial = new CANNON.Material('playerMaterial');
      const obstacleMaterial = new CANNON.Material('obstacleMaterial');
      
      const playerObstacleContactMaterial = new CANNON.ContactMaterial(
        playerMaterial,
        obstacleMaterial,
        {
          friction: 0.0,
          restitution: 0.0,
          contactEquationStiffness: 1e8,
          contactEquationRelaxation: 3,
          frictionEquationStiffness: 0,
          contactEquationRegularizationTime: 0.3,
          collisionResponse: false
        }
      );
      
      physicsWorld.addContactMaterial(playerObstacleContactMaterial);
      
      physicsWorld.addEventListener('beginContact', (event) => {
        const bodyA = event.bodyA;
        const bodyB = event.bodyB;
        
        if (
          (bodyA.userData?.type === 'player' && bodyB.userData?.type === 'obstacle') ||
          (bodyA.userData?.type === 'obstacle' && bodyB.userData?.type === 'player')
        ) {
          console.log('CANNON COLLISION DETECTED: Player hit obstacle!');
          setPickupVisible(true);
        }
      });

      physicsWorld.addEventListener('endContact', (event) => {
        const { bodyA, bodyB } = event;
      
        if (
          (bodyA.userData?.type === 'player' && bodyB.userData?.type === 'obstacle') ||
          (bodyA.userData?.type === 'obstacle' && bodyB.userData?.type === 'player')
        ) {
          setPickupVisible(false);
      
          if (bodyA.userData?.name === 'breadWarrior') {
            character.isCollidingWithObstacle = false;
          } else if (bodyB.userData?.name === 'breadWarrior') {
            character.isCollidingWithObstacle = false;
          }
        }
      });
      
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x111111);

      const camera = new THREE.PerspectiveCamera(
        90,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
      );

      camera.position.set(10, 4, 0);
      camera.lookAt(0, 1, 0);
      
      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(window.devicePixelRatio);
      
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
        //const cannonDebugger = CannonDebugger(scene, physicsWorld);
      const character = new CharacterController(scene, physicsWorld, playerMaterial);
      
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
      scene.add(ambientLight);
      
      const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
      directionalLight.position.set(5, 5, 5);
      scene.add(directionalLight);
      
      window.debugCollision = () => {
        console.log('Debug info:');
        console.log('Character position:', character.physicsBody?.position);
        console.log('Obstacles:', gameWorld.obstacles.obstacles.map(o => ({
          position: o.position,
          adjustedZ: o.position.z - gameWorld.worldGroup.position.z
        })));
        gameWorld.checkCollisions(character);
      };
      
      const clock = new THREE.Clock();
      const animate = () => {
        requestAnimationFrame(animate);
        const delta = Math.min(clock.getDelta(), 0.1);
        
        physicsWorld.step(1/60, delta, 3);
        
        if (character && character.physicsBody) {
          character.update(delta);
          
          const moveDirection = character.getMovementDirection();
          const isRunning = character.isRunning();
          
          const moveSpeed = isRunning ? 0.3 : 0.1;
          
          if (gameWorld) {
            gameWorld.moveSpeed = moveSpeed;
            
            if (moveDirection) {
              gameWorld.update(moveDirection, character);
            } else {
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
    
    const handlePickup = (event) => {
      if (event.key === 'e' || event.key === 'E') {
        console.log('Bread pickup triggered');
        setPickupVisible(false);
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
