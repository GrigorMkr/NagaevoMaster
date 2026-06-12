import { memo } from 'react';
import { CircleMarker, Popup } from 'react-leaflet';
import type { AccountLocation } from '@/types/location';
interface UserLocationMarkerProps {
    location: AccountLocation;
}
const UserLocationMarker = memo(function UserLocationMarker({ location, }: UserLocationMarkerProps) {
    return (<CircleMarker center={[location.lat, location.lng]} radius={10} pathOptions={{ color: '#17624a', fillColor: '#2d9a74', fillOpacity: 0.85, weight: 2 }}>
      <Popup>{location.label}</Popup>
    </CircleMarker>);
});

export {
  UserLocationMarker,
}
