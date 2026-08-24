import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../auth/auth.store';
import {
  addComment,
  createTask,
  deleteComment,
  deleteTask,
  getProjectBoard,
  moveTask,
  updateTask,
  type Task,
  type TaskPriority,
} from '../kanban.api';
import { LinkGithubModal } from '../../github/LinkGithubModal';
import { ProjectGithubActivityFeed } from '../../github/ProjectGithubActivityFeed';
import { NotificationBell } from '../../notifications/NotificationBell';
import { useKanbanSocket } from '../hooks/useKanbanSocket';
import { CreateTaskModal } from './CreateTaskModal';
import { InviteMemberModal } from './InviteMemberModal';
import { KanbanColumn } from './KanbanColumn';
import { ProjectChatDrawer } from './ProjectChatDrawer';

interface BoardViewProps {
  projectId: string;
  onBack: () => void;
}

export const BoardView: React.FC<BoardViewProps> = ({ projectId, onBack }) => {
  const { token } = useAuthStore();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isGithubModalOpen, setIsGithubModalOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [targetColumnId, setTargetColumnId] = useState<string | undefined>(undefined);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Connect Socket.io for real-time sync, presence, and chat
  const { presence, messages, typingUsers, sendMessage, setTyping } = useKanbanSocket(projectId);

  const boardQuery = useQuery({
    queryKey: ['board', projectId],
    queryFn: () => getProjectBoard(token!, projectId),
    enabled: Boolean(token && projectId),
  });

  const createTaskMutation = useMutation({
    mutationFn: (data: {
      title: string;
      description?: string;
      columnId: string;
      priority: TaskPriority;
      assignee?: string;
      dueDate?: string;
      tags?: string[];
    }) => createTask(token!, projectId, data),
    onSuccess: () => {
      setIsModalOpen(false);
      setEditingTask(null);
      void queryClient.invalidateQueries({ queryKey: ['board', projectId] });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: (data: {
      title: string;
      description?: string;
      columnId: string;
      priority: TaskPriority;
      assignee?: string;
      dueDate?: string;
      tags?: string[];
    }) => updateTask(token!, editingTask!.id, data),
    onSuccess: () => {
      setIsModalOpen(false);
      setEditingTask(null);
      void queryClient.invalidateQueries({ queryKey: ['board', projectId] });
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: ({ taskId, text }: { taskId: string; text: string }) => addComment(token!, taskId, text),
    onSuccess: (updatedTask) => {
      setEditingTask(updatedTask);
      void queryClient.invalidateQueries({ queryKey: ['board', projectId] });
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: ({ taskId, commentId }: { taskId: string; commentId: string }) =>
      deleteComment(token!, taskId, commentId),
    onSuccess: (updatedTask) => {
      setEditingTask(updatedTask);
      void queryClient.invalidateQueries({ queryKey: ['board', projectId] });
    },
  });

  const moveTaskMutation = useMutation({
    mutationFn: ({ taskId, columnId }: { taskId: string; columnId: string }) =>
      moveTask(token!, taskId, columnId),
    onMutate: async ({ taskId, columnId }) => {
      await queryClient.cancelQueries({ queryKey: ['board', projectId] });
      const previousBoard = queryClient.getQueryData(['board', projectId]);

      queryClient.setQueryData(['board', projectId], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          tasks: old.tasks.map((t: Task) => (t.id === taskId ? { ...t, columnId } : t)),
        };
      });

      return { previousBoard };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousBoard) {
        queryClient.setQueryData(['board', projectId], context.previousBoard);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['board', projectId] });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (taskId: string) => deleteTask(token!, taskId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['board', projectId] });
    },
  });

  if (boardQuery.isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center text-devflow-muted">
        <p className="font-mono text-sm animate-pulse">Loading board & columns...</p>
      </div>
    );
  }

  if (boardQuery.isError || !boardQuery.data) {
    return (
      <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-6 text-center text-red-300">
        <p>Failed to load Kanban board.</p>
        <button
          onClick={onBack}
          className="mt-4 rounded-lg bg-white/10 px-4 py-2 text-xs font-semibold text-white hover:bg-white/20"
        >
          ← Return to dashboard
        </button>
      </div>
    );
  }

  const { project, columns, tasks } = boardQuery.data;

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesPriority = selectedPriority === 'all' || task.priority === selectedPriority;

    return matchesSearch && matchesPriority;
  });

  function handleOpenCreate(colId?: string) {
    setEditingTask(null);
    setTargetColumnId(colId);
    setIsModalOpen(true);
  }

  function handleOpenEdit(task: Task) {
    setEditingTask(task);
    setTargetColumnId(task.columnId);
    setIsModalOpen(true);
  }

  function handleFormSubmit(data: {
    title: string;
    description?: string;
    columnId: string;
    priority: TaskPriority;
    assignee?: string;
    dueDate?: string;
    tags?: string[];
  }) {
    if (editingTask) {
      updateTaskMutation.mutate(data);
    } else {
      createTaskMutation.mutate(data);
    }
  }

  return (
    <section className="mx-auto flex min-h-screen w-full max-w-7xl flex-col pb-16">
      {/* Navigation & Real-time Presence Header */}
      <header className="flex flex-col gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-devflow-surface px-3 py-2 text-xs font-semibold text-devflow-muted transition hover:border-white/20 hover:text-devflow-text"
          >
            ← Workspaces
          </button>

          <div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-devflow-accent">
                {project.key}
              </span>
              <h1 className="text-2xl font-bold text-devflow-text">{project.name}</h1>

              {/* Presence Indicator */}
              <div className="ml-2 flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>{presence.length} Online</span>
              </div>
            </div>
            <p className="mt-0.5 text-xs text-devflow-muted">Kanban Board & Real-Time Task Stream</p>
          </div>
        </div>

        {/* Filter controls, Chat drawer toggle, Add action */}
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter tasks (e.g. CORE-1)..."
            className="w-44 rounded-xl border border-white/10 bg-devflow-surface px-3 py-2 text-xs text-devflow-text outline-none focus:border-devflow-accent focus:w-56 transition-all placeholder:text-devflow-muted/60"
          />

          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="rounded-xl border border-white/10 bg-devflow-surface px-3 py-2 text-xs text-devflow-muted outline-none focus:border-devflow-accent"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <button
            onClick={() => setIsGithubModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-devflow-surface px-3 py-2 text-xs font-semibold text-devflow-muted transition hover:border-devflow-accent hover:text-white"
          >
            🐙 GitHub Repo
          </button>

          <button
            onClick={() => setIsInviteModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-devflow-accent/40 bg-devflow-accent/10 px-3 py-2 text-xs font-semibold text-devflow-accent transition hover:bg-devflow-accent/20"
          >
            👤 Invite Member
          </button>

          <NotificationBell />

          <button
            onClick={() => setIsChatOpen(!isChatOpen)}
            className="relative flex items-center gap-1.5 rounded-xl border border-white/10 bg-devflow-surface px-3 py-2 text-xs font-semibold text-devflow-muted transition hover:border-devflow-accent hover:text-devflow-accent"
          >
            💬 Chat
            {messages.length > 0 && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-devflow-accent text-[9px] font-mono text-white">
                {messages.length}
              </span>
            )}
          </button>

          <button
            onClick={() => handleOpenCreate()}
            className="flex items-center gap-1.5 rounded-xl bg-devflow-accent px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-devflow-accent/20 transition hover:bg-blue-400"
          >
            <span className="text-sm leading-none">+</span> New Task
          </button>
        </div>
      </header>

      {/* Board Columns Grid */}
      <div className="mt-6 grid flex-1 grid-cols-1 gap-5 overflow-x-auto pb-4 sm:grid-cols-2 lg:grid-cols-4">
        {columns.map((col) => (
          <KanbanColumn
            key={col.id}
            column={col}
            tasks={filteredTasks.filter((t) => t.columnId === col.id)}
            onDropTask={(taskId, targetColId) => moveTaskMutation.mutate({ taskId, columnId: targetColId })}
            onAddTask={(colId) => handleOpenCreate(colId)}
            onEditTask={handleOpenEdit}
            onDeleteTask={(taskId) => deleteTaskMutation.mutate(taskId)}
          />
        ))}
      </div>

      {/* GitHub Project Activity Stream (below Kanban board) */}
      <ProjectGithubActivityFeed projectId={project.id} />

      {/* Create / Edit Modal */}
      <CreateTaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleFormSubmit}
        onAddComment={(taskId, text) => addCommentMutation.mutate({ taskId, text })}
        onDeleteComment={(taskId, commentId) => deleteCommentMutation.mutate({ taskId, commentId })}
        columns={columns}
        defaultColumnId={targetColumnId}
        taskToEdit={editingTask}
        isSubmitting={createTaskMutation.isPending || updateTaskMutation.isPending}
      />

      {/* Invite Member Modal */}
      <InviteMemberModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        projectId={project.id}
        projectName={project.name}
      />

      {/* Link GitHub Modal */}
      <LinkGithubModal
        isOpen={isGithubModalOpen}
        onClose={() => setIsGithubModalOpen(false)}
        projectId={project.id}
        projectName={project.name}
      />

      {/* Project Chat Drawer */}
      <ProjectChatDrawer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        messages={messages}
        typingUsers={typingUsers}
        onSendMessage={sendMessage}
        onTyping={setTyping}
      />
    </section>
  );
};
