import { useState, useEffect } from 'react'

interface ContextMenuState<T> {
  show: boolean
  x: number
  y: number
  item: T | null
}

export const useContextMenus = <T1, T2, T3>() => {
  const [conventionMenu, setConventionMenu] = useState<ContextMenuState<T1>>({
    show: false,
    x: 0,
    y: 0,
    item: null
  })

  const [decisionMenu, setDecisionMenu] = useState<ContextMenuState<T2>>({
    show: false,
    x: 0,
    y: 0,
    item: null
  })

  const [paiementMenu, setPaiementMenu] = useState<ContextMenuState<T3>>({
    show: false,
    x: 0,
    y: 0,
    item: null
  })

  const handleConventionContextMenu = (e: React.MouseEvent, item: T1) => {
    e.preventDefault()
    e.stopPropagation()
    setConventionMenu({
      show: true,
      x: e.clientX,
      y: e.clientY,
      item
    })
  }

  const handleDecisionContextMenu = (e: React.MouseEvent, item: T2) => {
    e.preventDefault()
    e.stopPropagation()
    setDecisionMenu({
      show: true,
      x: e.clientX,
      y: e.clientY,
      item
    })
  }

  const handlePaiementContextMenu = (e: React.MouseEvent, item: T3) => {
    e.preventDefault()
    e.stopPropagation()
    setPaiementMenu({
      show: true,
      x: e.clientX,
      y: e.clientY,
      item
    })
  }

  const closeConventionMenu = () => {
    setConventionMenu({ show: false, x: 0, y: 0, item: null })
  }

  const closeDecisionMenu = () => {
    setDecisionMenu({ show: false, x: 0, y: 0, item: null })
  }

  const closePaiementMenu = () => {
    setPaiementMenu({ show: false, x: 0, y: 0, item: null })
  }

  // Event listeners for context menu
  useEffect(() => {
    const handleClickOutside = () => {
      if (conventionMenu.show) closeConventionMenu()
      if (decisionMenu.show) closeDecisionMenu()
      if (paiementMenu.show) closePaiementMenu()
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (conventionMenu.show) closeConventionMenu()
        if (decisionMenu.show) closeDecisionMenu()
        if (paiementMenu.show) closePaiementMenu()
      }
    }

    document.addEventListener('click', handleClickOutside)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('click', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [conventionMenu.show, decisionMenu.show, paiementMenu.show])

  return {
    conventionMenu,
    decisionMenu,
    paiementMenu,
    handleConventionContextMenu,
    handleDecisionContextMenu,
    handlePaiementContextMenu,
    closeConventionMenu,
    closeDecisionMenu,
    closePaiementMenu,
  }
}
