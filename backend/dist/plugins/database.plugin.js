import fp from 'fastify-plugin';
import mongoose from 'mongoose';
import { env } from '../config/env.js';
export default fp(async (fastify) => {
    await mongoose.connect(env.MONGODB_URI);
    fastify.log.info('Connected to MongoDB');
    fastify.addHook('onClose', async () => {
        await mongoose.disconnect();
    });
});
