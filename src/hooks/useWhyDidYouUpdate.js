import { useEffect, useRef } from 'react'

/**
 * Logs which props changed between renders to help debug unnecessary
 * re-renders in React components. Pass a third callback to capture the
 * diff object instead of logging it to the console.
 */
export default function useWhyDidYouUpdate(name, props, onChange) {
  const previousProps = useRef()

  useEffect(() => {
    if (!previousProps.current) {
      previousProps.current = props
      return
    }

    const allKeys = Object.keys({ ...previousProps.current, ...props })
    const changes = {}

    allKeys.forEach((key) => {
      if (!Object.is(previousProps.current[key], props[key])) {
        changes[key] = {
          from: previousProps.current[key],
          to: props[key],
        }
      }
    })

    if (Object.keys(changes).length) {
      if (onChange) {
        onChange(changes)
      } else {
        // eslint-disable-next-line no-console
        console.log('[why-did-you-update]', name, changes)
      }
    }

    previousProps.current = props
  })
}
