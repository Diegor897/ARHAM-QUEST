import { PointerLock, PointerDrag, THREE, JoyStick } from '@enable3d/phaser-extension'
import { Delta } from '@enable3d/common/dist/misc/joystick'
import BaseScene3D from '../scenes/base'
import Actor from '../actor/actor'
import { Camera } from '../camera'

/**
 * Teclas de movimiento.
 */
interface Keys {
  left: Phaser.Input.Keyboard.Key
  forwards: Phaser.Input.Keyboard.Key,
  backwards: Phaser.Input.Keyboard.Key,
  right: Phaser.Input.Keyboard.Key,
  jump: Phaser.Input.Keyboard.Key,
  run: Phaser.Input.Keyboard.Key,
  interact : Phaser.Input.Keyboard.Key
  hit: Phaser.Input.Pointer
}

export class BaseInputControlSystem {


  protected readonly touchDevice : boolean = 'ontouchstart' in window

  protected moveTop: number = 0.0
  protected moveRight: number = 0.0
  
  protected keys?: Keys
  protected shouldMove: boolean
  
  constructor(protected scene: BaseScene3D, protected target: Actor, protected camera: Camera) {
    if (this.touchDevice) {
      this.setupJoystick()
    } else {
      this.setupTraditionalControls()
    }
  }

  setupJoystick() : void {
    const joystick = new JoyStick()
    const axis = joystick.add.axis({
      styles: { left: 35, bottom: 35, size: 100 }
    })
    axis.onMove(event => {
      /**
       * Update camera
       */
      const { x, y } : Delta = event
      this.moveTop = x * 3
      this.moveRight = y * 3
    })
    const buttonA = joystick.add.button({
      letter: 'A',
      styles: { right: 35, bottom: 110, size: 80 }
    })
    buttonA.onClick(() => this.move(new THREE.Vector3(0, 1, 0)))
    const buttonB = joystick.add.button({
      letter: 'B',
      styles: { right: 110, bottom: 35, size: 80 }
    })
    buttonB.onClick(() => (this.shouldMove = true))
    buttonB.onRelease(() => (this.shouldMove = false))
  }

  setupTraditionalControls() : void {
    const pointerLock = new PointerLock(this.scene.game.canvas)
    const pointerDrag = new PointerDrag(this.scene.game.canvas)
    pointerDrag.onMove(delta => {
      if (pointerLock.isLocked()) {
        const { x, y } = delta
        this.moveTop = -y
        this.moveRight = x
      }
    })

    if (this.scene.input.keyboard) {
      this.keys = {
        left: this.scene.input.keyboard.addKey('a'),
        forwards: this.scene.input.keyboard.addKey('w'),
        right: this.scene.input.keyboard.addKey('d'),
        backwards: this.scene.input.keyboard.addKey('s'),
        jump: this.scene.input.keyboard.addKey(32),
        run: this.scene.input.keyboard.addKey('SHIFT'),
        interact: this.scene.input.keyboard.addKey("e"),
        hit: this.scene.input.activePointer
      }
    } else {
      console.error('Could not set up keyboard controls')
    }
  }

  update(time: number, delta: number) {
    let movement = this.actorMovement(time, delta)
    let rotation = this.cameraRotation(time, delta)
    this.update0(time, delta, movement, rotation)
  }

  actorMovement(time: number, delta: number) : THREE.Vector3 {
    const vec = new THREE.Vector3()
    vec.set(0, 0, 0)
    if (this.keys) {
      if (this.keys.forwards.isDown) {
        vec.x += 1
      }
      if (this.keys.backwards.isDown) {
        vec.x -= 1
      }
      if (this.keys.left.isDown) {
        vec.z -= 1
      }
      if (this.keys.right.isDown) {
        vec.z += 1
      }
      if (this.keys.jump.isDown) {
        vec.y += 1
      }
    } else if (this.shouldMove) {
      vec.x += 1
    }

    return vec
  }

  cameraRotation(time: number, delta: number) : THREE.Vector2 {
    let deltaX = this.moveRight * 3
    let deltaY = -this.moveTop * 3
    if (!this.touchDevice) {
      this.moveRight = this.moveTop = 0
    }
    return new THREE.Vector2(deltaX, deltaY)
  }

  update0(time: number, delta: number, movement: THREE.Vector3, rotation: THREE.Vector2) : void {
  }
}

export class FreecamInputControlSystem extends BaseInputControlSystem {

  update0(time: number, delta: number, movement: THREE.Vector3, rotation: THREE.Vector2) : void {
    this.camera.deltaX = rotation.x
    this.camera.deltaY = rotation.y
    
    if (!this.keys) {
      return
    }
    if (this.keys.run.isDown) {
      movement.y -= 1
    }

    if (movement.lengthSq() > 0.0001) {
      const _Q = new THREE.Quaternion()
      this.camera.camera.getWorldQuaternion(_Q)
  
      const yRot = (new THREE.Euler()).setFromQuaternion(_Q, "YXZ").y,
            axis = new THREE.Euler(0, yRot, 0),
            s = (new THREE.Quaternion()).setFromEuler(axis)
      movement.applyQuaternion(s)
      movement.set(movement.z, movement.y, -movement.x)
      let position = this.target.position.clone()
      position.add(movement)

      this.target.teleport(position.x, position.y, position.z)
    }
  }
}

export class PlayerInputControlSystem extends BaseInputControlSystem {

  private interacting : boolean = false
  private attacking : boolean = false

  update0(time: number, delta: number, movement: THREE.Vector3, rotation: THREE.Vector2) : void {
    this.camera.deltaX = rotation.x
    this.camera.deltaY = rotation.y

    if (this.scene.frozen) {
      return
    }
    if (!this.keys) {
      return
    }

    if (movement.y != 0) {
      this.jump()
      movement.y = 0
    }
    
    if (movement.x != 0 || movement.z != 0) {
      this.move(movement)
    }

    this.attack()
    this.interact()
  }

  jump() : void {
    this.target.jump()
  }

  move(movement: THREE.Vector3) : void {
    let speed = 1.0
    if (this.keys?.run.isDown) {
      speed = 1.5
    }
    
    const _Q = new THREE.Quaternion()
    this.camera.camera.getWorldQuaternion(_Q)

    const yRot = (new THREE.Euler()).setFromQuaternion(_Q, "YXZ").y,
          axis = new THREE.Euler(0, yRot, 0),
          s = (new THREE.Quaternion()).setFromEuler(axis)
    movement.applyQuaternion(s)
    this.target.walk(new THREE.Vector2(movement.z, -movement.x), speed)
  }

  attack() : void {
    if (!this.target) {
      return
    }
    if (!this.keys?.hit.leftButtonDown()) {
      this.attacking = false
    } else if (!this.attacking) {
      this.attacking = true
      this.target.attack()
    }
  }

  interact() : void {
    if (!this.target) {
      return
    }
    if (!this.keys?.interact.isDown) {
      this.interacting = false
    } else if (!this.interacting) {
      let target = this.scene.camera?.target
      if (target && target != null && target.position.distanceToSquared(this.target.position) < 1.5 * 1.5) {
        this.interacting = true
        this.target.interact(target)
      }

    }
  }
}