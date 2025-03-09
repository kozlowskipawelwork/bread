// CharacterController.js
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import * as CANNON from 'cannon-es';
import { COLLISION_GROUPS } from './App';

export class CharacterController {
  constructor(scene, physicsWorld, playerMaterial = null) {
    this.scene = scene;
    this.physicsWorld = physicsWorld;
    this.playerMaterial = playerMaterial;
    
    // Character properties
    this.model = null;
    this.physicsBody = null;
    this.mixer = null;
    this.currentAction = null;
    this.animations = {
      idle: null,
      walk: null,
      run: null
    };
    
    // Movement state
    this.moveState = {
      left: false,
      right: false,
      shift: false,
      lastDirectionKey: null
    };
    
    // Initialize character
    this.init();
    this.setupEventListeners();
  }
  
  init() {
    // Load the character model
    const loader = new GLTFLoader();
    loader.load('/breadwarrior.glb', (gltf) => {
      this.model = gltf.scene;
      this.model.scale.set(1000, 1000, 1000);
      this.model.position.set(0, 0, 0);
      this.scene.add(this.model);
      
      // Create physics body
      this.createPhysicsBody();
      
      // Set up animations
      this.setupAnimations(gltf.animations);
    });
  }
  
  createPhysicsBody() {
    if (!this.model) return;
    
    // Create a cylinder shape for character
    const radius = 0.5;
    const height = 1.5;  // Increased height for better collision
    
    const characterShape = new CANNON.Cylinder(
      radius,    // top radius
      radius,    // bottom radius
      height,    // height
      8          // segments
    );
    
    // Rotate the capsule to stand upright (y-axis)
    const quat = new CANNON.Quaternion();
    quat.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), Math.PI / 2);
    
    this.physicsBody = new CANNON.Body({
      mass: 5,
      position: new CANNON.Vec3(0, 1, 0),
      shape: characterShape,
      material: this.playerMaterial || undefined,  // Use provided material if available
      linearDamping: 0.6,
      angularDamping: 0.9
    });
    
    // Add userData for collision identification
    this.physicsBody.userData = { 
      type: 'player',
      name: 'breadWarrior'
    };
    
    // Set collision groups
    this.physicsBody.collisionFilterGroup = COLLISION_GROUPS.PLAYER;
    this.physicsBody.collisionFilterMask = COLLISION_GROUPS.OBSTACLE | COLLISION_GROUPS.GROUND | COLLISION_GROUPS.MARKER;
    
    // Apply the rotation to the body
    this.physicsBody.quaternion.copy(quat);
    
    // Lock rotation to prevent tipping over
    this.physicsBody.fixedRotation = true;
    this.physicsBody.updateMassProperties();
    
    this.physicsWorld.addBody(this.physicsBody);
  }
  
  
  setupAnimations(animations) {
    if (!this.model) return;
    
    // Create animation mixer
    this.mixer = new THREE.AnimationMixer(this.model);
    
    // Find animations by name
    const idleAnim = animations.find(anim => anim.name === 'breadidle');
    const walkAnim = animations.find(anim => anim.name === 'breadwalk');
    const runAnim = animations.find(anim => anim.name === 'breadrun');
    
    // Set up actions
    if (idleAnim) {
      this.animations.idle = this.mixer.clipAction(idleAnim);
      this.animations.idle.setEffectiveTimeScale(1.0);
      this.animations.idle.setEffectiveWeight(1.0);
    } else {
      console.error("Idle animation 'breadidle' not found!");
    }
    
    if (walkAnim) {
      this.animations.walk = this.mixer.clipAction(walkAnim);
      this.animations.walk.setEffectiveTimeScale(1.0);
      this.animations.walk.setEffectiveWeight(1.0);
    } else {
      console.error("Walk animation 'breadwalk' not found!");
    }
    
    if (runAnim) {
      this.animations.run = this.mixer.clipAction(runAnim);
      this.animations.run.setEffectiveTimeScale(1.2);
      this.animations.run.setEffectiveWeight(1.0);
    } else {
      console.error("Run animation 'breadrun' not found!");
    }
    
    // Start with idle animation
    if (this.animations.idle) {
      this.animations.idle.play();
      this.currentAction = this.animations.idle;
    }
  }
  
  setupEventListeners() {
    window.addEventListener('keydown', this.handleKeyDown.bind(this));
    window.addEventListener('keyup', this.handleKeyUp.bind(this));
  }
  
  handleKeyDown(event) {
    switch (event.key) {
      case 'ArrowLeft':
      case 'a':
      case 'A':
        this.moveState.left = true;
        this.moveState.lastDirectionKey = 'left';
        this.updateOrientation();
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        this.moveState.right = true;
        this.moveState.lastDirectionKey = 'right';
        this.updateOrientation();
        break;
      case 'Shift':
        this.moveState.shift = true;
        break;
    }
  }
  
  handleKeyUp(event) {
    switch (event.key) {
      case 'ArrowLeft':
      case 'a':
      case 'A':
        this.moveState.left = false;
        if (this.moveState.lastDirectionKey === 'left' && this.moveState.right) {
          this.moveState.lastDirectionKey = 'right';
        }
        this.updateOrientation();
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        this.moveState.right = false;
        if (this.moveState.lastDirectionKey === 'right' && this.moveState.left) {
          this.moveState.lastDirectionKey = 'left';
        }
        this.updateOrientation();
        break;
      case 'Shift':
        this.moveState.shift = false;
        break;
    }
  }
  
  updateOrientation() {
    if (!this.model) return;
    
    if (this.moveState.left && this.moveState.right) {
      if (this.moveState.lastDirectionKey === 'left') {
        this.model.rotation.y = 0;
      } else if (this.moveState.lastDirectionKey === 'right') {
        this.model.rotation.y = Math.PI;
      }
    } else if (this.moveState.left) {
      this.model.rotation.y = 0;
    } else if (this.moveState.right) {
      this.model.rotation.y = Math.PI;
    }
  }
  
  setAction(newAction) {
    if (this.currentAction === newAction) return;
    
    if (this.currentAction) {
      this.currentAction.fadeOut(0.1);
    }
    
    newAction.reset().fadeIn(0.1).play();
    this.currentAction = newAction;
  }
  
  update(delta) {
    if (!this.model || !this.physicsBody || !this.mixer) return;
    
    // Update the animation mixer
    this.mixer.update(delta);
    
    // Determine movement state
    const isMoving = this.moveState.left || this.moveState.right;
    const isRunning = isMoving && this.moveState.shift;
    
    // Update animations based on movement
    if (isMoving) {
      if (isRunning && this.animations.run) {
        if (this.currentAction !== this.animations.run) {
          this.setAction(this.animations.run);
        }
      } else if (this.animations.walk) {
        if (this.currentAction !== this.animations.walk) {
          this.setAction(this.animations.walk);
        }
      }
    } else {
      if (this.animations.idle && this.currentAction !== this.animations.idle) {
        this.setAction(this.animations.idle);
      }
    }
    
    // Sync model with physics body
    const pos = this.physicsBody.position;
    this.model.position.set(pos.x, pos.y, pos.z);
  }
  
  getMovementDirection() {
    if (this.moveState.left && this.moveState.right) {
      return this.moveState.lastDirectionKey;
    } else if (this.moveState.left) {
      return 'left';
    } else if (this.moveState.right) {
      return 'right';
    }
    return null;
  }
  
  isRunning() {
    return (this.moveState.left || this.moveState.right) && this.moveState.shift;
  }
  
  cleanup() {
    // Remove event listeners
    window.removeEventListener('keydown', this.handleKeyDown.bind(this));
    window.removeEventListener('keyup', this.handleKeyUp.bind(this));
    
    // Stop animations
    if (this.mixer) {
      this.mixer.stopAllAction();
    }
    
    // Remove physics body
    if (this.physicsBody && this.physicsWorld) {
      this.physicsWorld.removeBody(this.physicsBody);
    }
    
    // Remove model from scene
    if (this.model && this.scene) {
      this.scene.remove(this.model);
    }
  }
}