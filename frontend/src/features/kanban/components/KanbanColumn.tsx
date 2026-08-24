import React, { useState } from 'react';
import type { Column, Task } from '../kanban.api';
import { TaskCard } from './TaskCard';

interface KanbanColumnProps {
  column: Column;
  tasks: Task[];
  onDropTask: (taskId: string, targetColumnId: string) => void;
  onAddTask: (columnId: string) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  column,
  tasks,
  onDropTask,
  onAddTask,
  onEditTask,
  onDeleteTask,
}) => {
  const [isOver, setIsOver] = useState(false);

  function handleDragOver(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    if (!isOver) setIsOver(true);
  }

  function handleDragLeave(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    if (event.currentTarget.contains(event.relatedTarget as Node)) return;
    setIsOver(false);
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsOver(false);
    const taskId = event.dataTransfer.getData('text/plain');
    if (taskId) {
      onDropTask(taskId, column.id);
    }
  }

  return (
    <section
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex min-h-[560px] flex-col rounded-2xl border p-4 transition-all ${
        isOver
          ? 'border-devflow-accent bg-devflow-accent/10 shadow-lg shadow-devflow-accent/10 ring-2 ring-devflow-accent/20'
          : 'border-white/10 bg-devflow-surface/40'
      }`}
    >
      <header className="flex items-center justify-between pb-3 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="h-2 w-2 rounded-full bg-devflow-accent shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
          <h3 className="font-semibold text-sm text-devflow-text tracking-wide">{column.name}</h3>
        </div>
        <span className="rounded-full bg-white/10 px-2.5 py-0.5 font-mono text-xs font-medium text-devflow-muted">
          {tasks.length}
        </span>
      </header>

      <div className="mt-4 flex-1 space-y-3 overflow-y-auto pr-0.5 custom-scrollbar">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} onEdit={onEditTask} onDelete={onDeleteTask} />
        ))}

        {tasks.length === 0 && (
          <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-white/10 p-4 text-center">
            <p className="text-xs text-devflow-muted/60">Drag cards here or click + below</p>
          </div>
        )}
      </div>

      <button
        onClick={() => onAddTask(column.id)}
        className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-white/10 py-2.5 text-xs font-semibold text-devflow-muted transition hover:border-devflow-accent/40 hover:bg-devflow-accent/5 hover:text-devflow-accent"
      >
        <span className="text-base leading-none">+</span> Add task
      </button>
    </section>
  );
};
