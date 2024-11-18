import { ExtendedObject3D, ThirdPersonControlsConfig, THREE } from '@enable3d/phaser-extension'
import { Object3D, OrthographicCamera, PerspectiveCamera } from 'three'

import Actor from './actor/actor'

export class Camera {
  public deltaX : number
  public deltaY : number

  constructor(
    protected scene: THREE.Scene,
    public camera: PerspectiveCamera | OrthographicCamera,
    public actor?: ExtendedObject3D) {
    this.deltaX = this.deltaY = 0
  }
}

export class FreecamCamera extends Camera {
  /**
   * Sensitivity of the movement
   * @default new THREE.Vector2(0.25, 0.25)
   */
  public sensitivity: THREE.Vector2
  public radius: number
  public actorRadius: number
  public offset: THREE.Vector3
  public interpolationFactor: number
  /** Theta in deg */
  public theta: number
  /** Phi in deg */
  public phi: number
  /** Max Phi in deg */
  public maxPhi: number
  /** Min Phi in deg */
  public minPhi: number

  public target : Actor | null = null

  constructor(
    scene: THREE.Scene,
    camera: PerspectiveCamera | OrthographicCamera,
    private config: ThirdPersonControlsConfig,
    actor?: ExtendedObject3D) {
    super(scene, camera, actor)
    const {
      offset = new THREE.Vector3(0, 0, 0),
      sensitivity = new THREE.Vector2(0.25, 0.25),
      radius = 8,
      targetRadius = 10,
      interpolationFactor = 0.05,
      theta = 0,
      phi = 0,
      /** Max Phi in deg */
      maxPhi = 85,
      /** Min Phi in deg */
      minPhi = -85
    } = config

    this.offset = offset
    this.sensitivity = sensitivity
    this.radius = radius
    this.actorRadius = targetRadius
    this.interpolationFactor = interpolationFactor
    this.theta = theta
    this.phi = phi
    this.maxPhi = maxPhi
    this.minPhi = minPhi
  }

  update(time : number, delta : number): void {
    if (!this.actor) {
      return
    }

    const actor = this.actor.position.clone().add(this.offset)

    this.theta -= this.deltaX * (this.sensitivity.x / 2)
    this.theta %= 360
    this.phi += this.deltaY * (this.sensitivity.y / 2)
    this.phi = Math.min(this.maxPhi, Math.max(this.minPhi, this.phi))

    
    // Update the camera position to the expected location
    var actorRadius = THREE.MathUtils.lerp(this.radius, this.actorRadius, this.interpolationFactor)
    this.radius = actorRadius
    this.updateCameraPosition(actor)
    this.camera.updateMatrix()
    this.camera.lookAt(actor)
  }

  updateCameraPosition(actor: THREE.Vector3) : void {
    this.camera.position.x =
      actor.x + this.radius * Math.sin((this.theta * Math.PI) / 180) * Math.cos((this.phi * Math.PI) / 180)
    this.camera.position.y = actor.y + this.radius * Math.sin((this.phi * Math.PI) / 180)

    this.camera.position.z =
      actor.z + this.radius * Math.cos((this.theta * Math.PI) / 180) * Math.cos((this.phi * Math.PI) / 180)
  }
}

/**
 * Versión extendida del controlador de cámara en tercera persona que evita clipping y
 * permite reconfigurar el actor de manera dinámica.
 */
export class PlayerCamera extends Camera {
  public sensitivity: THREE.Vector2
  public radius: number
  public actorRadius: number
  public offset: THREE.Vector3
  public interpolationFactor: number

  public theta: number
  public phi: number
  public maxPhi: number
  public minPhi: number

  private raycaster = new THREE.Raycaster

  public target : Actor | null = null

  constructor(
    scene: THREE.Scene,
    camera: PerspectiveCamera | OrthographicCamera,
    private config: ThirdPersonControlsConfig,
    actor?: ExtendedObject3D) {
    super(scene, camera, actor)
    const {
      offset = new THREE.Vector3(0, 0, 0),
      sensitivity = new THREE.Vector2(0.1, 0.1),
      radius = 8,
      targetRadius = 10,
      interpolationFactor = 0.05,
      theta = 0,
      phi = 0,
      /** Max Phi in deg */
      maxPhi = 85,
      /** Min Phi in deg */
      minPhi = -85
    } = config

    this.offset = offset
    this.sensitivity = sensitivity
    this.radius = radius
    this.actorRadius = targetRadius
    this.interpolationFactor = interpolationFactor
    this.theta = theta
    this.phi = phi
    this.maxPhi = maxPhi
    this.minPhi = minPhi
  }

  update(time : number, delta : number): void {
    if (!this.actor) {
      return
    }
    
    this.moveCamera()
    this.findTarget()
  }

  moveCamera() : void {
    if (!this.actor) {
      return
    }

    const actor = this.actor.position.clone().add(this.offset)

    this.theta -= this.deltaX * (this.sensitivity.x / 2)
    this.theta %= 360
    this.phi += this.deltaY * (this.sensitivity.y / 2)
    this.phi = Math.min(this.maxPhi, Math.max(this.minPhi, this.phi))

    
    // Update the camera position to the expected location
    var actorRadius = THREE.MathUtils.lerp(this.radius, this.actorRadius, this.interpolationFactor)
    this.radius = actorRadius
    this.updateCameraPosition(actor)

    // TODO: a physics shape should be used instead, as this doesn't fix all edge cases
    this.raycaster.set( actor, this.camera.position.clone().sub(actor).normalize() )
    var intersects = this.raycaster.intersectObjects( this.scene.children )

    if (intersects && intersects.length > 1) {
      for (let i = 0; i < intersects.length; i++) {
        let parent : Object3D | null = intersects[i].object
        while (parent.parent != null && !(parent instanceof Actor)) {
          parent = parent.parent
        }
        if (!(parent instanceof Actor)) {
          continue
        }

        if (parent == this.actor) {
          continue
        }

        if (parent.allowCameraClip) {
          continue
        }
        if (parent.body && parent.body.getCollisionFlags() == 4) {
          continue
        }
        
        var space = intersects[i].distance
        var radius = .2
        
        // Pick the shorter distance
        actorRadius = Math.min(actorRadius, space - radius)
        break
      }

      if (actorRadius != this.radius) {
        // There's an obstacle, move the camera closer
        this.radius = actorRadius
        this.updateCameraPosition(actor)
      }
    }

    this.camera.updateMatrix()
    this.camera.lookAt(actor)
  }

  updateCameraPosition(actor: THREE.Vector3) : void {
    this.camera.position.x =
      actor.x + this.radius * Math.sin((this.theta * Math.PI) / 180) * Math.cos((this.phi * Math.PI) / 180)
    this.camera.position.y = actor.y + this.radius * Math.sin((this.phi * Math.PI) / 180)

    this.camera.position.z =
      actor.z + this.radius * Math.cos((this.theta * Math.PI) / 180) * Math.cos((this.phi * Math.PI) / 180)
  }

  findTarget() : void {
    if (!this.actor) {
      return
    }
    this.raycaster.set(this.actor.position, this.actor.getWorldDirection(new THREE.Vector3()))

    // Find all entries of this.scene.children of type Actor
    const actorObjects = this.scene.children.filter((obj) => obj instanceof Actor)

    let intersects = this.raycaster.intersectObjects(actorObjects)
    this.target = null

    if (intersects && intersects.length > 0) {
      for (let i = 0; i < intersects.length; i++) {
        let parent : Object3D | null = intersects[i].object
        while (parent.parent != null && !(parent instanceof Actor)) {
          parent = parent.parent
        }
        if (!(parent instanceof Actor)) {
          return
        }
        if (parent == this.actor) {
          continue
        }
        this.target = parent as Actor
      }
    }
  }
}