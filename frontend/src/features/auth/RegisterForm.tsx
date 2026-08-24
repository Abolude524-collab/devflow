import { FormEvent, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { register } from './api';
import { useAuthStore } from './auth.store';

export function RegisterForm() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const setSession = useAuthStore((state) => state.setSession);
  const mutation = useMutation({ mutationFn: register });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    mutation.mutate(form, { onSuccess: setSession });
  }

  return (
    <form onSubmit={submit} className="mx-auto w-full max-w-md space-y-5 rounded-2xl border border-white/10 bg-devflow-surface p-8 shadow-2xl shadow-black/20">
      <div>
        <p className="font-mono text-sm font-semibold uppercase tracking-[0.2em] text-devflow-success">DevFlow</p>
        <h1 className="mt-2 text-3xl font-bold text-devflow-text">Create your account</h1>
      </div>
      {(['name', 'email', 'password'] as const).map((field) => (
        <label key={field} className="block text-sm font-medium text-devflow-text">
          {field[0].toUpperCase() + field.slice(1)}
          <span className="relative mt-2 block">
            <input
              required
              type={field === 'password' ? (showPassword ? 'text' : 'password') : field}
              minLength={field === 'password' ? 8 : undefined}
              value={form[field]}
              onChange={(event) => setForm({ ...form, [field]: event.target.value })}
              className="w-full rounded-lg border border-white/10 bg-devflow-background px-3 py-2.5 text-devflow-accent caret-devflow-accent outline-none transition placeholder:text-devflow-muted focus:border-devflow-accent focus:ring-2 focus:ring-devflow-accent/20"
            />
            {field === 'password' && (
              <button
                type="button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                title={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-devflow-muted transition hover:text-devflow-accent"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            )}
          </span>
        </label>
      ))}
      {mutation.isError && <p className="text-sm text-red-300">{mutation.error.message}</p>}
      {mutation.isSuccess && <p className="text-sm text-devflow-success">Account created successfully.</p>}
      <button
        disabled={mutation.isPending}
        className="w-full rounded-lg bg-devflow-accent px-4 py-3 font-semibold text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {mutation.isPending ? 'Creating account...' : 'Create account'}
      </button>
    </form>
  );
}
