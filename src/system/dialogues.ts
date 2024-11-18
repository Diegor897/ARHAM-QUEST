import BaseScene3D from '../scenes/base'

/**
 * Diálogo simple.
 */
export class Dialogue {
  
  public lines : DialogueLine[]

  constructor(public id: string, ...lines: DialogueLine[]) { 
    this.lines = lines
  }
}
/**
 * Builder for the Dialogue class.
 */
export class DialogueBuilder {
  
  private lines: DialogueLine[] = []

  constructor(private id: string) {
  }

  /**
   * Adds a dialogue line to the builder.
   * @param text The text of the dialogue line.
   * @param speaker The speaker of the dialogue line.
   * @returns The DialogueBuilder instance.
   */
  public addLine(speaker: string, text: string): DialogueBuilder {
    this.lines.push(new DialogueLine(speaker, text))
    return this
  }

  /**
   * Adds a dialogue line to the builder.
   * @param text The text of the dialogue line.
   * @param speaker The speaker of the dialogue line.
   * @returns The DialogueBuilder instance.
   */
  public addLines(speaker: string, ...lines: string[]): DialogueBuilder {
    for (let text of lines) {
      this.lines.push(new DialogueLine(speaker, text))
    }
    return this
  }

  /**
   * Builds the Dialogue instance.
   * @returns The built Dialogue instance.
   */
  public build(): Dialogue {
    return new Dialogue(this.id, ...this.lines)
  }
}

/**
 * Línea de diálogo.
 */
export class DialogueLine {

  constructor(public speaker: string, public text: string) {
  }

}

/**
 * Clase para reproducir diálogos.
 */
export class DialogueSystem {
  
  private dialogues : { [id: string]: Dialogue } = {}
  private currentDialogue : Dialogue | null = null

  constructor(private scene: BaseScene3D) {
  }

  registerDialogue(dialogue: Dialogue) : void {
    this.dialogues[dialogue.id] = dialogue
  }

  playDialogue(dialogueId: string) : void {
    if (this.currentDialogue) {
      this.exitDialogue()
    }
    let dialogue = this.dialogues[dialogueId]
    if (!dialogue) {
      console.error(`Dialogue with id ${dialogueId} not found`)
      return
    }
    this.currentDialogue = dialogue
    this.scene.events.emit("dialogue_enter", dialogue)
  }

  exitDialogue() : void {
    if (!this.currentDialogue) {
      console.warn("No dialogue to exit")
      return
    }
    let dialogue = this.currentDialogue
    this.currentDialogue = null
    this.scene.events.emit("dialogue_exit", dialogue)
  }

  isInDialogue() : boolean {
    return this.currentDialogue !== null
  }
}