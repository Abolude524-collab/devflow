import { forgotPasswordController, loginController, meController, registerController } from './auth.controller.js';
// Encapsulation keeps auth hooks, decorators, and routes scoped to this module.
const authRoutes = async (fastify) => {
    fastify.post('/register', registerController);
    fastify.post('/login', loginController);
    fastify.get('/me', meController);
    fastify.post('/forgot-password', forgotPasswordController);
};
export default authRoutes;
