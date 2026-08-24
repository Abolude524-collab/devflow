import { z } from 'zod';
export const projectParamsSchema = z.object({
    projectId: z.string().min(1),
});
export const taskParamsSchema = z.object({
    taskId: z.string().min(1),
});
export const commentParamsSchema = z.object({
    taskId: z.string().min(1),
    commentId: z.string().min(1),
});
export const createTaskBodySchema = z.object({
    title: z.string().min(1, 'Task title is required').max(120, 'Title is too long'),
    description: z.string().max(1000).optional(),
    columnId: z.string().optional(),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
    assignee: z.string().max(80).optional(),
    dueDate: z.string().optional(),
    tags: z.array(z.string()).default([]),
});
export const moveTaskBodySchema = z.object({
    targetColumnId: z.string().min(1, 'Target column ID is required'),
    newOrder: z.number().int().min(0).optional(),
});
export const updateTaskBodySchema = z.object({
    title: z.string().min(1).max(120).optional(),
    description: z.string().max(1000).optional(),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
    columnId: z.string().optional(),
    assignee: z.string().max(80).optional(),
    dueDate: z.string().nullable().optional(),
    tags: z.array(z.string()).optional(),
});
export const addCommentBodySchema = z.object({
    text: z.string().min(1, 'Comment text is required').max(500, 'Comment text is too long'),
});
