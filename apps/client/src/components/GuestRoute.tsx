import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
export function GuestRoute() { const { user, loading } = useAuth(); if (loading) return <div className="screen-loader"><span className="spinner" />Synchronisation du système</div>; return user ? <Navigate to={user.hasOnboarded ? '/dashboard' : '/onboarding'} replace /> : <Outlet />; }
