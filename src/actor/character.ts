import { THREE } from '@enable3d/phaser-extension'
import * as Types from '@enable3d/common/dist/types'

import BaseScene3D from '../scenes/base'
import Actor from './actor'
import Trigger from './trigger'

/**
 * Personaje de la escena con la capacidad de moverse, recibir daño y atacar a otros personajes.
 * 
 * @param {Scene3D} scene Escena a la que pertenece el personaje
 * @param {string} model Modelo del personaje
 * @param {THREE.Vector3} scale Escala del modelo
 */
export default class Character extends Actor {

  public onGround = false

  public jumped = false

  private jumpRequested = false
  private jumpExecuted = false

  private canDoubleJump = false
  private doubleJumpTimeout : number | null = null
  public isJumping = false

  public canAttack = true
  public isAttacking = false

  public eyeHeight = 1.5

  // Movement vector
  public xzz = 0.0
  public yzz = 0.0
  public speedModifier = 1.0

  // Previous movement vector
  public xzzo = 0.0
  public yzzo = 0.0

  protected walkSpeed = 0.5

  private readonly maxRotateSpeed = 0.2

  protected maxHealth = 100.0
  protected health = this.maxHealth

  private raycaster = new THREE.Raycaster()

  constructor(public scene: BaseScene3D,
              model?: string,
              scale?: THREE.Vector3,
              physicsBodyOptions?: Types.AddExistingConfig) {
    super(scene, model, scale, physicsBodyOptions)
  }

  attack() : void {
    if (!this.canAttack) {
      return
    }
    if (!this.isJumping && !this.isAttacking) {
      this.isAttacking = true
      this.scene.time.delayedCall(1000, () => this.isAttacking = false)
    }

    let trigger = new Trigger(this.scene, {
      shape: "sphere", x: 0, y: 0, z: 0, radius: 1.25
    })
    let position = this.position.clone()
    position.y += this.eyeHeight
    
    // Offset it so it collides with enemies looking the actor
    let offset = new THREE.Vector3(-1.5, 0, 0)

    // Rotate offset to match where the character is looking at
    const _Q = new THREE.Quaternion()
    this.getWorldQuaternion(_Q)

    const yRot = (new THREE.Euler()).setFromQuaternion(_Q, "YXZ").y,
          axis = new THREE.Euler(0, yRot, 0),
          s = (new THREE.Quaternion()).setFromEuler(axis)
    offset.set(offset.z, 0, -offset.x)
    offset.applyQuaternion(s)

    // Add offset
    position.add(offset)

    this.scene.third.add.existing(trigger)
    trigger.teleport(position.x, position.y, position.z)

    let attacked : Character[] = []
    this.scene.events.on("trigger_enter", (t: Trigger, actor: Actor) => {
      if (trigger == t && actor != this && actor instanceof Character) {
        if (!attacked.includes(actor as Character)) {
          attacked.push(actor as Character)
          this.attackCharacter(actor as Character)
        }
      }
    })
    this.scene.time.delayedCall(250, () => trigger.destroy())
  }

  attackCharacter(actor: Character) : void {
    actor.damage(10)
  }

  walk(vec: THREE.Vector2, speedModifier: number) : void {
    vec = vec.normalize()
    this.xzz += vec.x
    this.yzz += vec.y
    this.speedModifier = speedModifier
  }

  jump() : void {
    if (this.jumpRequested || (this.isJumping && !this.canDoubleJump)) {
      return
    }
    this.jumpRequested = true
  }

  tickUpdate(time: number, delta: number) : void {
    super.tickUpdate(time, delta)
    this.ensureInSceneBounds()
    if (this.health > 0) {
      this.movementTick(delta)
      this.tickUpdate0(time, delta)
    }
  }

  tickUpdate0(time: number, delta: number) : void {
  }

  frozenTickUpdate(time: number, delta: number) : void {
    this.onGround = this.isOnGround()
    // Discard travel
    this.xzzo = this.xzz
    this.yzzo = this.yzz
    this.xzz = this.yzz = 0.0
    this.frozenTickUpdate0(time, delta)
  }

  frozenTickUpdate0(time: number, delta: number) : void {
  }

  movementTick(delta: number) : void {
    this.onGround = this.isOnGround()
    this.tryJump()

    this.travel(delta)
    let isRunning = (this.xzzo != 0 || this.yzzo != 0) && this.speedModifier >= 1.2
    if (isRunning) {
      this.scene.events.emit("run", this)
    }
  }

  isOnGround() : boolean {
    if (!this.body) {
      return false
    }
    this.raycaster.ray.origin.copy(this.position)
    this.raycaster.ray.origin.y += 0.1
    this.raycaster.ray.direction.set(0, -1, 0)
    this.raycaster.far = 0.2
    const intersects = this.raycaster.intersectObjects(this.scene.third.scene.children, true)
    return intersects.length > 0
  }

  tryJump() : void {
    if (this.jumped) {
      this.jumped = false
    }
    if (this.jumpRequested) {
      this.jumpRequested = false
      if (!this.isJumping) {
        this.jumped = true
        this.isJumping = true
        
        this.scene.time.delayedCall(20, () => {
          this.body.applyForceY(3.0)
          this.scene.time.delayedCall(5, () => this.jumpExecuted = true)
        })
        this.setDoubleJumpTimeout()
      } else if (this.canDoubleJump) {
        this.jumped = true
        this.canDoubleJump = false

        this.scene.time.delayedCall(20, () => {
          this.body.applyForceY(4.0)
          this.scene.time.delayedCall(5, () => this.jumpExecuted = true)
        })

        this.cancelDoubleJumpTimeout()
      }
    } else if (this.isJumping && this.jumpExecuted && this.onGround) {
      this.isJumping = false
      this.canDoubleJump = false
      this.jumpExecuted = false
      this.cancelDoubleJumpTimeout()
    }
  }

  cancelDoubleJumpTimeout() : void {
    if (this.doubleJumpTimeout != null) {
      clearTimeout(this.doubleJumpTimeout)
      this.doubleJumpTimeout = null
    }
  }

  setDoubleJumpTimeout() : void {
    this.cancelDoubleJumpTimeout()
    this.doubleJumpTimeout = setTimeout(() => {
      this.canDoubleJump = true
    }, 350)
  }

  travel(delta: number) : void {
    if (!this.body) {
      // No physics body, no movement
      this.xzzo = this.xzz
      this.yzzo = this.yzz
      this.xzz = this.yzz = 0.0
      return
    }

    let velocity = new THREE.Vector3()
    velocity.set(0, 0, 0)
    velocity.x = this.walkSpeed * this.speedModifier * this.xzz
    velocity.z = this.walkSpeed * this.speedModifier * this.yzz
    
    this.body.applyForce(velocity.x, 0, velocity.z)

    velocity.set(this.body.velocity.x, this.body.velocity.y, this.body.velocity.z)
    velocity.x *= 0.9
    velocity.z *= 0.9
    this.body.setVelocity(velocity.x, velocity.y, velocity.z)

    if (this.xzz < 0 || this.xzz > 0 || this.yzz < 0 || this.yzz > 0) {
      const theta = Math.atan2(this.xzz, this.yzz)
      this.rotateTowards(theta)
    }

    this.xzzo = this.xzz
    this.yzzo = this.yzz
    this.xzz = this.yzz = 0.0
  }

  rotateTowards(phi: number) : void {
    if (!this.body) {
      // No physics body, no rotation
      return
    }
    this.body.transform()
    let current = this.body.rotation.y
    if (Math.abs(phi - current) > Math.PI) {
      if (phi > current) {
        current += 2 * Math.PI
      } else {
        phi += 2 * Math.PI
      }
    }
    // Clamp rotation diff to maxRotateSpeed
    const i = (1 - this.maxRotateSpeed) * current + this.maxRotateSpeed * phi
    const totalTurn = 2 * Math.PI
    phi = (i % totalTurn + totalTurn) % totalTurn

    // Rotate
    const _Q = new THREE.Quaternion()
    const _A = new THREE.Vector3()
    const _R = new THREE.Quaternion()

    _A.set(0, 1, 0)
    _Q.setFromAxisAngle(_A,  phi)
    _R.multiply(_Q);

    let transform = this.body.ammo.getWorldTransform()
    transform.setRotation(new Ammo.btQuaternion(_R.x, _R.y, _R.z, _R.w))
    this.body.ammo.setWorldTransform(transform)
  }

  damage(damage: number) : void {
    if (this.health > 0) {
      this.health -= damage
      if (this.health <= 0) {
        this.die()
      }
    }
  }

  die() : void {
    this.scene.events.emit("die", this)
    this.destroy()
  }

  ensureInSceneBounds() : void {
    const minHeight = -5
    if (this.position.y < minHeight) {
      this.die()
    }
  }

  teleport(x: number, y: number, z: number) : void {
    this.body.setCollisionFlags(2)
    this.position.set(x, y, z)
    this.body.needUpdate = true
    
    this.body.once.update(() => {
      this.body.setCollisionFlags(0)
      this.body.setVelocity(0, 0, 0)
      this.body.setAngularVelocity(0, 0, 0)
    })
  }
}