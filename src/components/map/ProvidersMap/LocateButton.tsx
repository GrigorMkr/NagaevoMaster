import { memo, useCallback } from 'react';
import classNames from 'classnames';
import { USER_LOCATION_MAP_ZOOM } from '@/constants';
import { useAccountLocation } from '@/hooks/useAccountLocation';
import { safeLatLngToLngLat } from '@/utils/mapBounds';
import { useVkMap } from '@/components/map/VkMap/VkMapContext';
import styles from './ProvidersMap.module.css';

const LocateButton = memo(function LocateButton() {
  const { map, mapLoaded } = useVkMap();
  const { isLocating, detectLocationAsync } = useAccountLocation();

  const handleLocate = useCallback(() => {
    void detectLocationAsync({ forceFresh: true }).then((location) => {
      if (!location || !map || !mapLoaded) {
        return;
      }
      const coords = safeLatLngToLngLat(location.lat, location.lng);
      if (!coords) {
        return;
      }
      map.flyTo({
        center: coords,
        zoom: USER_LOCATION_MAP_ZOOM,
        duration: 750,
      });
    });
  }, [detectLocationAsync, map, mapLoaded]);

  return (
    <button
      type="button"
      className={classNames(styles.filterButton, styles.locateButton)}
      onClick={handleLocate}
      disabled={isLocating}
    >
      {isLocating ? 'Определяем…' : 'Моё местоположение'}
    </button>
  );
});

export {
  LocateButton,
};
