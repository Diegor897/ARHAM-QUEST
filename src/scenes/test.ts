import { THREE } from '@enable3d/phaser-extension'

import BaseScene3D from './base'

import Water from '../actor/water'

/**
 * Escena simple.
 */
export class TestScene extends BaseScene3D {
  constructor() {
    super({ key: 'TestScene' })
    this.spawnpoint.set(0, 4.5, 0)
  }

  preload0() {
    let plane = this.third.add.plane()
    plane.position.set(0, 0, 0) 
    plane.rotation.y = Math.PI
    this.third.physics.add.existing(plane, { mass: 0, depth: 10, width: 10 })
    this.warpSpeed('sky', 'light')
    var boxGeometry = new THREE.BoxGeometry(10, 1, 1);
    var boxMaterial = new THREE.MeshLambertMaterial({ color: 0xea4d10 });

    var box1 = new THREE.Mesh(boxGeometry, boxMaterial);
    box1.position.z = 4.5;
    this.third.scene.add(box1);

    var box2 = new THREE.Mesh(boxGeometry, boxMaterial);
    box2.position.z = -4.5;
    this.third.scene.add(box2);

    var box3 = new THREE.Mesh(boxGeometry, boxMaterial);
    box3.position.x = -5;
    box3.rotation.y = Math.PI * 0.5;
    this.third.scene.add(box3);

    var box4 = new THREE.Mesh(boxGeometry, boxMaterial);
    box4.position.x = 5;
    box4.rotation.y = Math.PI * 0.5;
    this.third.scene.add(box4);

    let water = new Water(this, 10, 10)
    water.teleport(0, 0.25, 0)
  }
}