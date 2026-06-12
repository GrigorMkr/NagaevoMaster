import { useEffect } from 'react';
import { useAppDispatch } from '@/app/hooks';
import { setUser, setUserError, setUserLoading } from '@/features/user/userSlice';
import { clearAuthToken, fetchCurrentUser, getAuthToken } from '@/services/authApi';
import { fetchFavorites } from '@/services/favoritesApi';
import { setFavorites } from '@/features/favorites/favoritesSlice';
function AuthBootstrap() {
    const dispatch = useAppDispatch();
    useEffect(() => {
        const token = getAuthToken();
        if (!token)
            return;
        dispatch(setUserLoading(true));
        fetchCurrentUser()
            .then((user) => {
            dispatch(setUser(user));
            if (token.startsWith('mock:'))
                return null;
            return fetchFavorites();
        })
            .then((ids) => {
            if (ids)
                dispatch(setFavorites(ids));
        })
            .catch(() => {
            clearAuthToken();
            dispatch(setUserError('Сессия истекла'));
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
