import { useCallback } from 'react';
import toast from 'react-hot-toast';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import {
  GEOLOCATION_FRESH_TIMEOUT_MS,
  GEOLOCATION_MAX_AGE_MS,
  GEOLOCATION_TIMEOUT_MS,
} from '@/constants';
import { selectIsAuthenticated } from '@/features/user/userSelectors';
import { clearAccountLocation, setAccountLocation, setLocating } from '@/features/user/userSlice';
import { reverseGeocode } from '@/services/geoApi';
import { clearUserLocation, saveUserLocation } from '@/services/usersApi';
import type { AccountLocation } from '@/types/location';
import {
    loadStoredAccountLocation,
    removeStoredAccountLocation,
    saveStoredAccountLocation,
} from '@/utils/accountLocationStorage';
import { getErrorMessage } from '@/utils/errorMessage';

function useAccountLocation() {
    const dispatch = useAppDispatch();
    const isAuthenticated = useAppSelector(selectIsAuthenticated);
    const accountLocation = useAppSelector((state) => state.user.accountLocation);
    const isLocating = useAppSelector((state) => state.user.isLocating);

    const persistLocation = useCallback(async (location: AccountLocation) => {
        saveStoredAccountLocation(location);
        dispatch(setAccountLocation(location));
        if (!isAuthenticated) {
            return;
        }
        try {
            await saveUserLocation(location);
        } catch (error) {
            console.warn('Не удалось сохранить местоположение на сервере', error);
        }
    }, [dispatch, isAuthenticated]);

    const detectLocationAsync = useCallback((options?: { silent?: boolean; forceFresh?: boolean }) => new Promise<AccountLocation | null>((resolve) => {
        if (!navigator.geolocation) {
            if (!options?.silent) {
                toast.error('Геолокация не поддерживается в этом браузере');
            }
            resolve(null);
            return;
        }
        const forceFresh = options?.forceFresh ?? false;
        dispatch(setLocating(true));
        navigator.geolocation.getCurrentPosition((position) => {
            void (async () => {
                let lat = position.coords.latitude;
                let lng = position.coords.longitude;
                let label = 'Текущее местоположение';

                if (isAuthenticated) {
                    try {
                        const geo = await reverseGeocode(lat, lng);
                        if (geo.label.trim()) {
                            label = geo.label;
                        }
                    } catch {
                        // оставляем GPS-координаты и подпись по умолчанию
                    }
                }

                const location: AccountLocation = {
                    lat,
                    lng,
                    label,
                    updatedAt: new Date().toISOString(),
                };
                await persistLocation(location);
                dispatch(setLocating(false));
                if (!options?.silent) {
                    toast.success(label === 'Текущее местоположение' ? 'Местоположение определено' : label);
                }
                resolve(location);
            })();
        }, () => {
            dispatch(setLocating(false));
            if (!options?.silent) {
                toast.error('Не удалось определить местоположение');
            }
            resolve(null);
        }, {
            enableHighAccuracy: true,
            timeout: forceFresh ? GEOLOCATION_FRESH_TIMEOUT_MS : GEOLOCATION_TIMEOUT_MS,
            maximumAge: forceFresh ? 0 : GEOLOCATION_MAX_AGE_MS,
        });
    }), [dispatch, isAuthenticated, persistLocation]);

    const detectLocation = useCallback(() => {
        void detectLocationAsync();
    }, [detectLocationAsync]);

    const resetLocation = useCallback(async () => {
        removeStoredAccountLocation();
        dispatch(clearAccountLocation());
        if (isAuthenticated) {
            try {
                await clearUserLocation();
            } catch (error) {
                toast.error(getErrorMessage(error, 'Не удалось сбросить местоположение на сервере'));
                return;
            }
        }
        toast.success('Местоположение сброшено');
    }, [dispatch, isAuthenticated]);

    return {
        accountLocation,
        isLocating,
        detectLocation,
        detectLocationAsync,
        resetLocation,
        persistLocation,
    };
}

export {
    loadStoredAccountLocation,
    useAccountLocation,
};
