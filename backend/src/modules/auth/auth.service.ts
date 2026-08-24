import bcrypt from 'bcryptjs';
import type { FastifyInstance } from 'fastify';
import { UserModel } from './user.model.js';
import type { LoginBody, RegisterBody } from './auth.schema.js';
import type { ForgotPasswordBody } from './auth.schema.js';

export class AuthConflictError extends Error {}
export class AuthCredentialsError extends Error {}

function toPublicUser(user: { id: string; name: string; email: string }) {
  return { id: user.id, name: user.name, email: user.email };
}

export async function registerUser(fastify: FastifyInstance, input: RegisterBody) {
  const email = input.email.toLowerCase();
  const existingUser = await UserModel.exists({ email });

  if (existingUser) {
    throw new AuthConflictError('An account with this email already exists');
  }

  const passwordHash = await bcrypt.hash(input.password, 12);
  const user = await UserModel.create({ name: input.name, email, passwordHash });
  const token = await fastify.jwt.sign({ sub: user.id, email: user.email });

  return {
    user: toPublicUser(user),
    token,
  };
}

export async function loginUser(fastify: FastifyInstance, input: LoginBody) {
  const email = input.email.toLowerCase();
  const user = await UserModel.findOne({ email }).select('+passwordHash');

  if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
    throw new AuthCredentialsError('Invalid email or password');
  }

  const token = await fastify.jwt.sign({ sub: user.id, email: user.email });
  return { user: toPublicUser(user), token };
}

export async function getUserById(id: string) {
  const user = await UserModel.findById(id);
  return user ? toPublicUser(user) : null;
}

export async function resetPassword(input: ForgotPasswordBody) {
  const passwordHash = await bcrypt.hash(input.newPassword, 12);
  await UserModel.findOneAndUpdate({ email: input.email.toLowerCase() }, { passwordHash });
}
