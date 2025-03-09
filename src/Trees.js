import * as THREE from 'three';

export class Trees {
  constructor(worldGroup, segmentLength) {
    this.worldGroup = worldGroup;
    this.segmentLength = segmentLength;
    this.trees = [];
    this.xRange = { min: -5, max: 5 };
  }

  setXRange(min, max) {
    this.xRange.min = min;
    this.xRange.max = max;
  }

  getRandomXPosition() {
    return Math.random() * (this.xRange.max - this.xRange.min) + this.xRange.min;
  }

  createTreeModel() {
    const trunkGeometry = new THREE.CylinderGeometry(0.2, 0.3, 1.5, 8);
    const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.y = 0.75;

    const leavesGeometry = new THREE.ConeGeometry(1, 2, 8);
    const leavesMaterial = new THREE.MeshStandardMaterial({ color: 0x228B22 });
    const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
    leaves.position.y = 2.5;

    const treeGroup = new THREE.Group();
    treeGroup.scale.set(5, 5, 5)
    treeGroup.add(trunk);
    treeGroup.add(leaves);

    return treeGroup;
  }

  createTrees(zPosition) {
    const treesCount = Math.floor(Math.random() * 3) + 2;

    for (let j = 0; j < treesCount; j++) {
      const tree = this.createTreeModel();
      const treeZ = zPosition - Math.random() * this.segmentLength;
      const treeX = this.getRandomXPosition();

      tree.position.set(treeX - 20, 0, treeZ);
      this.worldGroup.add(tree);
      this.trees.push(tree);
    }
  }

  updateTrees(deltaZ) {
    // No physics body updates needed for background trees
  }

  cleanupTrees(minZ, maxZ) {
    const treeCleanup = [];
    this.trees.forEach((tree) => {
      const localZ = tree.position.z;
      if (localZ < minZ || localZ > maxZ) {
        treeCleanup.push(tree);
      }
    });

    treeCleanup.forEach((tree) => {
      this.worldGroup.remove(tree);
      const index = this.trees.indexOf(tree);
      if (index !== -1) {
        this.trees.splice(index, 1);
      }
    });
  }
}