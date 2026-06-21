import { useEffect, useState } from 'react'

interface VisualViewportLayout {
  height: number
  offsetTop: number
  keyboardOffset: number
}

function readViewport(): VisualViewportLayout {
  const viewport = window.visualViewport
  if (!viewport) {
    return {
      height: window.innerHeight,
      offsetTop: 0,
      keyboardOffset: 0,
    }
  }

  const keyboardOffset = Math.max(
    0,
    window.innerHeight - viewport.height - viewport.offsetTop,
  )

  return {
    height: viewport.height,
    offsetTop: viewport.offsetTop,
    keyboardOffset,
  }
}

function useVisualViewportLayout(enabled: boolean): VisualViewportLayout {
  const [layout, setLayout] = useState<VisualViewportLayout>(() => readViewport())

  useEffect(() => {
    if (!enabled) {
      setLayout(readViewport())
      return undefined
    }

    let frame = 0
    const update = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => setLayout(readViewport()))
    }

    update()

    const viewport = window.visualViewport
    const preventPageScroll = () => {
      if (window.scrollY !== 0) {
        window.scrollTo(0, 0)
      }
    }

    viewport?.addEventListener('resize', update)
    viewport?.addEventListener('scroll', update)
    viewport?.addEventListener('scroll', preventPageScroll)
    window.addEventListener('resize', update)

    return () => {
      cancelAnimationFrame(frame)
      viewport?.removeEventListener('resize', update)
      viewport?.removeEventListener('scroll', update)
      viewport?.removeEventListener('scroll', preventPageScroll)
      window.removeEventListener('resize', update)
    }
  }, [enabled])

  return layout
}

export {
  useVisualViewportLayout,
}
