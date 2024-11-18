import { THREE } from '@enable3d/phaser-extension'

import grassVertShader from '../shaders/grass.vert.glsl'
import grassFragShader from '../shaders/grass.frag.glsl'

import BaseScene3D from '../scenes/base'
import Actor from './actor'

import * as math from '../math'

const M_TMP = new THREE.Matrix4()
const AABB_TMP = new THREE.Box3()

const NUM_GRASS = (32 * 32)
const GRASS_SEGMENTS_LOW = 1
const GRASS_SEGMENTS_HIGH = 6
const GRASS_VERTICES_LOW = (GRASS_SEGMENTS_LOW + 1) * 2
const GRASS_VERTICES_HIGH = (GRASS_SEGMENTS_HIGH + 1) * 2
const GRASS_LOD_DIST = 15
const GRASS_MAX_DIST = 100

const GRASS_PATCH_SIZE = 2 * 2

const GRASS_WIDTH = 0.1
const GRASS_HEIGHT = 0.4

class InstancedFloat16BufferAttribute extends THREE.InstancedBufferAttribute {

	constructor( array, itemSize, normalized?, meshPerAttribute = 1 ) {
		super( new Uint16Array( array ), itemSize, normalized, meshPerAttribute )
		this.isFloat16BufferAttribute = true
	}
}


export default class GrassPatch extends Actor {

  private meshLow : THREE.Mesh
  private meshHigh : THREE.Mesh

  private highLodMaterial = createMaterial(GRASS_SEGMENTS_HIGH, GRASS_VERTICES_HIGH)
  private lowLodMaterial = createMaterial(GRASS_SEGMENTS_LOW, GRASS_VERTICES_LOW)

  private elapsedTime = 0.0

  constructor(scene: BaseScene3D, x: number, y: number, z: number, public radius: number, public density: number) {
    super(scene, undefined, undefined, undefined)
    this.name = "grass"
    this.allowCameraClip = true

    this.teleport(x, y, z)
    const count = density * NUM_GRASS * radius * radius

    // High LOD
    const highLodGeometry = this.createGeometry(GRASS_SEGMENTS_HIGH, radius, count)
    this.meshHigh = new THREE.Mesh(highLodGeometry, this.highLodMaterial)
    this.meshHigh.position.set(0, 0, 0)
    this.meshHigh.visible = true
    this.add(this.meshHigh)

    // Low LOD
    const lowLodGeometry = this.createGeometry(GRASS_SEGMENTS_LOW, radius, count)
    this.meshLow = new THREE.Mesh(lowLodGeometry, this.lowLodMaterial)
    this.meshLow.position.set(0, 0, 0)
    this.meshLow.visible = false
    this.add(this.meshLow)
  }

  createGeometry(segments: integer, radius: number, count: number) : THREE.BufferGeometry {
    let existing : GrassPatch[] = []
    this.scene.third.scene.traverse(child => {
      if (child instanceof GrassPatch && child !== this) {
        existing.push(child as GrassPatch)
      }
    })

    math.set_seed(0)
    const VERTICES = (segments + 1) * 2
  
    const indices : integer[] = []
    for (let i = 0; i < segments; ++i) {
      const vi = i * 2
      indices[i*12+0] = vi + 0
      indices[i*12+1] = vi + 1
      indices[i*12+2] = vi + 2
  
      indices[i*12+3] = vi + 2
      indices[i*12+4] = vi + 1
      indices[i*12+5] = vi + 3
  
      const fi = VERTICES + vi
      indices[i*12+6] = fi + 2
      indices[i*12+7] = fi + 1
      indices[i*12+8] = fi + 0
  
      indices[i*12+9]  = fi + 3
      indices[i*12+10] = fi + 1
      indices[i*12+11] = fi + 2
    }
  
    const offsets : number[] = []
    offsetLoop:
    for (let i = 0; i < count; ++i) {
      const r = radius * Math.sqrt(math.rand_range(0, 1))
      const theta = math.rand_range(0, 2 * Math.PI)
      const x = r * Math.cos(theta)
      const z = r * Math.sin(theta)

      const pos = new THREE.Vector3(this.position.x + x, 0, this.position.z + z)
      for (let j = 0; j < existing.length; ++j) {
        const existingPos = existing[j].position.clone()
        if (Math.abs(existingPos.y - this.position.y) < GRASS_HEIGHT * 2) {
          existingPos.setY(0)
          if (existingPos.distanceTo(pos) >= existing[j].radius) {
            continue
          }
          continue offsetLoop
        }
      }
      offsets.push(x)
      offsets.push(z)
      offsets.push(0)
    }
  
    const offsetsData = offsets.map(THREE.DataUtils.toHalfFloat)
  
    const vertID = new Uint8Array(VERTICES*2)
    for (let i = 0; i < VERTICES*2; ++i) {
      vertID[i] = i
    }
  
    const geo = new THREE.InstancedBufferGeometry()
    geo.instanceCount = offsets.length
    geo.setAttribute('vertIndex', new THREE.Uint8BufferAttribute(vertID, 1))
    geo.setAttribute('position', new InstancedFloat16BufferAttribute(offsetsData, 3))
    geo.setIndex(indices)
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), radius)
    return geo
  }

  renderUpdate(time: number, delta: number): void {
    this.elapsedTime += delta / 1000.0
    
    // Culling
    const camera = this.scene.third.camera
    const frustum = new THREE.Frustum().setFromProjectionMatrix(M_TMP.copy(camera.projectionMatrix).multiply(camera.matrixWorldInverse))
    const cameraPosXZ = new THREE.Vector3(camera.position.x, 0, camera.position.z)
    AABB_TMP.setFromCenterAndSize(this.position, new THREE.Vector3(GRASS_PATCH_SIZE, 1000, GRASS_PATCH_SIZE))
    const distToCell = AABB_TMP.distanceToPoint(cameraPosXZ)
    if (distToCell > GRASS_MAX_DIST || !frustum.intersectsBox(AABB_TMP)) {
      this.visible = false
      return
    }

    // Update uniforms
    const material = distToCell > GRASS_LOD_DIST ? this.lowLodMaterial : this.highLodMaterial
    material.uniforms.time.value = this.elapsedTime
    material.uniforms.playerPos.value = this.scene.player?.position || new THREE.Vector3(0, 0, 0)

    // LOD
    this.visible = true

    if (distToCell > GRASS_LOD_DIST) {
      this.meshHigh.visible = false
      this.meshLow.visible = true
    } else {
      this.meshHigh.visible = true
      this.meshLow.visible = false
    }
  }
}

function createMaterial(segments: integer, vertices: integer) : THREE.ShaderMaterial {
  let uniforms = {
    grassSize: { value: new THREE.Vector2(GRASS_WIDTH, GRASS_HEIGHT) },
    grassParams: { value: new THREE.Vector4(segments, vertices, 0, 0) },
    grassDraw: { value: new THREE.Vector4(GRASS_LOD_DIST, GRASS_MAX_DIST, 0, 0) },
    time: { value: 0.0 },
    playerPos: { value: new THREE.Vector3(0, 0, 0) }
  }

  return new THREE.ShaderMaterial({
    defines: {},
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib["fog"], uniforms]),
    vertexShader: grassVertShader,
    fragmentShader: grassFragShader,
    fog: true,
    side: THREE.DoubleSide
  })
}