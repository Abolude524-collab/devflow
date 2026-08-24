import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ForgotPasswordForm } from '../features/auth/ForgotPasswordForm';
import { LoginForm } from '../features/auth/LoginForm';
import { useAuthStore } from '../features/auth/auth.store';

export function LoginPage() {
  const navigate = useNavigate();
  const { token, user } = useAuthStore();
  const [showForgot, setShowForgot] = useState(false);

  useEffect(() => {
    if (token && user) {
      navigate('/workspaces', { replace: true });
    }
  }, [token, user, navigate]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-devflow-background px-4 py-12">
      <div className="flex w-full max-w-md flex-col items-center justify-center">
        {showForgot ? (
          <ForgotPasswordForm onBack={() => setShowForgot(false)} />
        ) : (
          <>
            <LoginForm onForgotPassword={() => setShowForgot(true)} />
            <Link
              to="/register"
              className="mt-5 block text-sm text-devflow-muted transition hover:text-devflow-accent"
            >
              Need an account? Create one
            </Link>
            <Link
              to="/"
              className="mt-3 block text-xs text-devflow-muted/70 transition hover:text-devflow-muted"
            >
              ← Back to home
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
