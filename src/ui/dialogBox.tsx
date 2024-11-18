import React, { useState, useEffect, useCallback } from 'react'
import { tss } from 'tss-react'

import Message from './message'

const useStyles = tss
  .withParams<{ screenWidth: number; screenHeight: number }>()
  .create(({ screenWidth, screenHeight }) => {
    const messageBoxHeight = Math.ceil(screenHeight / 10.5)

      return {
        dialogWindow: {
          imageRendering: 'pixelated',
          textTransform: 'uppercase',
          backgroundColor: '#e2b27e',
          border: 'solid',
          //borderImage: `url("${dialogBorderBox}") 6 / 12px 12px 12px 12px stretch`,
          padding: '16px',
          position: 'absolute',
          top: `${Math.ceil(screenHeight - (messageBoxHeight + (messageBoxHeight * 0.1) + 50))}px`,
          width: `${Math.ceil(screenWidth * 0.8)}px`,
          left: '50%',
          transform: 'translate(-50%, 0%)',
          minHeight: `${messageBoxHeight}px`
        },
        dialogTitle: {
          fontSize: '32px',
          marginBottom: '12px',
          fontWeight: 'bold'
        },
        dialogFooter: {
          fontSize: '24px',
          cursor: 'pointer',
          textAlign: 'end',
          position: 'absolute',
          right: '12px',
          bottom: '12px',
          pointerEvents: 'all !important'
        }
      }
  })

const DialogBox = ({
  size,
  messages,
  onDialogEnded
}) => {
  const [currentMessage, setCurrentMessage] = useState(0)
  const [messageEnded, setMessageEnded] = useState(true)
  const [forceShowFullMessage, setForceShowFullMessage] = useState(false)

  const { classes } = useStyles({ screenWidth: size.width, screenHeight: size.height })

  const handleClick = useCallback(() => {
    if (messageEnded) {
      setMessageEnded(false)
      setForceShowFullMessage(false)
      if (currentMessage < messages.length - 1) {
        setCurrentMessage(currentMessage + 1)
      } else {
        setCurrentMessage(0)
        onDialogEnded()
      }
    } else {
      setMessageEnded(true)
      setForceShowFullMessage(true)
    }
  }, [currentMessage, messageEnded, messages.length, onDialogEnded])

  useEffect(() => {
    const handleKeyPressed = (e) => {
      if (['Enter', 'Space', 'Escape'].includes(e.code)) {
        handleClick()
        e.stopPropagation()
      }
    };
    window.addEventListener('keydown', handleKeyPressed)

    return () => window.removeEventListener('keydown', handleKeyPressed)
  }, [handleClick])

  return (
    <div className={classes.dialogWindow}>
      <div className={classes.dialogTitle}>
        {messages[currentMessage].speaker}
      </div>
      <Message
        message={messages[currentMessage].text}
        trail={35}
        forceShowFullMessage={forceShowFullMessage}
        onMessageEnded={() => {
            setMessageEnded(true)
        }}
      />
      <div
        className={classes.dialogFooter}
        onClick={handleClick}
      >
        {(currentMessage === messages.length - 1 && messageEnded) ? 'Ok' : 'Continuar'}
      </div>
    </div>
  )
}

export default DialogBox