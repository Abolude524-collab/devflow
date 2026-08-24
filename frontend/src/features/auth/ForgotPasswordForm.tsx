import { FormEvent, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { requestPasswordReset } from './api';

interface ForgotPasswordFormProps {
  onBack: () => void;
}

export function ForgotPasswordForm({ onBack }: ForgotPasswordFormProps) {
  const [form, setForm] = useState({ email: '', newPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const mutation = useMutation({ mutationFn: requestPasswordReset });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    mutation.mutate(form);
  }

  return (
    <form onSubmit={submit} className="mx-auto w-full max-w-md space-y-5 rounded-2xl border border-white/10 bg-devflow-surface p-8 shadow-2xl shadow-black/20">
      <div>
        <p className="font-mono text-sm font-semibold uppercase tracking-[0.2em] text-devflow-success">DevFlow</p>
        <h1 className="mt-2 text-3xl font-bold text-devflow-text">Reset your password</h1>
        <p className="mt-3 text-sm leading-6 text-devflow-muted">Enter your account email and choose a new password.</p>
      </div>
      <label className="block text-sm font-medium text-devflow-text">
        Email
        <input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="mt-2 w-full rounded-lg border border-white/10 bg-devflow-background px-3 py-2.5 text-devflow-accent caret-devflow-accent outline-none transition placeholder:text-devflow-muted focus:border-devflow-accent focus:ring-2 focus:ring-devflow-accent/20" />
      </label>
      <label className="block text-sm font-medium text-devflow-text">
        New password
        <span className="relative mt-2 block">
          <input required minLength={8} type={showPassword ? 'text' : 'password'} value={form.newPassword} onChange={(event) => setForm({ ...form, newPassword: event.target.value })} className="w-full rounded-lg border border-white/10 bg-devflow-background px-3 py-2.5 pr-16 text-devflow-accent caret-devflow-accent outline-none transition placeholder:text-devflow-muted focus:border-devflow-accent focus:ring-2 focus:ring-devflow-accent/20" />
          <button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-devflow-muted transition hover:text-devflow-accent">{showPassword ? 'Hide' : 'Show'}</button>
        </span>
      </label>
      {mutation.isError && <p className="text-sm text-red-300">{mutation.error.message}</p>}
      {mutation.isSuccess && <p className="text-sm text-devflow-success">Password updated. You can now sign in.</p>}
      <button disabled={mutation.isPending} className="w-full rounded-lg bg-devflow-accent px-4 py-3 font-semibold text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-60">
        {mutation.isPending ? 'Resetting...' : 'Reset password'}
      </button>
      <button type="button" onClick={onBack} className="w-full text-sm text-devflow-muted transition hover:text-devflow-accent">Back to sign in</button>
    </form>
  );
}
