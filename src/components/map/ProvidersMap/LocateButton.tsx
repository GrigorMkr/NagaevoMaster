import { memo, useCallback } from 'react';
import classNames from 'classnames';
import { useMap } from 'react-leaflet';
import { GEO } from '@/constants';
import { useAccountLocation } from '@/hooks/useAccountLocation';
import styles from './ProvidersMap.module.css';
const LocateButton = memo(function LocateButton() {
    const map = useMap();
    const { accountLocation, isLocating, detectLocationAsync } = useAccountLocation();
    const handleLocate = useCallback(() => {
        if (accountLocation) {
            map.setView([accountLocation.lat, accountLocation.lng], GEO.defaultZoom, { animate: true });
            return;
        }
        void detectLocationAsync();
    }, [accountLocation, detectLocationAsync, map]);
    return (<button type="button" className={classNames(styles.filterButton, styles.locateButton)} onClick={handleLocate} disabled={isLocating}>
      {isLocating ? 'Определяем…' : 'Моё местоположение'}
    </button>);
});

export {
  LocateButton,
}
