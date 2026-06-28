import { Capacitor } from '@capacitor/core';
import {
  GEOLOCATION_FRESH_TIMEOUT_MS,
  GEOLOCATION_MAX_AGE_MS,
  GEOLOCATION_TIMEOUT_MS,
} from '@/constants';
import { isNativeApp } from '@/utils/nativeApp';

const GPS_TARGET_ACCURACY_M = 50;
const GPS_IMPROVE_TIMEOUT_MS = 20_000;

type GeolocationFailureCode = 'unsupported' | 'permission' | 'unavailable' | 'timeout';

class DeviceGeolocationError extends Error {
  readonly code: GeolocationFailureCode;

  constructor(code: GeolocationFailureCode, message: string) {
    super(message);
    this.name = 'DeviceGeolocationError';
    this.code = code;
  }
}

interface DevicePosition {
  lat: number;
  lng: number;
  accuracy: number;
}

function mapBrowserError(error: GeolocationPositionError): DeviceGeolocationError {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return new DeviceGeolocationError(
        'permission',
        'Разрешите доступ к геолокации в настройках браузера или телефона',
      );
    case error.POSITION_UNAVAILABLE:
      return new DeviceGeolocationError(
        'unavailable',
        'GPS недоступен. Включите службы геолокации и попробуйте снова',
      );
    case error.TIMEOUT:
      return new DeviceGeolocationError(
        'timeout',
        'Не удалось получить точные координаты вовремя. Попробуйте на открытом месте',
      );
    default:
      return new DeviceGeolocationError('unavailable', 'Не удалось определить местоположение');
  }
}

function toDevicePosition(position: GeolocationPosition): DevicePosition {
  return {
    lat: position.coords.latitude,
    lng: position.coords.longitude,
    accuracy: position.coords.accuracy,
  };
}

function toNativeDevicePosition(position: {
  coords: { latitude: number; longitude: number; accuracy: number };
}): DevicePosition {
  return {
    lat: position.coords.latitude,
    lng: position.coords.longitude,
    accuracy: position.coords.accuracy,
  };
}

function getBrowserPosition(forceFresh: boolean): Promise<DevicePosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new DeviceGeolocationError('unsupported', 'Геолокация не поддерживается в этом браузере'));
      return;
    }

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: forceFresh ? GEOLOCATION_FRESH_TIMEOUT_MS : GEOLOCATION_TIMEOUT_MS,
      maximumAge: forceFresh ? 0 : GEOLOCATION_MAX_AGE_MS,
    };

    if (!forceFresh) {
      navigator.geolocation.getCurrentPosition(
        (position) => resolve(toDevicePosition(position)),
        (error) => reject(mapBrowserError(error)),
        options,
      );
      return;
    }

    let watchId: number | null = null;
    let settled = false;
    let best: GeolocationPosition | null = null;

    const cleanup = () => {
      if (watchId != null) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
      }
    };

    const finish = (position: GeolocationPosition) => {
      if (settled) {
        return;
      }
      settled = true;
      cleanup();
      window.clearTimeout(improveTimer);
      resolve(toDevicePosition(position));
    };

    const fail = (error: GeolocationPositionError) => {
      if (settled) {
        return;
      }
      if (best) {
        finish(best);
        return;
      }
      settled = true;
      cleanup();
      window.clearTimeout(improveTimer);
      reject(mapBrowserError(error));
    };

    const improveTimer = window.setTimeout(() => {
      navigator.geolocation.getCurrentPosition(finish, fail, options);
    }, GPS_IMPROVE_TIMEOUT_MS);

    watchId = navigator.geolocation.watchPosition(
      (position) => {
        if (!best || position.coords.accuracy < best.coords.accuracy) {
          best = position;
        }
        if (position.coords.accuracy <= GPS_TARGET_ACCURACY_M) {
          finish(position);
        }
      },
      fail,
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: GEOLOCATION_FRESH_TIMEOUT_MS,
      },
    );
  });
}

async function ensureNativeLocationPermission(): Promise<void> {
  const { Geolocation } = await import('@capacitor/geolocation');
  const current = await Geolocation.checkPermissions();

  if (current.location === 'granted' || current.coarseLocation === 'granted') {
    return;
  }

  const requested = await Geolocation.requestPermissions();
  if (requested.location !== 'granted' && requested.coarseLocation !== 'granted') {
    throw new DeviceGeolocationError(
      'permission',
      'Разрешите доступ к геолокации в настройках приложения',
    );
  }
}

function mapNativeError(error: unknown): DeviceGeolocationError {
  const message = error instanceof Error ? error.message.toLowerCase() : '';
  if (message.includes('permission') || message.includes('denied')) {
    return new DeviceGeolocationError(
      'permission',
      'Разрешите доступ к геолокации в настройках приложения',
    );
  }
  if (message.includes('timeout')) {
    return new DeviceGeolocationError(
      'timeout',
      'Не удалось получить точные координаты вовремя. Попробуйте на открытом месте',
    );
  }
  return new DeviceGeolocationError(
    'unavailable',
    'GPS недоступен. Включите службы геолокации и попробуйте снова',
  );
}

async function getNativePositionOnce(forceFresh: boolean): Promise<DevicePosition> {
  const { Geolocation } = await import('@capacitor/geolocation');
  const position = await Geolocation.getCurrentPosition({
    enableHighAccuracy: true,
    timeout: forceFresh ? GEOLOCATION_FRESH_TIMEOUT_MS : GEOLOCATION_TIMEOUT_MS,
    maximumAge: forceFresh ? 0 : GEOLOCATION_MAX_AGE_MS,
  });
  return toNativeDevicePosition(position);
}

async function getNativePositionFresh(): Promise<DevicePosition> {
  const { Geolocation } = await import('@capacitor/geolocation');

  return new Promise((resolve, reject) => {
    let settled = false;
    let best: DevicePosition | null = null;
    let watchId: string | null = null;

    const cleanup = () => {
      if (watchId) {
        void Geolocation.clearWatch({ id: watchId });
        watchId = null;
      }
    };

    const finish = (position: DevicePosition) => {
      if (settled) {
        return;
      }
      settled = true;
      cleanup();
      window.clearTimeout(improveTimer);
      resolve(position);
    };

    const fail = (error: unknown) => {
      if (settled) {
        return;
      }
      if (best) {
        finish(best);
        return;
      }
      settled = true;
      cleanup();
      window.clearTimeout(improveTimer);
      reject(mapNativeError(error));
    };

    const improveTimer = window.setTimeout(() => {
      void getNativePositionOnce(true).then(finish).catch(fail);
    }, GPS_IMPROVE_TIMEOUT_MS);

    void Geolocation.watchPosition(
      {
        enableHighAccuracy: true,
        timeout: GEOLOCATION_FRESH_TIMEOUT_MS,
        maximumAge: 0,
      },
      (position, err) => {
        if (err) {
          fail(err);
          return;
        }
        if (!position) {
          return;
        }
        const current = toNativeDevicePosition(position);
        if (!best || current.accuracy < best.accuracy) {
          best = current;
        }
        if (current.accuracy <= GPS_TARGET_ACCURACY_M) {
          finish(current);
        }
      },
    ).then((id) => {
      watchId = id;
    }).catch(fail);
  });
}

async function getNativePosition(forceFresh: boolean): Promise<DevicePosition> {
  await ensureNativeLocationPermission();

  try {
    if (forceFresh) {
      return await getNativePositionFresh();
    }
    return await getNativePositionOnce(false);
  } catch (error) {
    throw mapNativeError(error);
  }
}

async function getDevicePosition(options?: { forceFresh?: boolean }): Promise<DevicePosition> {
  const forceFresh = options?.forceFresh ?? true;

  if (isNativeApp() && Capacitor.isPluginAvailable('Geolocation')) {
    return getNativePosition(forceFresh);
  }

  return getBrowserPosition(forceFresh);
}

export {
  DeviceGeolocationError,
  getDevicePosition,
};

export type {
  DevicePosition,
  GeolocationFailureCode,
};
