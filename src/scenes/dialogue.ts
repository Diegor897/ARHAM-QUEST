import { THREE } from '@enable3d/phaser-extension'

import BaseScene3D from './base'
import Actor from '../actor/actor'
import { DialogueBuilder } from '../system/dialogues'

/**
 * Escena simple.
 */
export class DialogueScene extends BaseScene3D {

  private box : NPC;

  constructor() {
    super({ key: 'DialogueScene' })
    this.spawnpoint.set(0, 4.5, 0)
  }

  init0() {
  }

  preload0() {
    this.third.warpSpeed('ground', 'grid')
  }

  create0() {
    this.dialogueSystem?.registerDialogue(
      new DialogueBuilder("box")
        .addLines("Caja", "¡Hola, soy una caja!", "¿Qué tal? ¡Yo estoy genial!")
        .addLines("Personaje", "¡Hola, caja!", "¡Qué bien que estés genial!")
        .addLines("Caja", "¡Sí, gracias!", "¡Adiós!")
        .build())

    this.box = new NPC(this)
    this.box.teleport(-4, 0.5, 0)
    this.events.on("interact", (player: Actor, actor: Actor) => {
      if (actor == this.box) {
        this.dialogueSystem?.playDialogue("box")
      }
    })
  }
}

class NPC extends Actor {

  constructor(scene: BaseScene3D) {
    super(scene, undefined, undefined, { shape: 'box', width: 1, height: 1, depth: 1, collisionFlags: 2 })
    this.name = "Box"
    this.add(new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: 0x00ff00 })))
  }
}