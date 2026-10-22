import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { BrandLoader } from './BrandLoader';
export function GuestRoute() {
  const { user, loading } = useAuth();
  if (loading) return <BrandLoader message="Connexion sécurisée en cours" />;
  return user ? (
    <Navigate to={user.hasOnboarded ? '/dashboard' : '/onboarding'} replace />
  ) : (
    <Outlet />
  );
}
