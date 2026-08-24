import { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getMe } from '../features/auth/api';
import { useAuthStore } from '../features/auth/auth.store';

export function ProtectedLayout() {
  const { token, user, setUser, clearSession } = useAuthStore();

  const sessionQuery = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => getMe(token!),
    enabled: Boolean(token && !user),
    retry: false,
  });

  useEffect(() => {
    if (sessionQuery.data) {
      setUser(sessionQuery.data);
    }
    if (sessionQuery.isError) {
      clearSession();
    }
  }, [clearSession, sessionQuery.data, sessionQuery.isError, setUser]);

  // If no token exists at all, redirect to login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // While restoring user session from token, display loading screen
  if (sessionQuery.isLoading || (token && !user)) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-devflow-background text-devflow-muted">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-devflow-accent border-t-transparent" />
          <p className="font-mono text-sm">Restoring session...</p>
        </div>
      </main>
    );
  }

  // Render child routes once authenticated
  return <Outlet />;
}
