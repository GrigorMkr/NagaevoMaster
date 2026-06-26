import { useEffect, useRef, useState, type ReactNode } from 'react';
import mmrgl from 'mmr-gl';
import 'mmr-gl/dist/mmr-gl.css';
import { VK_MAPS_STYLE } from '@/constants/vkMaps';
import { configureVkMaps } from '@/services/vkMapsRuntime';
import { latLngBoundsToLngLatBounds } from '@/utils/mapBounds';
import { useVkMap, VkMapContext } from './VkMapContext';

interface VkMapProps {
  className?: string;
  center: [number, number];
  zoom: number;
  minZoom?: number;
  maxZoom?: number;
  maxBounds?: [[number, number], [number, number]];
  scrollZoom?: boolean;
  zoomControl?: boolean;
  zoomControlPosition?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  onClick?: (lat: number, lng: number) => void;
  children?: ReactNode;
}

function VkMapLayers({ children }: { children: ReactNode }) {
  const { mapLoaded } = useVkMap();
  if (!mapLoaded) {
    return null;
  }
  return <>{children}</>;
}

function VkMap({
  className,
  center,
  zoom,
  minZoom,
  maxZoom,
  maxBounds,
  scrollZoom = true,
  zoomControl = true,
  zoomControlPosition = 'top-right',
  onClick,
  children,
}: VkMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onClickRef = useRef(onClick);
  const [map, setMap] = useState<mmrgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  onClickRef.current = onClick;

  useEffect(() => {
    configureVkMaps();
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const [lat, lng] = center;
    const instance = new mmrgl.Map({
      container,
      style: VK_MAPS_STYLE,
      center: [lng, lat],
      zoom,
      minZoom,
      maxZoom,
      scrollZoom,
      attributionControl: true,
    });

    if (zoomControl) {
      instance.addControl(new mmrgl.NavigationControl({ showCompass: false }), zoomControlPosition);
    }

    if (maxBounds) {
      instance.setMaxBounds(latLngBoundsToLngLatBounds(maxBounds));
    }

    const handleClick = (event: mmrgl.MapMouseEvent) => {
      onClickRef.current?.(event.lngLat.lat, event.lngLat.lng);
    };

    instance.on('click', handleClick);
    instance.once('load', () => setMapLoaded(true));

    const resizeObserver = new ResizeObserver(() => instance.resize());
    resizeObserver.observe(container);

    setMap(instance);

    return () => {
      resizeObserver.disconnect();
      instance.off('click', handleClick);
      instance.remove();
      setMap(null);
      setMapLoaded(false);
    };
  }, []);

  return (
    <VkMapContext.Provider value={{ map, mapLoaded }}>
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        <div ref={containerRef} className={className} />
        {children && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              zIndex: 2,
            }}
          >
            <VkMapLayers>{children}</VkMapLayers>
          </div>
        )}
      </div>
    </VkMapContext.Provider>
  );
}

export {
  VkMap,
  VkMapLayers,
};
