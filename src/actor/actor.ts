import { ExtendedObject3D, THREE } from '@enable3d/phaser-extension'
import * as Types from '@enable3d/common/dist/types'

import BaseScene3D from '../scenes/base'

/**
 * Elemento en la escena con un modelo y animaciones.
 * 
 * @param {Scene3D} scene Escena a la que pertenece el actor
 * @param {string} model Modelo del actor
 * @param {THREE.Vector3} scale Escala del modelo
 */
export default class Actor extends ExtendedObject3D {

  public noRenderInDepthBuffer = false
  public allowCameraClip = false

  constructor(public scene: BaseScene3D,
              model?: string,
              scale?: THREE.Vector3,
              physicsBodyOptions?: Types.AddExistingConfig) {
    super()

    if (model) {
      this.loadModel(scene, model, scale)
    }
    scene.third.add.existing(this)
    if (physicsBodyOptions) {
      scene.third.physics.add.existing(this, physicsBodyOptions)
      this.body.setFriction(0.8)
      this.body.setAngularFactor(0, 0, 0)
    }
  }

  loadModel(scene: BaseScene3D, model: string, scale?: THREE.Vector3) : void {
    const gltfModel = scene.cache.custom["gltf"].get(model)
    if (!gltfModel) {
      console.error("Could not find model " + model + " in GLTF cache")
      return
    }

    if (scale) {
      gltfModel.scene.children[0].scale.set(scale.x, scale.y, scale.z)
    }
    
    this.traverse(child => {
      if (child.isMesh) {
        child.shape = 'convex'
        child.castShadow = child.receiveShadow = true
        // https://discourse.threejs.org/t/cant-export-material-from-blender-gltf/12258
        child.material.roughness = 1
        child.material.metalness = 0
      }
    })
    
    this.rotateY(Math.PI + 0.1)
    this.add(gltfModel.scene.children[0])
    scene.third.animationMixers.add(this.anims.mixer)
    gltfModel.animations.forEach(animation => {
      if (animation.name) {
        animation.tracks.forEach(track => {
          if (/(scale|position)/.test(track.name)) {
            const newValues = track.values.map(v => v * 1)
            track.values = newValues
          }
        })
        
        this.anims.add(animation.name, animation)
      }
    })
  }

  tickUpdate(time: number, delta: number) : void {
  }

  frozenTickUpdate(time: number, delta: number) : void {
  }

  renderUpdate(time: number, delta: number) : void {
  }

  destroy() : void {
    this.scene.third.destroy(this)
  }

  rotate(x: number, y: number, z: number) : void {
    this.rotation.set(x, y, z)
    if (!this.body) {
      return
    }
    this.updatePhysicsBody()
  }

  teleport(x: number, y: number, z: number) : void {
    this.position.set(x, y, z)
    if (!this.body) {
      return
    }

    this.body.setVelocity(0, 0, 0)
    this.body.setAngularVelocity(0, 0, 0)
    this.updatePhysicsBody()
  }

  updatePhysicsBody() : void {
    let tmpQuaternion = new THREE.Quaternion()
    let tmpVector3 = new THREE.Vector3()

    let tmpBtVector3 = new Ammo.btVector3()
    let tmpBtQuaternion = new Ammo.btQuaternion(0, 0, 0, 0)

    let worldTransform = this.body.ammo.getWorldTransform()

    this.getWorldQuaternion(tmpQuaternion)
    this.getWorldPosition(tmpVector3)

    // adjust tmp variables
    tmpBtVector3.setValue(tmpVector3.x, tmpVector3.y, tmpVector3.z)
    tmpBtQuaternion.setValue(
      tmpQuaternion.x,
      tmpQuaternion.y,
      tmpQuaternion.z,
      tmpQuaternion.w)
    // set position and rotation
    worldTransform.setOrigin(tmpBtVector3)
    worldTransform.setRotation(tmpBtQuaternion)
    // set transform
    this.body.ammo.getMotionState().setWorldTransform(worldTransform)
    this.body.ammo.setWorldTransform(worldTransform)
  }
}