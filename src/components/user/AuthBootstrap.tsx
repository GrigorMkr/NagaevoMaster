import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '@/app/hooks';
import { logout, setUserError, setUserLoading, setUser, setAccountLocation } from '@/features/user/userSlice';
import { clearAuthToken, fetchCurrentUser, getAuthToken } from '@/services/authApi';
import { ensurePushNotifications } from '@/services/pushApi';
import { isPushEnabledPreference } from '@/utils/pushPreferences';
import { isNativeApp } from '@/utils/nativeApp';
import { setUnauthorizedHandler } from '@/services/api';
import { fetchFavorites } from '@/services/favoritesApi';
import { setFavorites } from '@/features/favorites/favoritesSlice';
import { fetchMyListingReactions } from '@/services/listingSocialApi';
import { setListingReactions } from '@/features/listingReactions/listingReactionsSlice';
import { loadStoredAccountLocation, saveStoredAccountLocation } from '@/utils/accountLocationStorage';
import { saveUserLocation } from '@/services/usersApi';

function sessionEndedMessage(apiMessage?: string): string {
    if (apiMessage?.includes('другом устройстве')) {
        return 'Вы вошли с другого устройства. Этот сеанс завершён.';
    }
    return apiMessage ?? 'Сессия истекла. Войдите снова.';
}

function AuthBootstrap() {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    useEffect(() => {
        setUnauthorizedHandler((apiMessage) => {
            const message = sessionEndedMessage(apiMessage);
            clearAuthToken();
            dispatch(logout());
            dispatch(setUserError(message));
            toast.error(message);
            navigate('/auth', { replace: true });
        });
    }, [dispatch, navigate]);
    useEffect(() => {
        const token = getAuthToken();
        if (!token)
            return;
        dispatch(setUserLoading(true));
        fetchCurrentUser()
            .then(async (user) => {
            dispatch(setUser(user));
            void ensurePushNotifications({
              requestPermission: isNativeApp() || isPushEnabledPreference(),
              force: isNativeApp(),
            });
            const local = loadStoredAccountLocation();
            if (local) {
                dispatch(setAccountLocation(local));
                if (!token.startsWith('mock:')) {
                    try {
                        await saveUserLocation(local);
                    } catch {
                        // API may be unavailable
                    }
                }
            } else if (user.savedLocation) {
                saveStoredAccountLocation(user.savedLocation);
                dispatch(setAccountLocation(user.savedLocation));
            }
            if (token.startsWith('mock:'))
                return { favorites: null, reactions: null };
            const [favorites, reactions] = await Promise.all([
                fetchFavorites(),
                fetchMyListingReactions(),
            ]);
            return { favorites, reactions };
        })
            .then((result) => {
            if (!result)
                return;
            if (result.favorites)
                dispatch(setFavorites(result.favorites));
            if (result.reactions)
                dispatch(setListingReactions(result.reactions));
        })
            .catch((error: unknown) => {
            const apiMessage = error instanceof Error ? error.message : undefined;
            clearAuthToken();
            dispatch(logout());
            dispatch(setUserError(sessionEndedMessage(apiMessage)));
        })
            .finally(() => {
            dispatch(setUserLoading(false));
        });
    }, [dispatch]);
    return null;
}

export {
  AuthBootstrap,
}
