import React from 'react';
import type { Task, TaskPriority } from '../kanban.api';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

const PRIORITY_STYLES: Record<TaskPriority, { label: string; badgeClass: string }> = {
  urgent: { label: 'Urgent', badgeClass: 'bg-red-500/10 text-red-400 border-red-500/30' },
  high: { label: 'High', badgeClass: 'bg-orange-500/10 text-orange-400 border-orange-500/30' },
  medium: { label: 'Medium', badgeClass: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
  low: { label: 'Low', badgeClass: 'bg-slate-500/10 text-slate-400 border-slate-500/30' },
};

export const TaskCard: React.FC<TaskCardProps> = ({ task, onEdit, onDelete }) => {
  const priority = PRIORITY_STYLES[task.priority] ?? PRIORITY_STYLES.medium;

  function handleDragStart(event: React.DragEvent<HTMLDivElement>) {
    event.dataTransfer.setData('text/plain', task.id);
    event.dataTransfer.effectAllowed = 'move';
  }

  // Calculate due date status
  let dueDateBadge = null;
  if (task.dueDate) {
    const due = new Date(task.dueDate);
    const now = new Date();
    const isOverdue = due < now && due.toDateString() !== now.toDateString();
    const isToday = due.toDateString() === now.toDateString();

    const formattedDate = due.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

    dueDateBadge = (
      <span
        className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-mono font-medium ${
          isOverdue
            ? 'bg-red-500/15 text-red-300 border border-red-500/30'
            : isToday
            ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
            : 'bg-white/5 text-devflow-muted border border-white/10'
        }`}
        title={`Due: ${formattedDate}`}
      >
        📅 {formattedDate} {isOverdue && '(Overdue)'}
      </span>
    );
  }

  return (
    <article
      draggable
      onDragStart={handleDragStart}
      className="group relative cursor-grab rounded-xl border border-white/10 bg-devflow-surface/90 p-4 transition-all hover:border-devflow-accent/40 hover:shadow-lg hover:shadow-devflow-accent/5 active:cursor-grabbing active:scale-[0.99]"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-xs font-semibold uppercase tracking-wider text-devflow-accent">
          {task.key}
        </span>
        <span
          className={`rounded-full border px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wide ${priority.badgeClass}`}
        >
          {priority.label}
        </span>
      </div>

      <h4
        onClick={() => onEdit(task)}
        className="mt-2 text-sm font-semibold text-devflow-text group-hover:text-white hover:underline cursor-pointer"
      >
        {task.title}
      </h4>

      {task.description && (
        <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-devflow-muted">
          {task.description}
        </p>
      )}

      {/* Tags chips */}
      {task.tags && task.tags.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1">
          {task.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-[10px] text-devflow-accent"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3 text-[11px] text-devflow-muted/70">
        <div className="flex items-center gap-2">
          {dueDateBadge}

          {task.assignee && (
            <span className="flex items-center gap-1 rounded bg-devflow-accent/10 px-1.5 py-0.5 text-[10px] font-medium text-devflow-accent">
              👤 {task.assignee}
            </span>
          )}

          {task.comments && task.comments.length > 0 && (
            <span className="flex items-center gap-0.5 text-[10px] text-devflow-muted">
              💬 {task.comments.length}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={() => onEdit(task)}
            className="rounded px-1.5 py-0.5 text-devflow-muted transition hover:bg-white/10 hover:text-devflow-text"
            title="Edit task details"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(task.id)}
            className="rounded px-1.5 py-0.5 text-red-400/80 transition hover:bg-red-500/10 hover:text-red-300"
            title="Delete task"
          >
            Delete
          </button>
        </div>
      </div>
    </article>
  );
};
