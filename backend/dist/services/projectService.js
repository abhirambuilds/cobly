"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Project_1 = __importDefault(require("../models/Project"));
const Workspace_1 = __importDefault(require("../models/Workspace"));
class ProjectService {
    /**
     * Converts a Mongoose IProject document into a safe API representation.
     */
    static toSafeProject(project) {
        return {
            id: project._id.toString(),
            workspaceId: project.workspaceId.toString(),
            ownerId: project.owner.toString(),
            name: project.name,
            description: project.description,
            status: project.status,
            deadline: project.deadline,
            createdAt: project.createdAt,
            updatedAt: project.updatedAt,
        };
    }
    /**
     * Helper to verify if a user has access to a workspace.
     * Returns { isMember, isWorkspaceOwner }
     */
    static async checkWorkspaceAccess(workspaceId, userId) {
        const workspace = await Workspace_1.default.findById(workspaceId);
        if (!workspace) {
            throw new Error('WORKSPACE_NOT_FOUND');
        }
        const member = workspace.members.find(m => m.user.toString() === userId);
        return {
            isMember: !!member,
            isWorkspaceOwner: member?.role === 'owner',
        };
    }
    static async createProject(workspaceId, userId, data) {
        const access = await this.checkWorkspaceAccess(workspaceId, userId);
        if (!access.isMember) {
            throw new Error('FORBIDDEN');
        }
        const project = new Project_1.default({
            workspaceId: new mongoose_1.default.Types.ObjectId(workspaceId),
            owner: new mongoose_1.default.Types.ObjectId(userId),
            name: data.name,
            description: data.description,
            status: data.status || 'planned',
            deadline: data.deadline,
        });
        await project.save();
        return this.toSafeProject(project);
    }
    static async getProjectsByWorkspace(workspaceId, userId) {
        const access = await this.checkWorkspaceAccess(workspaceId, userId);
        if (!access.isMember) {
            throw new Error('FORBIDDEN');
        }
        const projects = await Project_1.default.find({ workspaceId: new mongoose_1.default.Types.ObjectId(workspaceId) });
        return projects.map(p => this.toSafeProject(p));
    }
    static async getProjectById(workspaceId, projectId, userId) {
        const access = await this.checkWorkspaceAccess(workspaceId, userId);
        if (!access.isMember) {
            throw new Error('FORBIDDEN');
        }
        const project = await Project_1.default.findOne({
            _id: new mongoose_1.default.Types.ObjectId(projectId),
            workspaceId: new mongoose_1.default.Types.ObjectId(workspaceId)
        });
        if (!project) {
            throw new Error('PROJECT_NOT_FOUND');
        }
        return this.toSafeProject(project);
    }
    static async updateProject(workspaceId, projectId, userId, data) {
        const access = await this.checkWorkspaceAccess(workspaceId, userId);
        if (!access.isMember) {
            throw new Error('FORBIDDEN');
        }
        const project = await Project_1.default.findOne({
            _id: new mongoose_1.default.Types.ObjectId(projectId),
            workspaceId: new mongoose_1.default.Types.ObjectId(workspaceId)
        });
        if (!project) {
            throw new Error('PROJECT_NOT_FOUND');
        }
        const isProjectOwner = project.owner.toString() === userId;
        if (!isProjectOwner && !access.isWorkspaceOwner) {
            throw new Error('FORBIDDEN');
        }
        if (data.name !== undefined)
            project.name = data.name;
        if (data.description !== undefined)
            project.description = data.description;
        if (data.status !== undefined)
            project.status = data.status;
        if (data.deadline !== undefined)
            project.deadline = data.deadline;
        await project.save();
        return this.toSafeProject(project);
    }
    static async deleteProject(workspaceId, projectId, userId) {
        const access = await this.checkWorkspaceAccess(workspaceId, userId);
        if (!access.isMember) {
            throw new Error('FORBIDDEN');
        }
        const project = await Project_1.default.findOne({
            _id: new mongoose_1.default.Types.ObjectId(projectId),
            workspaceId: new mongoose_1.default.Types.ObjectId(workspaceId)
        });
        if (!project) {
            throw new Error('PROJECT_NOT_FOUND');
        }
        const isProjectOwner = project.owner.toString() === userId;
        if (!isProjectOwner && !access.isWorkspaceOwner) {
            throw new Error('FORBIDDEN');
        }
        await Project_1.default.deleteOne({ _id: project._id });
    }
}
exports.ProjectService = ProjectService;
