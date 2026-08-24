import { z } from 'zod';

export const createWorkspaceBodySchema = z.object({
  name: z.string().trim().min(2).max(80),
});

export type CreateWorkspaceBody = z.infer<typeof createWorkspaceBodySchema>;

export const workspaceResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  role: z.enum(['owner', 'admin', 'member']),
  createdAt: z.string(),
});

export type WorkspaceResponse = z.infer<typeof workspaceResponseSchema>;
