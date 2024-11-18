import { THREE } from '@enable3d/phaser-extension'

import BaseScene3D from '../scenes/base'
import Actor from './actor'
import Character from './character'

/**
 * Personaje del jugador.
 * 
 * @param {Scene3D} scene Escena a la que pertenece el jugador
 */
export default class Player extends Character {

  constructor(public scene: BaseScene3D) {
    super(scene, "player", undefined, {
      shape: 'capsule',
      radius: 0.6,
      height: 1.0,
      offset: { y: -1.18 },
      collisionFlags: 0
    })
    this.name = "player"

    const hidden = [
      "Knife", "Knife_Offhand", "1H_Crossbow", "2H_Crossbow", "Throwable"
    ]
    this.traverse((child) => {
      if (hidden.includes(child.name)) {
        child.visible = false
      }
    })
  }

  renderUpdate(time: number, delta: number) : void {
    const jumpAnim = this.anims.get("Jump_Full_Short")
    const idleAnim = this.anims.get("Idle_B_Rig")
    const runAnim = this.anims.get("Running_B_Rig")
    const walkAnim = this.anims.get("Walking_B_Rig")
    const attackAnim = this.anims.get("1H_Melee_Attack_Stab_Rig")
    if (this.isJumping) {
      if (this.jumped) {
        let anim : THREE.AnimationAction | undefined
        if (this.animIsAttacking()) {
          anim = attackAnim
          idleAnim.stop()
          runAnim.stop()
          walkAnim.stop()
        } else if (this.animIsRunning()) {
          anim = runAnim
          idleAnim.stop()
          walkAnim.stop()
          attackAnim.stop()
        } else if (this.animIsWalking()) {
          anim = walkAnim
          idleAnim.stop()
          runAnim.stop()
          attackAnim.stop()
        } else if (this.isAnimRunning(idleAnim)) {
          anim = idleAnim
          runAnim.stop()
          walkAnim.stop()
          attackAnim.stop()
        } else {
          anim = undefined
          idleAnim.stop()
          runAnim.stop()
          walkAnim.stop()
          attackAnim.stop()
        }
        jumpAnim.time = 0.0
        jumpAnim.timeScale = 2
        jumpAnim.loop = THREE.LoopOnce
        jumpAnim.clampWhenFinished = true
        jumpAnim.enabled = true
        if (anim) {
          jumpAnim.crossFadeFrom(anim, 0.1, false)
        }
        jumpAnim.play()
      }
    } else {
      jumpAnim.stop()

      if (this.animIsAttacking())  {
        if (!this.isAnimRunning(attackAnim)) {
          let anim = this.isAnimRunning(attackAnim) ? runAnim : (this.isAnimRunning(walkAnim) ? walkAnim : idleAnim)
          attackAnim.time = 0.0
          attackAnim.timeScale = 2
          attackAnim.loop = THREE.LoopOnce
          attackAnim.enabled = true
          attackAnim.clampWhenFinished = true
          if (this.isAnimRunning(anim)) {
            attackAnim.crossFadeFrom(anim, 0.1, false)
          }
          attackAnim.play()
        }
      } else {
        attackAnim.stop()

        if (this.animIsRunning()) {
          if (!this.isAnimRunning(runAnim)) {
            let anim = this.isAnimRunning(walkAnim) ? walkAnim : idleAnim
            runAnim.time = 0.0
            runAnim.timeScale = 2
            runAnim.loop = THREE.LoopRepeat
            runAnim.enabled = true
            runAnim.crossFadeFrom(anim, 0.1, false)
            runAnim.play()
          }
        } else if (this.animIsWalking()) {
          if (!this.isAnimRunning(walkAnim)) {
            let anim = this.isAnimRunning(runAnim) ? runAnim : idleAnim
            walkAnim.time = 0.0
            walkAnim.timeScale = 2
            walkAnim.loop = THREE.LoopRepeat
            walkAnim.enabled = true
            walkAnim.crossFadeFrom(anim, 0.1, false)
            walkAnim.play()
          }
        } else if (!this.isAnimRunning(idleAnim)) {
          let anim = this.isAnimRunning(walkAnim) ? walkAnim : runAnim
          idleAnim.time = 0.0
          idleAnim.timeScale = 1.0
          idleAnim.loop = THREE.LoopRepeat
          idleAnim.enabled = true
          if (this.isAnimRunning(anim)) {
            idleAnim.crossFadeFrom(anim, 0.1, false)
          }
          idleAnim.play()
        }
      }
    }
  }

  isAnimRunning(anim: THREE.AnimationAction) : boolean {
    return anim.isRunning() && anim.getEffectiveWeight() > 0
  }

  animIsAttacking() : boolean {
    return this.isAttacking
  }

  animIsRunning() : boolean {
    return this.onGround && (this.xzzo != 0.0 || this.yzzo != 0.0) && this.speedModifier > 1.0
  }

  animIsWalking() : boolean {
    return this.onGround && (this.xzzo != 0.0 || this.yzzo != 0.0) && this.speedModifier <= 1.0
  }

  die() : void {
    this.respawn()
  }

  respawn() : void {
    this.health = this.maxHealth
    this.teleport(this.scene.spawnpoint.x, this.scene.spawnpoint.y, this.scene.spawnpoint.z)
  }

  interact(actor : Actor) : void {
    this.scene.events.emit("interact", this, actor)
  }
}