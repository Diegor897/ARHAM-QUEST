import React, { useState, useEffect } from 'react'

const LoadingScreen : React.FC<Phaser.Scene> = ({ scene }) => {
  const [status, setStatus] = useState(0)
  const [asset, setAsset] = useState('')

  useEffect(() => {
    scene.load.on(Phaser.Loader.Events.PROGRESS, (value) => {
      setStatus(value)
    })
    scene.load.on(Phaser.Loader.Events.FILE_PROGRESS, (file) => {
      setAsset(file.key)
    })
    scene.load.on(Phaser.Loader.Events.COMPLETE, () => {
      setAsset('')
    })
  }, [])
  return <div id="loadScreen">
    <div className="wrapper">
      <p>Loading...</p>
			<div className="progress-bar">
				<span className="progress-bar-fill" style={ { width: status * 100 + "%" }}></span>
			</div>
      {asset != '' && <p>Loading asset {asset}...</p>}
		</div>
  </div>
}

export default LoadingScreen