import { useCallback } from 'react';
import toast from 'react-hot-toast';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
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
import { DeviceGeolocationError, getDevicePosition } from '@/utils/deviceGeolocation';
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
        const forceFresh = options?.forceFresh ?? false;
        dispatch(setLocating(true));

        void (async () => {
            try {
                const position = await getDevicePosition({ forceFresh });
                let lat = position.lat;
                let lng = position.lng;
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
                    const accuracyHint = Number.isFinite(position.accuracy) && position.accuracy > 0
                        ? ` (±${Math.round(position.accuracy)} м)`
                        : '';
                    toast.success(
                        label === 'Текущее местоположение'
                            ? `Местоположение определено${accuracyHint}`
                            : `${label}${accuracyHint}`,
                    );
                }
                resolve(location);
            } catch (error) {
                dispatch(setLocating(false));
                if (!options?.silent) {
                    const message = error instanceof DeviceGeolocationError
                        ? error.message
                        : getErrorMessage(error, 'Не удалось определить местоположение');
                    toast.error(message);
                }
                resolve(null);
            }
        })();
    }), [dispatch, isAuthenticated, persistLocation]);

    const detectLocation = useCallback(() => {
        void detectLocationAsync({ forceFresh: true });
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
