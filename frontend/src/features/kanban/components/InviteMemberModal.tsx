import React, { FormEvent, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '../../auth/auth.store';
import { sendProjectInvite } from '../../notifications/notifications.api';

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
}

export const InviteMemberModal: React.FC<InviteMemberModalProps> = ({
  isOpen,
  onClose,
  projectId,
  projectName,
}) => {
  const { token } = useAuthStore();
  const [email, setEmail] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const inviteMutation = useMutation({
    mutationFn: (targetEmail: string) => sendProjectInvite(token!, projectId, targetEmail),
    onSuccess: (res) => {
      setSuccessMsg(res.message);
      setEmail('');
    },
  });

  if (!isOpen) return null;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSuccessMsg('');
    inviteMutation.mutate(email.trim());
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div onClick={onClose} className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity" />

      {/* Modal */}
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-devflow-surface p-6 shadow-2xl transition-all">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <p className="font-mono text-xs font-semibold uppercase tracking-widest text-devflow-accent">
              Project Access
            </p>
            <h3 className="mt-1 text-xl font-bold text-devflow-text">Invite Member</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg border border-white/10 px-2.5 py-1 text-sm font-semibold text-devflow-muted hover:border-white/20 hover:text-white"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <p className="text-xs leading-relaxed text-devflow-muted">
            Enter the registered email address of the team member you want to add to{' '}
            <strong className="text-devflow-text">{projectName}</strong>. An in-app invitation will be sent for them to Accept or Decline.
          </p>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-devflow-text">
              User Email <span className="text-red-400">*</span>
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. alex@example.com"
              className="mt-2 w-full rounded-xl border border-white/10 bg-devflow-background px-3.5 py-2.5 text-sm text-devflow-text outline-none focus:border-devflow-accent focus:ring-2 focus:ring-devflow-accent/20"
            />
          </div>

          {inviteMutation.isError && (
            <p className="text-xs text-red-300">{inviteMutation.error.message}</p>
          )}

          {successMsg && (
            <p className="text-xs text-devflow-success">✓ {successMsg}</p>
          )}

          <div className="mt-6 flex items-center justify-end gap-3 border-t border-white/10 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-devflow-muted transition hover:border-white/20 hover:text-white"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={inviteMutation.isPending || !email.trim()}
              className="rounded-xl bg-devflow-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-400 disabled:opacity-60"
            >
              {inviteMutation.isPending ? 'Sending...' : 'Send Invite'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
