import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import mmrgl from 'mmr-gl';
import 'mmr-gl/dist/mmr-gl.css';
import { VK_MAPS_STYLE } from '@/constants/vkMaps';
import { useNativeMapLifecycle } from '@/hooks/useNativeMapLifecycle';
import { ensureVkMapsReady } from '@/services/vkMapsRuntime';
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
  const mapRef = useRef<mmrgl.Map | null>(null);
  const onClickRef = useRef(onClick);
  const [map, setMap] = useState<mmrgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  onClickRef.current = onClick;

  const refreshMap = useCallback(() => {
    mapRef.current?.resize();
  }, []);

  useNativeMapLifecycle(refreshMap);

  useEffect(() => {
    let cancelled = false;
    let instance: mmrgl.Map | null = null;
    let resizeObserver: ResizeObserver | null = null;

    void ensureVkMapsReady().then((ready) => {
      if (cancelled) {
        return;
      }
      if (!ready) {
        setMapError('Ключ VK Карт не настроен');
        return;
      }

      const container = containerRef.current;
      if (!container) {
        return;
      }

      const [lat, lng] = center;
      instance = new mmrgl.Map({
        container,
        style: VK_MAPS_STYLE,
        center: [lng, lat],
        zoom,
        minZoom,
        maxZoom,
        scrollZoom,
        touchZoomRotate: true,
        touchPitch: false,
        dragPan: true,
        attributionControl: true,
        failIfMajorPerformanceCaveat: false,
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

      const handleError = (event: { error?: Error }) => {
        console.warn('[vk-maps] map error:', event.error?.message ?? event);
        setMapError('Не удалось загрузить карту');
      };

      instance.on('click', handleClick);
      instance.on('error', handleError);
      instance.once('load', () => {
        if (cancelled || !instance) {
          return;
        }
        setMapError(null);
        setMapLoaded(true);
        instance.resize();
      });

      resizeObserver = new ResizeObserver(() => instance?.resize());
      resizeObserver.observe(container);

      mapRef.current = instance;
      setMap(instance);
    });

    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
      if (instance) {
        instance.remove();
      }
      mapRef.current = null;
      setMap(null);
      setMapLoaded(false);
    };
  }, [center, maxBounds, maxZoom, minZoom, scrollZoom, zoom, zoomControl, zoomControlPosition]);

  return (
    <VkMapContext.Provider value={{ map, mapLoaded }}>
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        <div ref={containerRef} className={className} />
        {mapError && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem',
              textAlign: 'center',
              color: 'var(--color-text-muted)',
              fontSize: 'var(--font-size-sm)',
              background: 'var(--color-bg-card)',
              zIndex: 1,
            }}
          >
            {mapError}
          </div>
        )}
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
