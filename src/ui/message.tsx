import React, { useMemo } from 'react'
import { tss } from 'tss-react'
import { animated, useTransition } from 'react-spring'

const useStyles = tss.create(({}) => {
  return {
    message: {
      fontSize: '24px',
      textTransform: 'uppercase'
    }
  }
})

const Message = ({
  message = "",
  trail = 35,
  onMessageEnded = () => {},
  forceShowFullMessage = false,
}) => {
  const { classes } = useStyles()
  const items = useMemo(
    () => message.trim().split('').map((letter, index) => ({
      item: letter,
      key: index,
    })),
    [message]
  )

  const transitions = useTransition(items, {
    trail,
    from: { display: 'none' },
    enter: { display: '' },
    onRest: (status, controller, item) => {
      if (item.key === items.length - 1) {
          onMessageEnded()
      }
    }
  })

  return (
      <div className={classes.message}>
          {forceShowFullMessage && (
              <span>{message}</span>
          )}
          {!forceShowFullMessage && transitions((styles, { item, key }) => (
              <animated.span key={key} style={styles}>
                  {item}
              </animated.span>
          ))}
      </div>
  )
}

export default Message