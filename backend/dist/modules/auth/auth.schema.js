import { z } from 'zod';
export const registerBodySchema = z.object({
    name: z.string().trim().min(1).max(80),
    email: z.string().trim().email(),
    password: z.string().min(8).max(128),
});
export const loginBodySchema = z.object({
    email: z.string().trim().email(),
    password: z.string().min(8).max(128),
});
export const forgotPasswordBodySchema = z.object({
    email: z.string().trim().email(),
    newPassword: z.string().min(8).max(128),
});
export const registerResponseSchema = z.object({
    user: z.object({
        id: z.string(),
        name: z.string(),
        email: z.string().email(),
    }),
    token: z.string(),
});
export const meResponseSchema = registerResponseSchema.shape.user;
