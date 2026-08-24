import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { RegisterForm } from '../features/auth/RegisterForm';
import { useAuthStore } from '../features/auth/auth.store';

export function RegisterPage() {
  const navigate = useNavigate();
  const { token, user } = useAuthStore();

  useEffect(() => {
    if (token && user) {
      navigate('/workspaces', { replace: true });
    }
  }, [token, user, navigate]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-devflow-background px-4 py-12">
      <div className="flex w-full max-w-md flex-col items-center justify-center">
        <RegisterForm />
        <Link
          to="/login"
          className="mt-5 block text-sm text-devflow-muted transition hover:text-devflow-accent"
        >
          Already have an account? Sign in
        </Link>
        <Link
          to="/"
          className="mt-3 block text-xs text-devflow-muted/70 transition hover:text-devflow-muted"
        >
          ← Back to home
        </Link>
      </div>
    </main>
  );
}
