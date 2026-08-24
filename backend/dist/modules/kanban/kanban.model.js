import { Schema, model } from 'mongoose';
const boardSchema = new Schema({
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, unique: true, index: true },
    name: { type: String, required: true, default: 'Main Board', trim: true },
}, { timestamps: true });
const columnSchema = new Schema({
    boardId: { type: Schema.Types.ObjectId, ref: 'Board', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 40 },
    order: { type: Number, required: true, default: 0 },
}, { timestamps: true });
columnSchema.index({ boardId: 1, order: 1 });
const commentSchema = new Schema({
    id: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    userName: { type: String, required: true },
    text: { type: String, required: true, maxlength: 500 },
    createdAt: { type: Date, default: Date.now },
}, { _id: false });
const taskSchema = new Schema({
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    boardId: { type: Schema.Types.ObjectId, ref: 'Board', required: true, index: true },
    columnId: { type: Schema.Types.ObjectId, ref: 'Column', required: true, index: true },
    key: { type: String, required: true, uppercase: true, trim: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 1000 },
    priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
    order: { type: Number, required: true, default: 0 },
    reporterId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    assigneeId: { type: Schema.Types.ObjectId, ref: 'User' },
    assignee: { type: String, trim: true, maxlength: 80 },
    dueDate: { type: Date },
    tags: { type: [String], default: [] },
    comments: { type: [commentSchema], default: [] },
}, { timestamps: true });
taskSchema.index({ columnId: 1, order: 1 });
taskSchema.index({ projectId: 1, key: 1 }, { unique: true });
export const BoardModel = model('Board', boardSchema);
export const ColumnModel = model('Column', columnSchema);
export const TaskModel = model('Task', taskSchema);
