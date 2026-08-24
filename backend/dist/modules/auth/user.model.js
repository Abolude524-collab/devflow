import { Schema, model } from 'mongoose';
const userSchema = new Schema({
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    name: { type: String, required: true, trim: true, maxlength: 80 },
}, { timestamps: true });
export const UserModel = model('User', userSchema);
