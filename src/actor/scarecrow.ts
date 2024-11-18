import { THREE } from '@enable3d/phaser-extension'

import BaseScene3D from '../scenes/base'
import Character from './character'

export default class Scarecrow extends Character {

  constructor(scene: BaseScene3D) {
    super(scene, undefined, undefined, { shape: 'box', width: 2, height: 2, depth: 2, collisionFlags: 2 })
    this.name = "Box"
    this.health = this.maxHealth = 1
    this.add(new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), new THREE.MeshBasicMaterial({ color: 0x00ff00 })))
  }
}