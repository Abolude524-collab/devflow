import { FormEvent, useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createProject, createWorkspace, getProjects, getWorkspaces } from '../auth/api';
import { useAuthStore } from '../auth/auth.store';
import { BoardView } from '../kanban/components/BoardView';
import { NotificationBell } from '../notifications/NotificationBell';

export function Dashboard() {
  const { token, user, clearSession, activeWorkspace, setActiveWorkspace } = useAuthStore();
  const [workspaceName, setWorkspaceName] = useState('');
  const [projectForm, setProjectForm] = useState({ name: '', key: '', description: '' });
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const workspacesQuery = useQuery({
    queryKey: ['workspaces'],
    queryFn: () => getWorkspaces(token!),
    enabled: Boolean(token),
  });

  const createMutation = useMutation({
    mutationFn: (name: string) => createWorkspace(token!, name),
    onSuccess: (workspace) => {
      setActiveWorkspace(workspace);
      setWorkspaceName('');
      void queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    },
  });

  const projectsQuery = useQuery({
    queryKey: ['projects', activeWorkspace?.id],
    queryFn: () => getProjects(token!, activeWorkspace!.id),
    enabled: Boolean(token && activeWorkspace),
  });

  const projectMutation = useMutation({
    mutationFn: () => createProject(token!, activeWorkspace!.id, projectForm),
    onSuccess: (newProject) => {
      setProjectForm({ name: '', key: '', description: '' });
      void queryClient.invalidateQueries({ queryKey: ['projects', activeWorkspace?.id] });
      setActiveProjectId(newProject.id);
    },
  });

  useEffect(() => {
    if (!activeWorkspace && workspacesQuery.data?.[0]) {
      setActiveWorkspace(workspacesQuery.data[0]);
    }
  }, [activeWorkspace, setActiveWorkspace, workspacesQuery.data]);

  // Reset active project view if active workspace changes
  useEffect(() => {
    setActiveProjectId(null);
  }, [activeWorkspace?.id]);

  if (activeProjectId) {
    return <BoardView projectId={activeProjectId} onBack={() => setActiveProjectId(null)} />;
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (workspaceName.trim()) createMutation.mutate(workspaceName.trim());
  }

  return (
    <section className="mx-auto w-full max-w-6xl">
      <header className="flex flex-col justify-between gap-5 border-b border-white/10 pb-6 sm:flex-row sm:items-center">
        <div>
          <p className="font-mono text-sm font-semibold uppercase tracking-[0.2em] text-devflow-success">
            DevFlow
          </p>
          <h1 className="mt-2 text-3xl font-bold text-devflow-text">Your workspaces</h1>
          <p className="mt-2 text-devflow-muted">Signed in as {user?.email}</p>
        </div>
        <div className="flex items-center gap-3">
          <NotificationBell />
          <button
            onClick={clearSession}
            className="self-start rounded-lg border border-white/10 px-4 py-2 text-sm font-semibold text-devflow-muted transition hover:border-devflow-accent hover:text-devflow-accent sm:self-auto"
          >
            Sign out
          </button>
        </div>
      </header>

      <div className="mt-8 grid gap-6 lg:grid-cols-[0.7fr_1.3fr]">
        <form onSubmit={submit} className="rounded-xl border border-white/10 bg-devflow-surface p-6">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-devflow-success">New workspace</p>
          <h2 className="mt-3 text-2xl font-semibold text-devflow-text">Start a focused space</h2>
          <p className="mt-3 text-sm leading-6 text-devflow-muted">
            Create a home for your projects, tasks, and collaborators.
          </p>
          <label className="mt-6 block text-sm font-medium text-devflow-text">
            Workspace name
            <input
              required
              minLength={2}
              maxLength={80}
              value={workspaceName}
              onChange={(event) => setWorkspaceName(event.target.value)}
              placeholder="Acme engineering"
              className="mt-2 w-full rounded-lg border border-white/10 bg-devflow-background px-3 py-2.5 text-devflow-accent caret-devflow-accent outline-none transition placeholder:text-devflow-muted focus:border-devflow-accent focus:ring-2 focus:ring-devflow-accent/20"
            />
          </label>
          {createMutation.isError && (
            <p className="mt-3 text-sm text-red-300">{createMutation.error.message}</p>
          )}
          <button
            disabled={createMutation.isPending}
            className="mt-5 w-full rounded-lg bg-devflow-accent px-4 py-3 font-semibold text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {createMutation.isPending ? 'Creating...' : 'Create workspace'}
          </button>
        </form>

        <div className="rounded-xl border border-white/10 bg-devflow-surface p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-devflow-accent">
                Workspace directory
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-devflow-text">Choose where to work</h2>
            </div>
            <span className="font-mono text-xs text-devflow-muted">
              {workspacesQuery.data?.length ?? 0} total
            </span>
          </div>

          {workspacesQuery.isLoading && (
            <p className="mt-8 text-sm text-devflow-muted">Loading workspaces...</p>
          )}
          {workspacesQuery.isError && (
            <p className="mt-8 text-sm text-red-300">{workspacesQuery.error.message}</p>
          )}
          {!workspacesQuery.isLoading && !workspacesQuery.data?.length && (
            <p className="mt-8 rounded-lg border border-dashed border-white/15 p-8 text-center text-sm text-devflow-muted">
              Your first workspace will appear here.
            </p>
          )}

          <div className="mt-6 space-y-3">
            {workspacesQuery.data?.map((workspace) => (
              <button
                key={workspace.id}
                onClick={() => setActiveWorkspace(workspace)}
                className={`flex w-full items-center justify-between rounded-lg border p-4 text-left transition ${
                  activeWorkspace?.id === workspace.id
                    ? 'border-devflow-accent bg-devflow-accent/10'
                    : 'border-white/10 hover:border-white/25'
                }`}
              >
                <span>
                  <span className="block font-semibold text-devflow-text">{workspace.name}</span>
                  <span className="mt-1 block font-mono text-xs text-devflow-muted">
                    /{workspace.slug}
                  </span>
                </span>
                <span className="rounded bg-devflow-success/10 px-2 py-1 font-mono text-[10px] uppercase text-devflow-success">
                  {workspace.role}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {activeWorkspace && (
        <div className="mt-6 rounded-xl border border-devflow-success/20 bg-devflow-success/5 p-6">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-devflow-success">
            Active workspace
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-devflow-text">{activeWorkspace.name}</h2>
          <p className="mt-2 text-sm text-devflow-muted">
            Select a project card below to open its interactive Kanban Board.
          </p>
        </div>
      )}

      {activeWorkspace && (
        <div className="mt-6 grid gap-6 lg:grid-cols-[0.7fr_1.3fr]">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              projectMutation.mutate();
            }}
            className="rounded-xl border border-white/10 bg-devflow-surface p-6"
          >
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-devflow-success">
              New project
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-devflow-text">Plan the work</h2>
            <label className="mt-5 block text-sm font-medium text-devflow-text">
              Project name
              <input
                required
                minLength={2}
                maxLength={80}
                value={projectForm.name}
                onChange={(event) => setProjectForm({ ...projectForm, name: event.target.value })}
                placeholder="Core platform"
                className="mt-2 w-full rounded-lg border border-white/10 bg-devflow-background px-3 py-2.5 text-devflow-accent outline-none focus:border-devflow-accent"
              />
            </label>
            <label className="mt-4 block text-sm font-medium text-devflow-text">
              Project key
              <input
                required
                minLength={2}
                maxLength={12}
                value={projectForm.key}
                onChange={(event) =>
                  setProjectForm({ ...projectForm, key: event.target.value.toUpperCase() })
                }
                placeholder="CORE"
                className="mt-2 w-full rounded-lg border border-white/10 bg-devflow-background px-3 py-2.5 font-mono text-devflow-accent outline-none focus:border-devflow-accent"
              />
            </label>
            <button
              disabled={projectMutation.isPending}
              className="mt-5 w-full rounded-lg bg-devflow-accent px-4 py-3 font-semibold text-white hover:bg-blue-400 disabled:opacity-60"
            >
              {projectMutation.isPending ? 'Creating...' : 'Create project'}
            </button>
            {projectMutation.isError && (
              <p className="mt-3 text-sm text-red-300">{projectMutation.error.message}</p>
            )}
          </form>

          <div className="rounded-xl border border-white/10 bg-devflow-surface p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-devflow-accent">
                  Projects
                </p>
                <h2 className="mt-3 text-2xl font-semibold text-devflow-text">
                  {activeWorkspace.name} projects
                </h2>
              </div>
              <span className="font-mono text-xs text-devflow-muted">
                {projectsQuery.data?.length ?? 0} total
              </span>
            </div>

            {projectsQuery.isLoading && (
              <p className="mt-8 text-sm text-devflow-muted">Loading projects...</p>
            )}
            {!projectsQuery.isLoading && !projectsQuery.data?.length && (
              <p className="mt-8 rounded-lg border border-dashed border-white/15 p-8 text-center text-sm text-devflow-muted">
                Create a project to start organizing tasks.
              </p>
            )}

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {projectsQuery.data?.map((project) => (
                <article
                  key={project.id}
                  onClick={() => setActiveProjectId(project.id)}
                  className="group cursor-pointer rounded-xl border border-white/10 bg-devflow-background p-4 transition hover:border-devflow-accent/50 hover:bg-devflow-surface"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-devflow-accent">
                      {project.key}
                    </span>
                    <span className="text-[10px] font-semibold text-devflow-muted group-hover:text-devflow-accent">
                      Open Board →
                    </span>
                  </div>
                  <h3 className="mt-2 font-semibold text-devflow-text group-hover:text-white">
                    {project.name}
                  </h3>
                  {project.description && (
                    <p className="mt-1 text-sm text-devflow-muted line-clamp-2">
                      {project.description}
                    </p>
                  )}
                </article>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}