import React, { useState, useEffect, useCallback } from 'react'

import * as Phaser from 'phaser'

import BaseScene3D from '../scenes/base.ts'
import { Dialogue } from '../system/dialogues.ts'

import LoadingScreen from './loadScreen.tsx';
import DialogBox from './dialogBox.tsx'

type GameSize = { width: number, height: number }

const UI : React.FC<Phaser.Game> = ({ game }) => {
  const [ size, setSize ] = useState<GameSize> ({
    width : game.scale.gameSize.width, height : game.scale.gameSize.height
  })

  const [loadingScene, setLoadingScene] = useState<BaseScene3D>()
  const [scene, setScene] = useState<BaseScene3D>()
  const [dialogue, setDialogue] = useState<Dialogue>()

  useEffect(() => {
    game.scale.on(Phaser.Scale.Events.RESIZE, (gameSize: Phaser.Structs.Size) => {
      setSize({ width : gameSize.width, height : gameSize.height })
    })
    game.events.on("level_load_start", (scene: BaseScene3D) => {
      setLoadingScene(scene)
    })
    game.events.on("level_load_complete", (scene: BaseScene3D) => {
      setLoadingScene(null)
      setScene(scene)
      setDialogue(null)

      scene.events.on("dialogue_enter", (dialogue: Dialogue) => {
        setDialogue(dialogue)
      })
      scene.events.on("dialogue_exit", () => {
        setDialogue(null)
      })
    })
  }, [])

  return (
    <div id="ui">
      { loadingScene != null && <LoadingScreen scene={loadingScene}/> }
      { loadingScene == null && scene != null && (
          <>
            {dialogue != null && <DialogBox
              size={size}
              messages={dialogue.lines}
              onDialogEnded={() => scene.dialogueSystem?.exitDialogue() }/>}
          </>
      )}
    </div>
  )
}

export default UI