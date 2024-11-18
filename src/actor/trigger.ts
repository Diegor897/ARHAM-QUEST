import { ExtendedObject3D, THREE } from '@enable3d/phaser-extension'
import * as Types from '@enable3d/common/dist/types'

import BaseScene3D from './scenes/base'
import Actor from './actor'

export default class Trigger extends Actor {

  private previousTickollidingActors : Set<Actor> = new Set()
  private collidingActors : Set<Actor> = new Set()

  constructor(public scene: BaseScene3D, physicsBodyOptions: Types.AddExistingConfig) {
    super(scene, undefined, undefined, physicsBodyOptions)
    this.body.setCollisionFlags(4)
    this.body.setGravity(0, 0, 0)
    this.body.on.collision((otherObject: ExtendedObject3D, event: Types.CollisionEvent) => {
      if (otherObject instanceof Actor) {
        this.collidingActors.add(otherObject)
      }
    })
  }

  tickUpdate(time: number, delta: number) : void {
    for (let actor of this.previousTickollidingActors) {
      if (!this.collidingActors.has(actor)) {
        this.onTriggerExit(actor)
      }
    }
    for (let actor of this.collidingActors) {
      if (!this.previousTickollidingActors.has(actor)) {
        this.onTriggerEnter(actor)
      }
    }
    this.previousTickollidingActors = new Set(this.collidingActors)
    this.collidingActors.clear()
  }

  onTriggerEnter(actor: Actor) : void {
    this.scene.events.emit("trigger_enter", this, actor)
  }

  onTriggerExit(actor: Actor) : void {
    this.scene.events.emit("trigger_exit", this, actor)
  }
}