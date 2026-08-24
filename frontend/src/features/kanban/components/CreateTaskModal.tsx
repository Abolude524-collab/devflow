import React, { FormEvent, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../auth/auth.store';
import { getTaskGithubActivities } from '../../github/github.api';
import type { Column, Task, TaskPriority } from '../kanban.api';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    description?: string;
    columnId: string;
    priority: TaskPriority;
    assignee?: string;
    dueDate?: string;
    tags?: string[];
  }) => void;
  onAddComment?: (taskId: string, text: string) => void;
  onDeleteComment?: (taskId: string, commentId: string) => void;
  columns: Column[];
  defaultColumnId?: string;
  taskToEdit?: Task | null;
  isSubmitting?: boolean;
}

const PRIORITIES: { value: TaskPriority; label: string; activeClass: string }[] = [
  { value: 'low', label: 'Low', activeClass: 'border-slate-500 bg-slate-500/20 text-slate-300' },
  { value: 'medium', label: 'Medium', activeClass: 'border-blue-500 bg-blue-500/20 text-blue-300' },
  { value: 'high', label: 'High', activeClass: 'border-orange-500 bg-orange-500/20 text-orange-300' },
  { value: 'urgent', label: 'Urgent', activeClass: 'border-red-500 bg-red-500/20 text-red-300' },
];

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  onAddComment,
  onDeleteComment,
  columns,
  defaultColumnId,
  taskToEdit,
  isSubmitting,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [columnId, setColumnId] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [assignee, setAssignee] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [commentText, setCommentText] = useState('');

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setDescription(taskToEdit.description ?? '');
      setColumnId(taskToEdit.columnId);
      setPriority(taskToEdit.priority);
      setAssignee(taskToEdit.assignee ?? '');
      setDueDate(taskToEdit.dueDate ? taskToEdit.dueDate.slice(0, 10) : '');
      setTags(taskToEdit.tags ?? []);
    } else {
      setTitle('');
      setDescription('');
      setColumnId(defaultColumnId || (columns[0]?.id ?? ''));
      setPriority('medium');
      setAssignee('');
      setDueDate('');
      setTags([]);
    }
    setTagInput('');
    setCommentText('');
  }, [taskToEdit, defaultColumnId, columns, isOpen]);

  if (!isOpen) return null;

  function handleAddTag() {
    const trimmed = tagInput.trim().replace(/^#/, '');
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput('');
    }
  }

  function handleRemoveTag(tagToRemove: string) {
    setTags(tags.filter((t) => t !== tagToRemove));
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim() || !columnId) return;
    onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      columnId,
      priority,
      assignee: assignee.trim() || undefined,
      dueDate: dueDate || undefined,
      tags,
    });
  }

  function handlePostComment(e: FormEvent) {
    e.preventDefault();
    if (taskToEdit && commentText.trim() && onAddComment) {
      onAddComment(taskToEdit.id, commentText.trim());
      setCommentText('');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div onClick={onClose} className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity" />

      {/* Modal Content */}
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-devflow-surface p-6 shadow-2xl custom-scrollbar">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <p className="font-mono text-xs font-semibold uppercase tracking-widest text-devflow-accent">
              {taskToEdit ? 'Task Details & Edit' : 'New Task'}
            </p>
            <h3 className="mt-1 text-xl font-bold text-devflow-text">
              {taskToEdit ? `${taskToEdit.key}: ${taskToEdit.title}` : 'Create Kanban Task'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg border border-white/10 px-2.5 py-1 text-sm font-semibold text-devflow-muted hover:border-white/20 hover:text-white"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-devflow-text">
              Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              maxLength={120}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Implement WebSocket reconnection plugin"
              className="mt-2 w-full rounded-xl border border-white/10 bg-devflow-background px-3.5 py-2.5 text-sm text-devflow-text outline-none focus:border-devflow-accent focus:ring-2 focus:ring-devflow-accent/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-devflow-text">
              Description
            </label>
            <textarea
              rows={3}
              maxLength={1000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add context, acceptance criteria, or links..."
              className="mt-2 w-full rounded-xl border border-white/10 bg-devflow-background px-3.5 py-2.5 text-sm text-devflow-text outline-none focus:border-devflow-accent focus:ring-2 focus:ring-devflow-accent/20"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-devflow-text">
                Target Column
              </label>
              <select
                value={columnId}
                onChange={(e) => setColumnId(e.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-devflow-background px-3.5 py-2.5 text-sm text-devflow-text outline-none focus:border-devflow-accent"
              >
                {columns.map((col) => (
                  <option key={col.id} value={col.id} className="bg-devflow-surface text-devflow-text">
                    {col.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-devflow-text">
                Priority
              </label>
              <div className="mt-2 flex gap-1.5">
                {PRIORITIES.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setPriority(p.value)}
                    className={`flex-1 rounded-lg border py-2 text-center text-xs font-semibold transition ${
                      priority === p.value
                        ? p.activeClass
                        : 'border-white/10 bg-devflow-background text-devflow-muted hover:border-white/20 hover:text-white'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-devflow-text">
                Assignee
              </label>
              <input
                type="text"
                maxLength={80}
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                placeholder="e.g. Enoch Abolude"
                className="mt-2 w-full rounded-xl border border-white/10 bg-devflow-background px-3.5 py-2.5 text-sm text-devflow-text outline-none focus:border-devflow-accent"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-devflow-text">
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-devflow-background px-3.5 py-2.5 text-sm text-devflow-text outline-none focus:border-devflow-accent"
              />
            </div>
          </div>

          {/* Tags Section */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-devflow-text">
              Tags
            </label>
            <div className="mt-2 flex flex-wrap gap-2 rounded-xl border border-white/10 bg-devflow-background p-2.5">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="flex items-center gap-1 rounded-lg bg-devflow-accent/15 px-2.5 py-1 font-mono text-xs text-devflow-accent border border-devflow-accent/30"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 text-devflow-accent hover:text-white"
                  >
                    ✕
                  </button>
                </span>
              ))}

              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="Add tag and press Enter..."
                className="flex-1 bg-transparent px-2 py-0.5 text-xs text-devflow-text outline-none placeholder:text-devflow-muted/50"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-white/10 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-devflow-muted transition hover:border-white/20 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="rounded-xl bg-devflow-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-400 disabled:opacity-60"
            >
              {isSubmitting ? 'Saving...' : taskToEdit ? 'Save Task Changes' : 'Create Task'}
            </button>
          </div>
        </form>

        {/* GitHub Activity & Comments Section (if editing existing task) */}
        {taskToEdit && (
          <div className="mt-8 space-y-6 border-t border-white/10 pt-6">
            {/* GitHub Linked Activity Stream */}
            <GithubTaskActivityFeed taskId={taskToEdit.id} />

            {/* Comments Section */}
            <div>
              <h4 className="text-sm font-bold text-devflow-text">
                Comments ({taskToEdit.comments?.length ?? 0})
              </h4>

              {/* Post new comment */}
              <form onSubmit={handlePostComment} className="mt-3 flex gap-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Write a comment..."
                  className="flex-1 rounded-xl border border-white/10 bg-devflow-background px-3.5 py-2 text-xs text-devflow-text outline-none focus:border-devflow-accent"
                />
                <button
                  type="submit"
                  disabled={!commentText.trim()}
                  className="rounded-xl bg-devflow-accent px-4 py-2 text-xs font-semibold text-white hover:bg-blue-400 disabled:opacity-50"
                >
                  Comment
                </button>
              </form>

              {/* Comment Thread list */}
              <div className="mt-4 space-y-3">
                {taskToEdit.comments?.map((comment) => (
                  <div
                    key={comment.id}
                    className="group flex justify-between rounded-xl border border-white/5 bg-devflow-background/50 p-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-devflow-accent">
                          {comment.userName}
                        </span>
                        <span className="font-mono text-[10px] text-devflow-muted">
                          {new Date(comment.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-devflow-text">{comment.text}</p>
                    </div>

                    {onDeleteComment && (
                      <button
                        onClick={() => onDeleteComment(taskToEdit.id, comment.id)}
                        className="opacity-0 transition-opacity group-hover:opacity-100 text-[10px] text-red-400 hover:underline"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const GithubTaskActivityFeed: React.FC<{ taskId: string }> = ({ taskId }) => {
  const { token } = useAuthStore();
  const activitiesQuery = useQuery({
    queryKey: ['github', 'activities', taskId],
    queryFn: () => getTaskGithubActivities(token!, taskId),
    enabled: Boolean(token && taskId),
  });

  const activities = activitiesQuery.data ?? [];

  if (activities.length === 0) return null;

  return (
    <div>
      <div className="flex items-center gap-2">
        <span className="text-sm">🐙</span>
        <h4 className="text-sm font-bold text-devflow-text">GitHub Activity ({activities.length})</h4>
      </div>

      <div className="mt-3 space-y-2">
        {activities.map((act) => (
          <div
            key={act.id}
            className="flex items-center justify-between rounded-xl border border-white/5 bg-devflow-background/60 px-3.5 py-2.5"
          >
            <div className="flex items-center gap-2.5">
              <span
                className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase ${
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
              <a
                href={act.url}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-devflow-text hover:text-devflow-accent hover:underline line-clamp-1"
              >
                {act.title}
              </a>
            </div>

            <div className="flex items-center gap-2 text-[10px] font-mono text-devflow-muted">
              <span>@{act.author}</span>
              <span>•</span>
              <span>{new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
