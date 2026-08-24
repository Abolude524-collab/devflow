import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../auth/auth.store';
import { getProjectGithubActivities } from './github.api';

interface ProjectGithubActivityFeedProps {
  projectId: string;
}

export const ProjectGithubActivityFeed: React.FC<ProjectGithubActivityFeedProps> = ({ projectId }) => {
  const { token } = useAuthStore();

  const activitiesQuery = useQuery({
    queryKey: ['github', 'project-activities', projectId],
    queryFn: () => getProjectGithubActivities(token!, projectId),
    enabled: Boolean(token && projectId),
    refetchInterval: 10000, // Poll every 10s as backup for webhooks
  });

  const activities = activitiesQuery.data ?? [];

  return (
    <div className="mt-8 rounded-2xl border border-white/10 bg-devflow-surface/80 p-5 shadow-xl backdrop-blur-sm">
      <div className="flex items-center justify-between border-b border-white/10 pb-3.5">
        <div className="flex items-center gap-2.5">
          <span className="text-lg">🐙</span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-devflow-text">GitHub Project Activity Stream</h3>
              <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-[9px] font-bold text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Sync
              </span>
            </div>
            <p className="mt-0.5 text-[11px] text-devflow-muted">
              Real-time log of commits, branches, and Pull Requests linked to this project
            </p>
          </div>
        </div>
        <span className="rounded-full border border-devflow-accent/30 bg-devflow-accent/10 px-2.5 py-0.5 font-mono text-[10px] font-semibold text-devflow-accent">
          {activities.length} {activities.length === 1 ? 'event' : 'events'}
        </span>
      </div>

      {activitiesQuery.isLoading ? (
        <div className="py-6 text-center text-xs text-devflow-muted animate-pulse">
          Loading GitHub activities...
        </div>
      ) : activities.length === 0 ? (
        <div className="py-6 text-center">
          <p className="text-xs font-semibold text-devflow-text">No GitHub Activity Recorded Yet</p>
          <p className="mt-1 text-[11px] font-mono text-devflow-muted max-w-md mx-auto">
            Commits, branches, or PRs referencing task keys (e.g. <code>CORE-1</code>) will automatically stream here live!
          </p>
        </div>
      ) : (
        <div className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {activities.map((act) => (
            <div
              key={act.id}
              className="flex flex-col justify-between rounded-xl border border-white/5 bg-devflow-background/70 p-3.5 transition hover:border-devflow-accent/40"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`rounded px-2 py-0.5 font-mono text-[10px] font-bold uppercase ${
                      act.type === 'pull_request'
                        ? act.action === 'merged'
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                          : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        : act.type === 'branch'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {act.type === 'pull_request' ? `PR ${act.refId}` : act.type === 'branch' ? 'Branch' : act.refId}
                  </span>

                  <span className="font-mono text-[10px] text-devflow-muted">
                    {new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <p className="mt-2 text-xs font-medium text-devflow-text line-clamp-2">{act.title}</p>
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-2 text-[10px] text-devflow-muted">
                <span className="font-mono text-devflow-accent">@{act.author}</span>
                <a
                  href={act.url}
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-devflow-muted hover:text-white hover:underline"
                >
                  View on GitHub ↗
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
