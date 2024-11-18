import { THREE } from '@enable3d/phaser-extension'

import waterVertShader from '../shaders/water.vert.glsl'
import waterFragShader from '../shaders/water.frag.glsl'

import BaseScene3D from '../scenes/base'
import Actor from './actor'

/**
 * Plano de agua.
 * 
 * Basado en:
 *   - https://roystan.net/articles/toon-water/
 *   - https://github.com/romulolink/threejs-water-shader-with-foam/
 */
export default class Water extends Actor {

  public waterMaterial : THREE.ShaderMaterial
  private elapsedTime = 0

  constructor(scene: BaseScene3D, width: number, depth: number) {
    super(scene, undefined, undefined)
    this.noRenderInDepthBuffer = true

    var uniforms = {
      time: { value: 0 },
      tDepth: { value: null },
      tNoise: { value: null },
      tNormal: { value: null },
      normal: { value: new THREE.Vector3() },

      foamColor: { value: new THREE.Color() },
      shallowWaterColor: { value: new THREE.Color(0.325, 0.807, 0.971) },
      deepWaterColor: { value: new THREE.Color(0.086, 0.407, 1) },
      
      cameraNear: { value: 0 },
      cameraFar: { value: 0 },
      cameraProjectionMatrix: { value: new THREE.Matrix4() },
      cameraInverseProjectionMatrix: { value: new THREE.Matrix4() },
      resolution: { value: new THREE.Vector2() },

      foamScrollSpeed: { value: new THREE.Vector2(0.03, 0.03) },
      minFoamDistance: { value: 0.04 },
      maxFoamDistance: { value: 0.4 },
      maxDepthDiff: { value: 1.0 }
    };
  
    var waterGeometry = new THREE.PlaneGeometry(width, depth);
    this.waterMaterial = new THREE.ShaderMaterial({
      defines: { ORTHOGRAPHIC_CAMERA: 0 },
      uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib["fog"], uniforms]),
      vertexShader: waterVertShader,
      fragmentShader: waterFragShader,
      fog: true
    });

    var noiseMap = new THREE.TextureLoader().load("assets/water/noise.png");
    noiseMap.wrapS = noiseMap.wrapT = THREE.RepeatWrapping;


    this.waterMaterial.uniforms.resolution.value.set(this.scene.game.scale.baseSize.width, this.scene.game.scale.baseSize.height)

    this.waterMaterial.uniforms.tNoise.value = noiseMap
    this.waterMaterial.uniforms.tDepth.value = this.scene.normalRenderTarget?.depthTexture
    this.waterMaterial.uniforms.tNormal.value = this.scene.normalRenderTarget?.texture
    this.waterMaterial.uniforms.tDepth.value = this.scene.normalRenderTarget?.depthTexture
  
    let water = new THREE.Mesh(waterGeometry, this.waterMaterial)
    water.rotation.x = -Math.PI * 0.5

    this.add(water)
    this.scene.events.on("resize", () => {
      this.waterMaterial.uniforms.resolution.value.set(this.scene.game.scale.baseSize.width, this.scene.game.scale.baseSize.height)
    })
  }

  renderUpdate(time: number, delta: number): void {
    this.elapsedTime += delta / 1000
    this.waterMaterial.uniforms.time.value = this.elapsedTime
    this.waterMaterial.uniforms.cameraNear.value = this.scene.third.camera.near
    this.waterMaterial.uniforms.cameraFar.value = this.scene.third.camera.far
		this.waterMaterial.uniforms.cameraInverseProjectionMatrix.value.copy( this.scene.third.camera.projectionMatrixInverse )
		this.waterMaterial.uniforms.cameraProjectionMatrix.value = this.scene.third.camera.projectionMatrix
    this.waterMaterial.uniforms.normal.value = new THREE.Vector3(0, 1, 0)
  }
}