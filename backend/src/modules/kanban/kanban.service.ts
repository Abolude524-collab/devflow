import { isValidObjectId, Types } from 'mongoose';
import { emitTaskChange } from '../../plugins/socket.plugin.js';
import { UserModel } from '../auth/user.model.js';
import { ProjectModel } from '../project/project.model.js';
import { WorkspaceModel } from '../workspace/workspace.model.js';
import { BoardModel, ColumnModel, TaskModel, type TaskPriority } from './kanban.model.js';
import type { CreateTaskBody, MoveTaskBody, UpdateTaskBody } from './kanban.schema.js';

export class KanbanAccessError extends Error {}
export class KanbanNotFoundError extends Error {}

const DEFAULT_COLUMNS = ['Backlog', 'Todo', 'In Progress', 'Done'];

export async function ensureDefaultBoard(projectId: string) {
  let board = await BoardModel.findOne({ projectId });
  if (!board) {
    board = await BoardModel.create({ projectId, name: 'Main Board' });
  }

  const existingColumns = await ColumnModel.find({ boardId: board.id }).sort({ order: 1 });
  if (existingColumns.length === 0) {
    const columnsToCreate = DEFAULT_COLUMNS.map((name, index) => ({
      boardId: board.id,
      name,
      order: index,
    }));
    const created = await ColumnModel.insertMany(columnsToCreate);
    return { board, columns: created };
  }

  return { board, columns: existingColumns };
}

async function assertProjectAccess(projectId: string, userId: string) {
  if (!isValidObjectId(projectId)) throw new KanbanNotFoundError('Project not found');
  const project = await ProjectModel.findById(projectId);
  if (!project) throw new KanbanNotFoundError('Project not found');

  const isMember = await WorkspaceModel.exists({ _id: project.workspaceId, 'members.userId': userId });
  if (!isMember) throw new KanbanAccessError('Workspace access denied');

  return project;
}

function formatTask(task: {
  id: string;
  projectId: unknown;
  boardId: unknown;
  columnId: unknown;
  key: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  order: number;
  reporterId: unknown;
  assignee?: string;
  dueDate?: Date;
  tags?: string[];
  comments?: { id: string; userId: unknown; userName: string; text: string; createdAt: Date }[];
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: task.id,
    projectId: String(task.projectId),
    boardId: String(task.boardId),
    columnId: String(task.columnId),
    key: task.key,
    title: task.title,
    description: task.description,
    priority: task.priority,
    order: task.order,
    reporterId: String(task.reporterId),
    assignee: task.assignee,
    dueDate: task.dueDate ? task.dueDate.toISOString() : undefined,
    tags: task.tags ?? [],
    comments: (task.comments ?? []).map((c) => ({
      id: c.id,
      userId: String(c.userId),
      userName: c.userName,
      text: c.text,
      createdAt: c.createdAt.toISOString(),
    })),
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  };
}

export async function getProjectBoard(projectId: string, userId: string) {
  const project = await assertProjectAccess(projectId, userId);
  const { board, columns } = await ensureDefaultBoard(projectId);

  const tasks = await TaskModel.find({ boardId: board.id }).sort({ order: 1, createdAt: 1 });

  return {
    project: {
      id: project.id,
      name: project.name,
      key: project.key,
      workspaceId: String(project.workspaceId),
    },
    board: {
      id: board.id,
      name: board.name,
    },
    columns: columns.map((col) => ({
      id: col.id,
      boardId: String(col.boardId),
      name: col.name,
      order: col.order,
    })),
    tasks: tasks.map(formatTask),
  };
}

export async function createTask(projectId: string, userId: string, input: CreateTaskBody) {
  const project = await assertProjectAccess(projectId, userId);
  const { board, columns } = await ensureDefaultBoard(projectId);

  let targetColumn = columns.find((c) => c.id === input.columnId);
  if (!targetColumn) {
    targetColumn = columns[0];
  }

  if (!targetColumn) throw new Error('No columns available on board');

  const totalTasks = await TaskModel.countDocuments({ projectId: project.id });
  const taskKey = `${project.key}-${totalTasks + 1}`;

  const tasksInColumn = await TaskModel.countDocuments({ columnId: targetColumn.id });

  const task = await TaskModel.create({
    projectId: project.id,
    boardId: board.id,
    columnId: targetColumn.id,
    key: taskKey,
    title: input.title.trim(),
    description: input.description?.trim(),
    priority: input.priority ?? 'medium',
    order: tasksInColumn,
    reporterId: userId,
    assignee: input.assignee?.trim(),
    dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
    tags: input.tags ?? [],
  });

  const formatted = formatTask(task);
  emitTaskChange(projectId, 'task:created', formatted);
  return formatted;
}

export async function moveTask(taskId: string, userId: string, input: MoveTaskBody) {
  if (!isValidObjectId(taskId)) throw new KanbanNotFoundError('Task not found');
  const task = await TaskModel.findById(taskId);
  if (!task) throw new KanbanNotFoundError('Task not found');

  await assertProjectAccess(String(task.projectId), userId);

  if (!isValidObjectId(input.targetColumnId)) throw new KanbanNotFoundError('Target column not found');
  const targetColumn = await ColumnModel.findById(input.targetColumnId);
  if (!targetColumn) throw new KanbanNotFoundError('Target column not found');

  task.columnId = targetColumn.id as any;
  if (typeof input.newOrder === 'number') {
    task.order = input.newOrder;
  } else {
    const tasksInColumn = await TaskModel.countDocuments({ columnId: targetColumn.id });
    task.order = tasksInColumn;
  }

  await task.save();
  const formatted = formatTask(task);
  emitTaskChange(String(task.projectId), 'task:moved', formatted);
  return formatted;
}

export async function updateTask(taskId: string, userId: string, input: UpdateTaskBody) {
  if (!isValidObjectId(taskId)) throw new KanbanNotFoundError('Task not found');
  const task = await TaskModel.findById(taskId);
  if (!task) throw new KanbanNotFoundError('Task not found');

  await assertProjectAccess(String(task.projectId), userId);

  if (input.title !== undefined) task.title = input.title.trim();
  if (input.description !== undefined) task.description = input.description.trim();
  if (input.priority !== undefined) task.priority = input.priority;
  if (input.columnId !== undefined && isValidObjectId(input.columnId)) {
    task.columnId = input.columnId as any;
  }
  if (input.assignee !== undefined) task.assignee = input.assignee.trim();
  if (input.dueDate !== undefined) {
    task.dueDate = input.dueDate ? new Date(input.dueDate) : undefined;
  }
  if (input.tags !== undefined) task.tags = input.tags;

  await task.save();
  const formatted = formatTask(task);
  emitTaskChange(String(task.projectId), 'task:updated', formatted);
  return formatted;
}

export async function addComment(taskId: string, userId: string, text: string) {
  if (!isValidObjectId(taskId)) throw new KanbanNotFoundError('Task not found');
  const task = await TaskModel.findById(taskId);
  if (!task) throw new KanbanNotFoundError('Task not found');

  await assertProjectAccess(String(task.projectId), userId);

  const user = await UserModel.findById(userId);
  const userName = user?.name || user?.email || 'User';

  const commentId = `comment_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  task.comments.push({
    id: commentId,
    userId: userId as any,
    userName,
    text: text.trim(),
    createdAt: new Date(),
  });

  await task.save();
  const formatted = formatTask(task);
  emitTaskChange(String(task.projectId), 'task:updated', formatted);
  return formatted;
}

export async function deleteComment(taskId: string, commentId: string, userId: string) {
  if (!isValidObjectId(taskId)) throw new KanbanNotFoundError('Task not found');
  const task = await TaskModel.findById(taskId);
  if (!task) throw new KanbanNotFoundError('Task not found');

  await assertProjectAccess(String(task.projectId), userId);

  task.comments = task.comments.filter((c) => c.id !== commentId);
  await task.save();
  const formatted = formatTask(task);
  emitTaskChange(String(task.projectId), 'task:updated', formatted);
  return formatted;
}

export async function deleteTask(taskId: string, userId: string) {
  if (!isValidObjectId(taskId)) throw new KanbanNotFoundError('Task not found');
  const task = await TaskModel.findById(taskId);
  if (!task) throw new KanbanNotFoundError('Task not found');

  const projectId = String(task.projectId);
  await assertProjectAccess(projectId, userId);
  await task.deleteOne();
  emitTaskChange(projectId, 'task:deleted', { id: taskId });
  return { message: 'Task deleted successfully' };
}
