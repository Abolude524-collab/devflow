import type { FastifyReply, FastifyRequest } from 'fastify';
import { forgotPasswordBodySchema, loginBodySchema, registerBodySchema } from './auth.schema.js';
import { AuthConflictError, AuthCredentialsError, getUserById, loginUser, registerUser, resetPassword } from './auth.service.js';

export async function registerController(request: FastifyRequest, reply: FastifyReply) {
  const parsed = registerBodySchema.safeParse(request.body);

  if (!parsed.success) {
    return reply.code(400).send({ message: 'Invalid registration details', issues: parsed.error.flatten() });
  }

  try {
    const result = await registerUser(request.server, parsed.data);
    return reply.code(201).send(result);
  } catch (error) {
    if (error instanceof AuthConflictError) {
      return reply.code(409).send({ message: error.message });
    }
    request.log.error(error);
    return reply.code(500).send({ message: 'Unable to create account' });
  }
}

export async function loginController(request: FastifyRequest, reply: FastifyReply) {
  const parsed = loginBodySchema.safeParse(request.body);

  if (!parsed.success) {
    return reply.code(400).send({ message: 'Invalid login details', issues: parsed.error.flatten() });
  }

  try {
    return reply.send(await loginUser(request.server, parsed.data));
  } catch (error) {
    if (error instanceof AuthCredentialsError) {
      return reply.code(401).send({ message: error.message });
    }
    request.log.error(error);
    return reply.code(500).send({ message: 'Unable to sign in' });
  }
}

export async function meController(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
    const { sub } = request.user as { sub: string };
    const user = await getUserById(sub);
    return user ? reply.send(user) : reply.code(404).send({ message: 'User not found' });
  } catch {
    return reply.code(401).send({ message: 'Authentication required' });
  }
}

export async function forgotPasswordController(request: FastifyRequest, reply: FastifyReply) {
  const parsed = forgotPasswordBodySchema.safeParse(request.body);

  if (!parsed.success) {
    return reply.code(400).send({ message: 'Enter a valid email and password of at least 8 characters' });
  }

  await resetPassword(parsed.data);
  return reply.code(202).send({ message: 'If an account exists, reset instructions will be sent shortly' });
}
