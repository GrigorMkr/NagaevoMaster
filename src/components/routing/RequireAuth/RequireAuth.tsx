import { memo } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '@/app/hooks';
import { AppLoadingScreen } from '@/components/ui/AppLoadingScreen/AppLoadingScreen';
import { selectAuthLoading, selectIsAuthenticated } from '@/features/user/userSelectors';
import { ROUTES } from '@/constants';

const RequireAuth = memo(function RequireAuth({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const isAuthLoading = useAppSelector(selectAuthLoading);
  const location = useLocation();

  if (isAuthLoading) {
    return <AppLoadingScreen label="Проверяем вход…" />;
  }

  if (!isAuthenticated) {
    const returnPath = `${location.pathname}${location.search}`;
    const params = new URLSearchParams({
      tab: 'register',
      from: returnPath,
    });
    return <Navigate to={`${ROUTES.AUTH}?${params.toString()}`} replace />;
  }

  return children;
});

export {
  RequireAuth,
};
