import { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { SkeletonLoader } from './SkeletonLoader';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <SkeletonLoader />;
  }

  if (!isAuthenticated) {
    // This should never happen if App.tsx routing is correct, but as a safety net
    return <div className="p-4 text-center">Redirecting to login...</div>;
  }

  return <>{children}</>;
}
