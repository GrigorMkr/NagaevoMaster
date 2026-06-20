import { useCallback } from 'react';
import toast from 'react-hot-toast';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { GEOLOCATION_MAX_AGE_MS, GEOLOCATION_TIMEOUT_MS, USER_LOCATION_STORAGE_KEY, } from '@/constants';
import { clearAccountLocation, setAccountLocation, setLocating, } from '@/features/user/userSlice';
import type { AccountLocation } from '@/types/location';
function saveLocation(location: AccountLocation) {
    localStorage.setItem(USER_LOCATION_STORAGE_KEY, JSON.stringify(location));
}
function removeStoredLocation() {
    localStorage.removeItem(USER_LOCATION_STORAGE_KEY);
}
function loadStoredAccountLocation(): AccountLocation | null {
    try {
        const raw = localStorage.getItem(USER_LOCATION_STORAGE_KEY);
        if (!raw)
            return null;
        const parsed = JSON.parse(raw) as AccountLocation;
        if (typeof parsed.lat !== 'number' || typeof parsed.lng !== 'number')
            return null;
        return parsed;
    }
    catch {
        return null;
    }
}
function useAccountLocation() {
    const dispatch = useAppDispatch();
    const accountLocation = useAppSelector((state) => state.user.accountLocation);
    const isLocating = useAppSelector((state) => state.user.isLocating);

    const detectLocationAsync = useCallback((options?: { silent?: boolean }) => new Promise<AccountLocation | null>((resolve) => {
        if (!navigator.geolocation) {
            if (!options?.silent) {
                toast.error('Геолокация не поддерживается в этом браузере');
            }
            resolve(null);
            return;
        }
        dispatch(setLocating(true));
        navigator.geolocation.getCurrentPosition((position) => {
            const location: AccountLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
                label: 'Текущее местоположение',
                updatedAt: new Date().toISOString(),
            };
            saveLocation(location);
            dispatch(setAccountLocation(location));
            if (!options?.silent) {
                toast.success('Местоположение определено');
            }
            resolve(location);
        }, () => {
            dispatch(setLocating(false));
            if (!options?.silent) {
                toast.error('Не удалось определить местоположение');
            }
            resolve(null);
        }, {
            enableHighAccuracy: true,
            timeout: GEOLOCATION_TIMEOUT_MS,
            maximumAge: GEOLOCATION_MAX_AGE_MS,
        });
    }), [dispatch]);

    const detectLocation = useCallback(() => {
        void detectLocationAsync();
    }, [detectLocationAsync]);
    const resetLocation = useCallback(() => {
        removeStoredLocation();
        dispatch(clearAccountLocation());
        toast.success('Местоположение сброшено');
    }, [dispatch]);
    return {
        accountLocation,
        isLocating,
        detectLocation,
        detectLocationAsync,
        resetLocation,
    };
}

export {
  loadStoredAccountLocation,
  useAccountLocation,
}
