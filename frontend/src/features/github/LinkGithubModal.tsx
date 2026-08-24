import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../auth/auth.store';
import {
  getGithubAccountStatus,
  getGithubAuthUrl,
  getProjectGithubIntegration,
  getUserGithubRepos,
  linkProjectGithubRepo,
  unlinkProjectGithubRepo,
} from './github.api';

interface LinkGithubModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
}

export const LinkGithubModal: React.FC<LinkGithubModalProps> = ({
  isOpen,
  onClose,
  projectId,
  projectName,
}) => {
  const { token } = useAuthStore();
  const queryClient = useQueryClient();
  const [selectedRepo, setSelectedRepo] = useState('');

  const accountQuery = useQuery({
    queryKey: ['github', 'account'],
    queryFn: () => getGithubAccountStatus(token!),
    enabled: Boolean(token && isOpen),
  });

  const integrationQuery = useQuery({
    queryKey: ['github', 'integration', projectId],
    queryFn: () => getProjectGithubIntegration(token!, projectId),
    enabled: Boolean(token && isOpen && projectId),
  });

  const reposQuery = useQuery({
    queryKey: ['github', 'repos'],
    queryFn: () => getUserGithubRepos(token!),
    enabled: Boolean(token && isOpen && accountQuery.data?.connected),
  });

  const linkMutation = useMutation({
    mutationFn: (repoFullName: string) => linkProjectGithubRepo(token!, projectId, repoFullName),
    onSuccess: () => {
      setSelectedRepo('');
      void queryClient.invalidateQueries({ queryKey: ['github', 'integration', projectId] });
    },
  });

  const unlinkMutation = useMutation({
    mutationFn: () => unlinkProjectGithubRepo(token!, projectId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['github', 'integration', projectId] });
    },
  });

  const connectMutation = useMutation({
    mutationFn: () => getGithubAuthUrl(token!),
    onSuccess: (res) => {
      window.location.href = res.url;
    },
  });

  if (!isOpen) return null;

  const isConnected = accountQuery.data?.connected;
  const currentIntegration = integrationQuery.data;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div onClick={onClose} className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity" />

      <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-devflow-surface p-6 shadow-2xl transition-all">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🐙</span>
            <div>
              <p className="font-mono text-xs font-semibold uppercase tracking-widest text-devflow-accent">
                Integrations
              </p>
              <h3 className="text-xl font-bold text-devflow-text">GitHub Integration</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg border border-white/10 px-2.5 py-1 text-sm font-semibold text-devflow-muted hover:border-white/20 hover:text-white"
          >
            ✕
          </button>
        </div>

        <div className="mt-5 space-y-5">
          {/* GitHub Account Connection Card */}
          <div className="rounded-xl border border-white/10 bg-devflow-background/80 p-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-devflow-text">GitHub Authorization</span>
                {isConnected ? (
                  <p className="mt-0.5 text-xs text-devflow-success">
                    Connected as <strong>@{accountQuery.data?.githubUsername}</strong>
                  </p>
                ) : (
                  <p className="mt-0.5 text-xs text-devflow-muted">
                    Authorize DevFlow to access your GitHub repositories.
                  </p>
                )}
              </div>

              {!isConnected && (
                <button
                  onClick={() => connectMutation.mutate()}
                  disabled={connectMutation.isPending}
                  className="rounded-xl bg-devflow-accent px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-400 disabled:opacity-60"
                >
                  {connectMutation.isPending ? 'Connecting...' : 'Connect GitHub'}
                </button>
              )}
            </div>
          </div>

          {/* Currently Linked Repository */}
          {currentIntegration && (
            <div className="rounded-xl border border-devflow-success/30 bg-devflow-success/5 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-devflow-success">
                    Linked Repository
                  </span>
                  <h4 className="mt-1 font-bold text-sm text-devflow-text">{currentIntegration.repoFullName}</h4>
                  <a
                    href={currentIntegration.repoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-block text-xs text-devflow-accent hover:underline"
                  >
                    View on GitHub ↗
                  </a>
                </div>

                <button
                  onClick={() => unlinkMutation.mutate()}
                  disabled={unlinkMutation.isPending}
                  className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-300 hover:bg-red-500/20 disabled:opacity-50"
                >
                  {unlinkMutation.isPending ? 'Unlinking...' : 'Unlink'}
                </button>
              </div>
            </div>
          )}

          {/* Link Repository Selector */}
          {isConnected && !currentIntegration && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-devflow-text">
                Select Repository for {projectName}
              </label>
              <p className="mt-1 text-xs text-devflow-muted">
                Linking a repository enables automatic task transitions when commits or PRs reference task keys e.g. <code>CORE-1</code>.
              </p>

              {reposQuery.isLoading ? (
                <p className="mt-3 text-xs text-devflow-muted animate-pulse">Loading repositories...</p>
              ) : reposQuery.isError ? (
                <p className="mt-3 text-xs text-red-300">{reposQuery.error.message}</p>
              ) : (
                <div className="mt-3 space-y-3">
                  <select
                    value={selectedRepo}
                    onChange={(e) => setSelectedRepo(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-devflow-background px-3.5 py-2.5 text-xs text-devflow-text outline-none focus:border-devflow-accent"
                  >
                    <option value="">-- Choose a repository --</option>
                    {reposQuery.data?.map((repo) => (
                      <option key={repo.id} value={repo.fullName}>
                        {repo.fullName} {repo.private ? '🔒' : ''}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => linkMutation.mutate(selectedRepo)}
                    disabled={!selectedRepo || linkMutation.isPending}
                    className="w-full rounded-xl bg-devflow-accent px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-devflow-accent/20 transition hover:bg-blue-400 disabled:opacity-50"
                  >
                    {linkMutation.isPending ? 'Linking...' : 'Link Selected Repository'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
