import { addCommentBodySchema, createTaskBodySchema, commentParamsSchema, moveTaskBodySchema, projectParamsSchema, taskParamsSchema, updateTaskBodySchema } from './kanban.schema.js';
import { addComment, createTask, deleteComment, deleteTask, getProjectBoard, KanbanAccessError, KanbanNotFoundError, moveTask, updateTask } from './kanban.service.js';
function getUserId(request) {
    return request.user.sub;
}
export async function getProjectBoardController(request, reply) {
    try {
        await request.jwtVerify();
        const { projectId } = projectParamsSchema.parse(request.params);
        return reply.send(await getProjectBoard(projectId, getUserId(request)));
    }
    catch (error) {
        if (error instanceof KanbanNotFoundError)
            return reply.code(404).send({ message: error.message });
        if (error instanceof KanbanAccessError)
            return reply.code(403).send({ message: error.message });
        return reply.code(401).send({ message: 'Authentication required' });
    }
}
export async function createTaskController(request, reply) {
    try {
        await request.jwtVerify();
        const { projectId } = projectParamsSchema.parse(request.params);
        const body = createTaskBodySchema.safeParse(request.body);
        if (!body.success)
            return reply.code(400).send({ message: 'Invalid task data', errors: body.error.flatten() });
        return reply.code(201).send(await createTask(projectId, getUserId(request), body.data));
    }
    catch (error) {
        if (error instanceof KanbanNotFoundError)
            return reply.code(404).send({ message: error.message });
        if (error instanceof KanbanAccessError)
            return reply.code(403).send({ message: error.message });
        return reply.code(401).send({ message: 'Authentication required' });
    }
}
export async function moveTaskController(request, reply) {
    try {
        await request.jwtVerify();
        const { taskId } = taskParamsSchema.parse(request.params);
        const body = moveTaskBodySchema.safeParse(request.body);
        if (!body.success)
            return reply.code(400).send({ message: 'Invalid target column data' });
        return reply.send(await moveTask(taskId, getUserId(request), body.data));
    }
    catch (error) {
        if (error instanceof KanbanNotFoundError)
            return reply.code(404).send({ message: error.message });
        if (error instanceof KanbanAccessError)
            return reply.code(403).send({ message: error.message });
        return reply.code(401).send({ message: 'Authentication required' });
    }
}
export async function updateTaskController(request, reply) {
    try {
        await request.jwtVerify();
        const { taskId } = taskParamsSchema.parse(request.params);
        const body = updateTaskBodySchema.safeParse(request.body);
        if (!body.success)
            return reply.code(400).send({ message: 'Invalid task update data' });
        return reply.send(await updateTask(taskId, getUserId(request), body.data));
    }
    catch (error) {
        if (error instanceof KanbanNotFoundError)
            return reply.code(404).send({ message: error.message });
        if (error instanceof KanbanAccessError)
            return reply.code(403).send({ message: error.message });
        return reply.code(401).send({ message: 'Authentication required' });
    }
}
export async function deleteTaskController(request, reply) {
    try {
        await request.jwtVerify();
        const { taskId } = taskParamsSchema.parse(request.params);
        return reply.send(await deleteTask(taskId, getUserId(request)));
    }
    catch (error) {
        if (error instanceof KanbanNotFoundError)
            return reply.code(404).send({ message: error.message });
        if (error instanceof KanbanAccessError)
            return reply.code(403).send({ message: error.message });
        return reply.code(401).send({ message: 'Authentication required' });
    }
}
export async function addCommentController(request, reply) {
    try {
        await request.jwtVerify();
        const { taskId } = taskParamsSchema.parse(request.params);
        const body = addCommentBodySchema.safeParse(request.body);
        if (!body.success)
            return reply.code(400).send({ message: 'Comment text is required' });
        return reply.code(201).send(await addComment(taskId, getUserId(request), body.data.text));
    }
    catch (error) {
        if (error instanceof KanbanNotFoundError)
            return reply.code(404).send({ message: error.message });
        if (error instanceof KanbanAccessError)
            return reply.code(403).send({ message: error.message });
        return reply.code(401).send({ message: 'Authentication required' });
    }
}
export async function deleteCommentController(request, reply) {
    try {
        await request.jwtVerify();
        const { taskId, commentId } = commentParamsSchema.parse(request.params);
        return reply.send(await deleteComment(taskId, commentId, getUserId(request)));
    }
    catch (error) {
        if (error instanceof KanbanNotFoundError)
            return reply.code(404).send({ message: error.message });
        if (error instanceof KanbanAccessError)
            return reply.code(403).send({ message: error.message });
        return reply.code(401).send({ message: 'Authentication required' });
    }
}
