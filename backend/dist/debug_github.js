import mongoose from 'mongoose';
import { env } from './config/env.js';
import { GithubIntegrationModel, GithubActivityModel, GithubAccountModel } from './modules/github/github.model.js';
import { ProjectModel } from './modules/project/project.model.js';
async function debug() {
    await mongoose.connect(env.MONGODB_URI);
    console.log('--- PROJECTS ---');
    const projects = await ProjectModel.find();
    console.log(projects.map(p => ({ id: p.id, name: p.name, key: p.key })));
    console.log('--- GITHUB INTEGRATIONS ---');
    const integrations = await GithubIntegrationModel.find();
    console.log(integrations);
    console.log('--- GITHUB ACTIVITIES ---');
    const activities = await GithubActivityModel.find();
    console.log(activities);
    console.log('--- GITHUB ACCOUNTS ---');
    const accounts = await GithubAccountModel.find();
    console.log(accounts);
    await mongoose.disconnect();
}
debug().catch(console.error);
