export class FiniteStateMachine<Holder> {

  private states : { [key: string] : State<Holder> } = {}
  private sortedStates : State<Holder>[] = []
  private currentState : State<Holder> | null = null

  constructor(private holder: Holder) {
  }

  addState(type: new (parent: FiniteStateMachine<Holder>, holder: Holder) => State<Holder>) : void {
    const state = new type(this, this.holder)
    this.states[state.name] = state
    this.sortedStates.push(state)
  }

  setState(name: string | null) : void {
    const prevState = this.currentState
    
    if (prevState != null) {
      if (prevState.name == name) {
        return
      }
      prevState.exit()
    }

    if (name != null) {
      const state = this.states[name]
      this.currentState = state
      state.enter(prevState == null ? undefined : prevState)
    } else {
      this.currentState = null
    }
  }

  private findNewState() : void {
    for (let state of this.sortedStates) {
      if (state.matchesConditions()) {
        this.setState(state.name)
        return
      }
    }

    this.setState(null)
  }

  update(time: number, delta: number) : void {
    this.findNewState()
    if (this.currentState != null) {
      this.currentState.update(time, delta)
    }
  }
}

export class State<Holder> {

  constructor(public name: string, protected parent: FiniteStateMachine<Holder>, protected holder: Holder) {
  }

  enter(previous?: State<Holder>) : void {
  }

  exit() : void {
  }

  update(time: number, delta: number) : void {
  }

  matchesConditions() : boolean {
    return false
  }
}
