"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkspaceService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Workspace_1 = __importDefault(require("../models/Workspace"));
class WorkspaceService {
    /**
     * Converts a Mongoose IWorkspace document into a safe API representation.
     */
    static toSafeWorkspace(workspace) {
        return {
            id: workspace._id.toString(),
            name: workspace.name,
            description: workspace.description,
            ownerId: workspace.owner.toString(),
            createdAt: workspace.createdAt,
            updatedAt: workspace.updatedAt,
        };
    }
    /**
     * Creates a new workspace with the creator as the owner.
     */
    static async createWorkspace(userId, data) {
        const workspace = new Workspace_1.default({
            name: data.name,
            description: data.description,
            owner: new mongoose_1.default.Types.ObjectId(userId),
            members: [
                {
                    user: new mongoose_1.default.Types.ObjectId(userId),
                    role: 'owner',
                }
            ]
        });
        await workspace.save();
        return this.toSafeWorkspace(workspace);
    }
    /**
     * Lists all workspaces where the user is a member or owner.
     */
    static async getWorkspacesForUser(userId) {
        const workspaces = await Workspace_1.default.find({ 'members.user': new mongoose_1.default.Types.ObjectId(userId) });
        return workspaces.map(w => this.toSafeWorkspace(w));
    }
    /**
     * Gets a specific workspace by ID, ensuring the user is a member.
     */
    static async getWorkspaceById(workspaceId, userId) {
        const workspace = await Workspace_1.default.findById(workspaceId);
        if (!workspace) {
            throw new Error('NOT_FOUND');
        }
        const isMember = workspace.members.some(m => m.user.toString() === userId);
        if (!isMember) {
            throw new Error('FORBIDDEN');
        }
        return this.toSafeWorkspace(workspace);
    }
    /**
     * Updates a workspace, ensuring the user is the owner.
     */
    static async updateWorkspace(workspaceId, userId, data) {
        const workspace = await Workspace_1.default.findById(workspaceId);
        if (!workspace) {
            throw new Error('NOT_FOUND');
        }
        const member = workspace.members.find(m => m.user.toString() === userId);
        if (!member || member.role !== 'owner') {
            throw new Error('FORBIDDEN');
        }
        if (data.name !== undefined)
            workspace.name = data.name;
        if (data.description !== undefined)
            workspace.description = data.description;
        await workspace.save();
        return this.toSafeWorkspace(workspace);
    }
    /**
     * Deletes a workspace, ensuring the user is the owner.
     */
    static async deleteWorkspace(workspaceId, userId) {
        const workspace = await Workspace_1.default.findById(workspaceId);
        if (!workspace) {
            throw new Error('NOT_FOUND');
        }
        const member = workspace.members.find(m => m.user.toString() === userId);
        if (!member || member.role !== 'owner') {
            throw new Error('FORBIDDEN');
        }
        await Workspace_1.default.deleteOne({ _id: workspace._id });
    }
}
exports.WorkspaceService = WorkspaceService;
