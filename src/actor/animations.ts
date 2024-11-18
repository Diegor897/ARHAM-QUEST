import { ExtendedObject3D } from '@enable3d/phaser-extension'

import { FiniteStateMachine, State } from '../fsm'
export { FiniteStateMachine, State } from '../fsm'

export class AnimationState<Holder extends ExtendedObject3D> extends State<Holder> {

  protected animation? : THREE.AnimationAction
  protected prevState? : AnimationState<Holder>

  constructor(name: string, parent: FiniteStateMachine<Holder>, holder: Holder) {
    super(name, parent, holder)
  }

  enter(previous?: State<Holder>): void {
    this.prevState = previous as AnimationState<Holder> | undefined
    this.enter0(previous as AnimationState<Holder> | undefined)
    this.prevState = undefined
  }

  enter0(previous? : AnimationState<Holder>) : void {
  }

  getAnimation(name: string) : THREE.AnimationAction {
    return this.holder.anims.get(name)
  }

  playAnimation(current: THREE.AnimationAction) : void {
    current.enabled = true
    current.time = 0.0
    if (this.prevState && this.prevState.animation) {
      this.prepareBlend(current, this.prevState.animation, this.prevState)
    } else if (this.animation) {
      // Note: playing multiple animations without switching states might lead to weird behavior
      this.prepareBlend(current, this.animation, this)
    }
    current.play()
    this.animation = current
  }

  prepareBlend(currentAnim: THREE.AnimationAction, prevAnim: THREE.AnimationAction, prevState : AnimationState<Holder>) : void {
    currentAnim.setEffectiveTimeScale(1.0)
    currentAnim.setEffectiveWeight(1.0)
    currentAnim.crossFadeFrom(prevAnim, 0.1, false)
    currentAnim.play()
    prevState.animation = undefined
  }
}