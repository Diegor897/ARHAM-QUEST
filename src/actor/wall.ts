import * as Types from '@enable3d/common/dist/types'

import BaseScene3D from '../scenes/base'
import Actor from './actor'

export default class InvisibleWall extends Actor {

  constructor(public scene: BaseScene3D, physicsBodyOptions: Types.AddExistingConfig) {
    physicsBodyOptions.collisionFlags = 1
    super(scene, undefined, undefined, physicsBodyOptions)
    this.body.setGravity(0, 0, 0)
    this.body.setFriction(0)
  }
}