import React, { useEffect, useState } from 'react'
import { createRoot } from "react-dom/client";

import { bootGame } from './game.ts'
import UI from './ui/ui.tsx'

export function Game() {
  const [ game, setGame ] = useState<Phaser.Game>()

   useEffect(() => {
    bootGame().then(setGame)
   }, [])
  return <>
    { game && <UI game={game}/> }
    <div id="game"/>
  </>
}

const container = document.getElementById("app")
const root = createRoot(container)
root.render(<Game/>)