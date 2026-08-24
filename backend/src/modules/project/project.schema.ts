import { z } from 'zod';

export const workspaceParamsSchema = z.object({
  workspaceId: z.string().length(24),
});

export const createProjectBodySchema = z.object({
  name: z.string().trim().min(2).max(80),
  key: z.string().trim().min(2).max(12).regex(/^[a-z0-9-]+$/i),
  description: z.string().trim().max(240).optional(),
});

export type CreateProjectBody = z.infer<typeof createProjectBodySchema>;

export const projectResponseSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  name: z.string(),
  key: z.string(),
  description: z.string().optional(),
  createdAt: z.string(),
});
