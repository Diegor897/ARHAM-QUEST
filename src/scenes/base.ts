import { Scene3D, ExtendedObject3D, THREE, EffectComposer } from '@enable3d/phaser-extension'
import { SMAAPass } from 'three/examples/jsm/postprocessing/SMAAPass.js'
import { FreecamCamera, PlayerCamera } from '../camera'

import { N8AOPass } from "n8ao"

import Player from '../actor/player'
import Actor from '../actor/actor'

import { PlayerInputControlSystem, FreecamInputControlSystem, DialogueSystem } from '../system'

const normalMaterial = createNormalMaterial()

function createNormalMaterial() {
  let normalMaterial = new THREE.MeshNormalMaterial()
  normalMaterial.blending = THREE.NoBlending
  normalMaterial.side = THREE.DoubleSide
  return normalMaterial
}

class DepthScene3D extends Scene3D {
  public normalRenderTarget? : THREE.WebGLRenderTarget

  constructor(config: string | Phaser.Types.Scenes.SettingsConfig) {
    super(config)
  }

  init() {
    this.accessThirdDimension({
      antialias: true,
      anisotropy: 16
    })

    const depthTexture = new THREE.DepthTexture()
		depthTexture.format = THREE.DepthStencilFormat
		depthTexture.type = THREE.UnsignedInt248Type

    this.normalRenderTarget = new THREE.WebGLRenderTarget(this.game.scale.baseSize.width, this.game.scale.baseSize.height, {
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      type: THREE.HalfFloatType,
      depthTexture: depthTexture
    })

    this.third.preRender = () => this.preRender()

    this.scale.on("resize", () => {
      this.normalRenderTarget?.setSize(this.game.scale.baseSize.width, this.game.scale.baseSize.height)
      this.time.delayedCall(10, () => {
        let vector = new THREE.Vector2()
        this.third.renderer.getSize(vector)
      })
      this.events.emit("resize")
    })
  }

  preRender() : void {
    let hidden : Actor[] = []
    this.third.scene.children.forEach(child => {
      if (child.visible && child instanceof Actor && (child as Actor).noRenderInDepthBuffer) {
        child.visible = false
        hidden.push(child as Actor)
      }
    })

    this.third.scene.overrideMaterial = normalMaterial

    this.third.renderer.setRenderTarget(this.normalRenderTarget)
    this.third.renderer.render(this.third.scene, this.third.camera)
    this.third.renderer.setRenderTarget(null)

    this.third.scene.overrideMaterial = null

    hidden.forEach(actor => {
      actor.visible = true
    })
  }

}

/**
 * Base para las escenas con una pantalla de carga.
 */
export default class BaseScene3D extends DepthScene3D {

  public camera? : PlayerCamera
  public player? : Player

  public spawnpoint : THREE.Vector3 = new THREE.Vector3(0, 1, 0)

  public dialogueSystem? : DialogueSystem
  public controlSystem? : PlayerInputControlSystem

  private freecamObject? : Actor
  private freecamCamera? : FreecamCamera
  private freecamControlSystem? : FreecamInputControlSystem

  public frozen : boolean = false

  constructor(config: string | Phaser.Types.Scenes.SettingsConfig) {
    super(config)
  }

  init() : void {
    window.scene = this
    super.init()
    this.game.events.emit("level_load_start", this)
    this.init0()
  }

  init0() : void {
  }

  preload() : void {
    this.load.gltf("player", "assets/character/player.glb")
    this.preload0()
  }

  preload0() : void {
  }

  create() : void {
    //this.third.composer = new EffectComposer(this.third.renderer)
    /* let n8aopass = new N8AOPass(
      this.third.scene,
      this.third.camera,
      this.game.canvas.clientWidth,
      this.game.canvas.clientHeight
    )
    n8aopass.configuration.aoRadius = 0.5
    n8aopass.configuration.halfRes = true
    n8aopass.setQualityMode("Medium")
    this.third.composer.addPass(n8aopass)
    this.third.composer.addPass(new SMAAPass(
      this.game.canvas.clientWidth, this.game.canvas.clientHeight
    )) */

    this.third.warpSpeed('camera', 'sky', 'light')
    
    this.player = new Player(this)
    this.player.teleport(this.spawnpoint.x, this.spawnpoint.y, this.spawnpoint.z)

    this.camera = new PlayerCamera(this.third.scene, this.third.camera, {
      offset: new THREE.Vector3(0.0, 1.5, 0),
      targetRadius: 8,
      phi: 17.25,
      theta: 5.25
    }, this.player)

    this.controlSystem = new PlayerInputControlSystem(this, this.player, this.camera)
    this.dialogueSystem = new DialogueSystem(this)

    this.createLevel()
    this.create0()
    this.game.events.emit("level_load_complete", this)

    this.events.on("dialogue_enter", (dialogue) => {
      this.player?.body.setVelocity(0, 0, 0)
      this.frozen = true
    })
    this.events.on("dialogue_exit", (dialogue) => {
      this.frozen = false
    })

    window.freecam = () => this.freecam()
    window.playerPosition = () => this.playerPosition()
  }

  create0() : void {
  }

  createLevel() : void {
    let level = this.load.cacheManager.custom["gltf"].get("level")
    if (!level) {
      console.log("No level was found")
      return
    }

    const levelObj = new Actor(this)
    levelObj.name = 'level'
    levelObj.add(level.scenes[0])
    this.third.add.existing(levelObj)

    levelObj.traverse(child => {
      if (child.isMesh) {
      
        child.castShadow = child.receiveShadow = true
        child.material.metalness = 0
        child.material.roughness = 1

        if (!/^nocollide\./i.test(child.name)) {
          this.third.physics.add.existing(child, {
            shape: 'concave',
            mass: 0,
            collisionFlags: 1,
            autoCenter: false
          })
          child.body.setAngularFactor(0, 0, 0)
          child.body.setLinearFactor(0, 0, 0)
        }
      }
    })
  }

  update(time: number, delta: number) : void {
    if (this.frozen) {
      this.third.scene.children.forEach(child => {
        if (child instanceof Actor) {
          child.frozenTickUpdate(time, delta)
        }
      })
    } else {
      this.third.scene.children.forEach(child => {
        if (child instanceof Actor) {
          child.tickUpdate(time, delta)
        }
      })
    }
    this.third.scene.children.forEach(child => {
      if (child instanceof Actor) {
        child.renderUpdate(time, delta)
      }
    })
    this.update0(time, delta)

    if (this.freecamObject) {
      this.freecamControlSystem?.update(time, delta)
      this.freecamCamera?.update(time, delta)
    } else {
      this.controlSystem?.update(time, delta)
      this.camera?.update(time, delta)
    }
  }

  update0(time: number, delta: number) : void {
  }

  freecam() : void {
    if (!this.camera || !this.camera.actor) {
      console.log("No valid camera was found")
      return
    }
    
    if (this.freecamObject) {
      // Disable freecam
      this.freecamObject.destroy()
      this.freecamObject = undefined
      this.freecamControlSystem = undefined
      this.freecamCamera = undefined
    } else {
      // Enable freecam
      this.freecamObject = new Actor(this, undefined, undefined)
      let position = this.camera.actor.position
      this.freecamObject.teleport(position.x, position.y, position.z)
      this.third.add.existing(this.freecamObject)
      console.log("Freecam enabled")

      this.freecamCamera = new FreecamCamera(this.third.scene, this.third.camera, {
        offset: new THREE.Vector3(0.0, 1.5, 0),
        targetRadius: 4
      }, this.freecamObject)
      this.freecamControlSystem = new FreecamInputControlSystem(this, this.freecamObject, this.freecamCamera)
    }
  }

  playerPosition() : void {
    if (!this.player) {
      console.log("No valid player was found")
      return
    }

    console.log(this.player.position.x + " " + this.player.position.y + " " + this.player.position.z)
  }
}