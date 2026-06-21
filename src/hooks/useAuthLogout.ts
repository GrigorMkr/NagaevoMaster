import { useCallback } from 'react';
import toast from 'react-hot-toast';
import { useAppDispatch } from '@/app/hooks';
import { logout } from '@/features/user/userSlice';
import { clearAuthToken } from '@/services/authApi';

function useAuthLogout() {
  const dispatch = useAppDispatch();

  return useCallback(() => {
    clearAuthToken();
    dispatch(logout());
    toast.success('Вы вышли из аккаунта');
  }, [dispatch]);
}

export {
  useAuthLogout,
};
