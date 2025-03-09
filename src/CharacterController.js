import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import * as CANNON from 'cannon-es';
import { COLLISION_GROUPS } from './App';
import useHeroStore from './heroStore';

export class CharacterController {
  constructor(scene, physicsWorld, playerMaterial = null) {
    this.scene = scene;
    this.physicsWorld = physicsWorld;
    this.playerMaterial = playerMaterial;
    this.model = null;
    this.physicsBody = null;
    this.mixer = null;
    this.currentAction = null;
    this.animations = {
      idle: null,
      walk: null,
      run: null,
      pickup: null
    };
    this.health = 100;
    this.isCollidingWithObstacle = false;
    this.pickupHasFinished = false;
    this.moveState = {
      left: false,
      right: false,
      shift: false,
      lastDirectionKey: null
    };
    this.init();
    this.setupEventListeners();
  }

  init() {
    const loader = new GLTFLoader();
    loader.load('/breadwarrior.glb', (gltf) => {
      this.model = gltf.scene;
      this.model.scale.set(1000, 1000, 1000);
      this.model.position.set(0, 0, 0);
      this.scene.add(this.model);
      this.createPhysicsBody();
      this.setupAnimations(gltf.animations);
    });
  }

  createPhysicsBody() {
    if (!this.model) return;
    const radius = 0.5;
    const height = 1.5;
    const characterShape = new CANNON.Cylinder(radius, radius, height, 8);
    const quat = new CANNON.Quaternion();
    quat.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), Math.PI / 2);
    this.physicsBody = new CANNON.Body({
      mass: 5,
      position: new CANNON.Vec3(0, 1, 0),
      shape: characterShape,
      material: this.playerMaterial || undefined,
      linearDamping: 0.6,
      angularDamping: 0.9
    });
    this.physicsBody.userData = { type: 'player', name: 'breadWarrior' };
    this.physicsBody.collisionFilterGroup = COLLISION_GROUPS.PLAYER;
    this.physicsBody.collisionFilterMask = COLLISION_GROUPS.OBSTACLE | COLLISION_GROUPS.GROUND | COLLISION_GROUPS.MARKER;
    this.physicsBody.quaternion.copy(quat);
    this.physicsBody.fixedRotation = true;
    this.physicsBody.updateMassProperties();
    this.physicsBody.addEventListener('collide', (event) => {
      if (event.body && event.body.userData && event.body.userData.type === 'obstacle') {
        this.isCollidingWithObstacle = true;
      }
    });
    this.physicsWorld.addBody(this.physicsBody);
  }

  setupAnimations(animations) {
    if (!this.model) return;
    this.mixer = new THREE.AnimationMixer(this.model);
    const idleAnim = animations.find(anim => anim.name === 'breadidle');
    const walkAnim = animations.find(anim => anim.name === 'breadwalk');
    const runAnim = animations.find(anim => anim.name === 'breadrun');
    const pickupAnim = animations.find(anim => anim.name === 'breadpickup');
    if (idleAnim) {
      this.animations.idle = this.mixer.clipAction(idleAnim);
      this.animations.idle.setEffectiveTimeScale(1.0);
      this.animations.idle.setEffectiveWeight(1.0);
    }
    if (walkAnim) {
      this.animations.walk = this.mixer.clipAction(walkAnim);
      this.animations.walk.setEffectiveTimeScale(1.0);
      this.animations.walk.setEffectiveWeight(1.0);
    }
    if (runAnim) {
      this.animations.run = this.mixer.clipAction(runAnim);
      this.animations.run.setEffectiveTimeScale(1.2);
      this.animations.run.setEffectiveWeight(1.0);
    }
    if (pickupAnim) {
      this.animations.pickup = this.mixer.clipAction(pickupAnim);
      this.animations.pickup.setEffectiveTimeScale(1.0);
      this.animations.pickup.setEffectiveWeight(1.0);
      this.animations.pickup.setLoop(THREE.LoopOnce, 1);
      this.animations.pickup.clampWhenFinished = true;
    }
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
    if (this.currentAction === this.animations.pickup) return;
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
      case 'e':
      case 'E':
        if (this.animations.pickup && this.currentAction !== this.animations.pickup && this.isCollidingWithObstacle) {
          this.pickupHasFinished = false;
          this.setAction(this.animations.pickup);
          this.isCollidingWithObstacle = false;
        }
        break;
    }
  }

  handleKeyUp(event) {
    if (this.currentAction === this.animations.pickup) return;
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
      this.model.rotation.y = (this.moveState.lastDirectionKey === 'left') ? 0 : Math.PI;
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
    if (newAction === this.animations.pickup) {
      this.pickupHasFinished = false;
    }
    newAction.reset().fadeIn(0.1).play();
    this.currentAction = newAction;
  }

  update(delta) {
    if (!this.model || !this.physicsBody || !this.mixer) return;
    this.mixer.update(delta);
    if (this.currentAction === this.animations.pickup) {
      const clipDuration = this.animations.pickup.getClip().duration;
      if (this.animations.pickup.time >= clipDuration && !this.pickupHasFinished) {
        this.pickupHasFinished = true;
        this.onPickupFinished();
      }
    } else {
      const isMoving = this.moveState.left || this.moveState.right;
      const isRunning = isMoving && this.moveState.shift;
      if (isMoving) {
        if (isRunning && this.animations.run && this.currentAction !== this.animations.run) {
          this.setAction(this.animations.run);
        } else if (!isRunning && this.animations.walk && this.currentAction !== this.animations.walk) {
          this.setAction(this.animations.walk);
        }
      } else if (this.animations.idle && this.currentAction !== this.animations.idle) {
        this.setAction(this.animations.idle);
      }
    }
    const pos = this.physicsBody.position;
    this.model.position.set(pos.x, pos.y, pos.z);
  }

  onPickupFinished() {
    useHeroStore.getState().addHealth(10);

    if (this.moveState.left || this.moveState.right) {
      if (this.moveState.shift && this.animations.run) {
        this.setAction(this.animations.run);
      } else if (this.animations.walk) {
        this.setAction(this.animations.walk);
      }
    } else if (this.animations.idle) {
      this.setAction(this.animations.idle);
    }
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
    window.removeEventListener('keydown', this.handleKeyDown.bind(this));
    window.removeEventListener('keyup', this.handleKeyUp.bind(this));
    if (this.mixer) {
      this.mixer.stopAllAction();
    }
    if (this.physicsBody && this.physicsWorld) {
      this.physicsWorld.removeBody(this.physicsBody);
    }
    if (this.model && this.scene) {
      this.scene.remove(this.model);
    }
  }
}
