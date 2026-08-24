import { z } from 'zod';

export const inviteUserBodySchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export const notificationParamsSchema = z.object({
  notificationId: z.string().min(1),
});

export type InviteUserBody = z.infer<typeof inviteUserBodySchema>;
