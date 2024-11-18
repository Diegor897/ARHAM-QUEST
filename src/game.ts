import * as Phaser from 'phaser'
import { enable3d, Canvas } from '@enable3d/phaser-extension'
import './phaser/gltfFile'

import Stats from 'stats.js'

import { TutorialScene } from './scenes'

function addScenes(game: Phaser.Game) : void {
  game.scene.add('tutorial', new TutorialScene(), true)
}

export async function bootGame() : Promise<Phaser.Game> {
  const config = {
    type: Phaser.WEBGL,
    transparent: true,
    parent: "game",
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: window.innerWidth * Math.max(1, window.devicePixelRatio / 2),
      height: window.innerHeight * Math.max(1, window.devicePixelRatio / 2)
    },
    scene: [],
    ...Canvas()
  }

  const stats = new Stats()
  document.body.appendChild( stats.dom );

  return new Promise(resolve => {
    enable3d(() => {
      let game = new Phaser.Game(config)
      game.events.on(Phaser.Core.Events.STEP, () => {
        stats.update()
      })
      resolve(game)

      // Give React some time to catch up
      setTimeout(() => addScenes(game), 100)
    }).withPhysics('ammo')
  })
}