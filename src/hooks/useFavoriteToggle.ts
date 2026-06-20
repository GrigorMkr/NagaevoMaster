import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { addFavorite, removeFavorite } from '@/features/favorites/favoritesSlice';
import { selectIsAuthenticated } from '@/features/user/userSelectors';
import { addFavorite as addFavoriteApi, removeFavorite as removeFavoriteApi } from '@/services/favoritesApi';
import { ROUTES } from '@/constants';
import { getErrorMessage } from '@/utils/errorMessage';

function useFavoriteToggle(listingId: string) {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const isAuthenticated = useAppSelector(selectIsAuthenticated);
    const isFavorite = useAppSelector((state) => state.favorites.ids.includes(listingId));
    const [loading, setLoading] = useState(false);

    const toggle = useCallback(async (event?: React.MouseEvent) => {
        event?.preventDefault();
        event?.stopPropagation();

        if (!isAuthenticated) {
            toast.error('Войдите, чтобы добавить в избранное');
            navigate(ROUTES.AUTH);
            return;
        }

        setLoading(true);
        try {
            if (isFavorite) {
                await removeFavoriteApi(listingId);
                dispatch(removeFavorite(listingId));
                toast.success('Удалено из избранного');
            } else {
                await addFavoriteApi(listingId);
                dispatch(addFavorite(listingId));
                toast.success('Добавлено в избранное');
            }
        } catch (error) {
            toast.error(getErrorMessage(error, 'Не удалось обновить избранное'));
        } finally {
            setLoading(false);
        }
    }, [dispatch, isAuthenticated, isFavorite, listingId, navigate]);

    return {
        isFavorite,
        isAuthenticated,
        loading,
        toggle,
    };
}

export {
  useFavoriteToggle,
}
