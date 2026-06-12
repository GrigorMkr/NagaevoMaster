import { useCallback } from 'react';
import toast from 'react-hot-toast';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { USER_LOCATION_STORAGE_KEY } from '@/constants';
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
    const detectLocation = useCallback(() => {
        if (!navigator.geolocation) {
            toast.error('Геолокация не поддерживается в этом браузере');
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
            toast.success('Местоположение определено');
        }, () => {
            dispatch(setLocating(false));
            toast.error('Не удалось определить местоположение');
        }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 });
    }, [dispatch]);
    const resetLocation = useCallback(() => {
        removeStoredLocation();
        dispatch(clearAccountLocation());
        toast.success('Местоположение сброшено');
    }, [dispatch]);
    return {
        accountLocation,
        isLocating,
        detectLocation,
        resetLocation,
    };
}

export {
  loadStoredAccountLocation,
  useAccountLocation,
}
