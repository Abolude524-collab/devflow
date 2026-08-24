import { FormEvent, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { login } from './api';
import { useAuthStore } from './auth.store';

interface LoginFormProps {
  onForgotPassword: () => void;
}

export function LoginForm({ onForgotPassword }: LoginFormProps) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const setSession = useAuthStore((state) => state.setSession);
  const mutation = useMutation({ mutationFn: login });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    mutation.mutate(form, { onSuccess: setSession });
  }

  return (
    <form onSubmit={submit} className="mx-auto w-full max-w-md space-y-5 rounded-2xl border border-white/10 bg-devflow-surface p-8 shadow-2xl shadow-black/20">
      <div>
        <p className="font-mono text-sm font-semibold uppercase tracking-[0.2em] text-devflow-success">DevFlow</p>
        <h1 className="mt-2 text-3xl font-bold text-devflow-text">Welcome back</h1>
      </div>
      <label className="block text-sm font-medium text-devflow-text">
        Email
        <input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="mt-2 w-full rounded-lg border border-white/10 bg-devflow-background px-3 py-2.5 text-devflow-accent caret-devflow-accent outline-none transition placeholder:text-devflow-muted focus:border-devflow-accent focus:ring-2 focus:ring-devflow-accent/20" />
      </label>
      <label className="block text-sm font-medium text-devflow-text">
        Password
        <span className="relative mt-2 block">
          <input required type={showPassword ? 'text' : 'password'} minLength={8} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} className="w-full rounded-lg border border-white/10 bg-devflow-background px-3 py-2.5 pr-16 text-devflow-accent caret-devflow-accent outline-none transition placeholder:text-devflow-muted focus:border-devflow-accent focus:ring-2 focus:ring-devflow-accent/20" />
          <button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-devflow-muted transition hover:text-devflow-accent">
            {showPassword ? 'Hide' : 'Show'}
          </button>
        </span>
      </label>
      <button type="button" onClick={onForgotPassword} className="text-sm text-devflow-accent transition hover:text-blue-300">Forgot password?</button>
      {mutation.isError && <p className="text-sm text-red-300">{mutation.error.message}</p>}
      <button disabled={mutation.isPending} className="w-full rounded-lg bg-devflow-accent px-4 py-3 font-semibold text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-60">
        {mutation.isPending ? 'Signing in...' : 'Sign in'}
      </button>
    </form>
  );
}