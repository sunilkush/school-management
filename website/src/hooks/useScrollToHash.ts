import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Smooth-scrolls to the element matching the current URL hash whenever it
 * changes. Used once, inside Home, so anchor nav links that navigate here
 * from another route land on the right section after mount.
 */
export function useScrollToHash() {
  const { hash } = useLocation()

  useEffect(() => {
    if (!hash) return
    const el = document.getElementById(hash.slice(1))
    el?.scrollIntoView({ behavior: 'smooth' })
  }, [hash])
}
