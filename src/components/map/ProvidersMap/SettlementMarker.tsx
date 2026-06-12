import { memo } from 'react';
import { Marker, Popup } from 'react-leaflet';
import { GEO, NAGAEVO_STREETS } from '@/constants';
import { centerMarkerIcon } from './mapIcons';
const SettlementMarker = memo(function SettlementMarker() {
    return (<Marker position={[NAGAEVO_STREETS.center.lat, NAGAEVO_STREETS.center.lng]} icon={centerMarkerIcon}>
      <Popup>
        <strong>с. Нагаево</strong>
        <br />
        {GEO.district}, {GEO.region}
      </Popup>
    </Marker>);
});

export {
  SettlementMarker,
}
