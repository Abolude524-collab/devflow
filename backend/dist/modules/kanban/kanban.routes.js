import { addCommentController, createTaskController, deleteCommentController, deleteTaskController, getProjectBoardController, moveTaskController, updateTaskController, } from './kanban.controller.js';
const kanbanRoutes = async (fastify) => {
    fastify.get('/projects/:projectId/board', getProjectBoardController);
    fastify.post('/projects/:projectId/tasks', createTaskController);
    fastify.patch('/tasks/:taskId/move', moveTaskController);
    fastify.patch('/tasks/:taskId', updateTaskController);
    fastify.delete('/tasks/:taskId', deleteTaskController);
    fastify.post('/tasks/:taskId/comments', addCommentController);
    fastify.delete('/tasks/:taskId/comments/:commentId', deleteCommentController);
};
export default kanbanRoutes;
