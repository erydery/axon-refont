import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { BrandLoader } from './BrandLoader';
export function ProtectedRoute() {
  const { user, loading } = useAuth();
  if (loading) return <BrandLoader message="Connexion sécurisée en cours" />;
  return user ? <Outlet /> : <Navigate to="/sign-in" replace />;
}
