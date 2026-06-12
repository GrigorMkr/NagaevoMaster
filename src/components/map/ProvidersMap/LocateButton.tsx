import { memo, useCallback } from 'react'
import classNames from 'classnames'
import { useMap } from 'react-leaflet'
import { GEO } from '@/constants'
import styles from './ProvidersMap.module.css'

export const LocateButton = memo(function LocateButton() {
  const map = useMap()

  const handleLocate = useCallback(() => {
    map.locate({ setView: true, maxZoom: GEO.defaultZoom })
  }, [map])

  return (
    <button
      type="button"
      className={classNames(styles.filterButton, styles.locateButton)}
      onClick={handleLocate}
    >
      Моё местоположение
    </button>
  )
})
