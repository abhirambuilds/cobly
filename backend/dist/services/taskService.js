"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Task_1 = __importDefault(require("../models/Task"));
const Project_1 = __importDefault(require("../models/Project"));
const Workspace_1 = __importDefault(require("../models/Workspace"));
const activityService_1 = require("./activityService");
class TaskService {
    /**
     * Converts a Mongoose ITask document into a safe API representation.
     */
    static toSafeTask(task) {
        let safeAssignee = null;
        if (task.assignee) {
            if (typeof task.assignee === 'object' && '_id' in task.assignee) {
                // Populated user
                const user = task.assignee;
                safeAssignee = {
                    id: user._id.toString(),
                    name: user.name,
                    email: user.email,
                };
            }
            else {
                // Just ObjectId (should be populated ideally, but handle it safely)
                safeAssignee = {
                    id: task.assignee.toString(),
                    name: 'Unknown',
                    email: 'Unknown'
                };
            }
        }
        return {
            id: task._id.toString(),
            projectId: task.projectId.toString(),
            title: task.title,
            description: task.description,
            assignee: safeAssignee,
            status: task.status,
            priority: task.priority,
            dueDate: task.dueDate,
            createdAt: task.createdAt,
            updatedAt: task.updatedAt,
        };
    }
    /**
     * Helper to verify Workspace membership and Project scoping.
     * Returns { isWorkspaceMember, isWorkspaceOwner, isProjectOwner }
     */
    static async getContext(workspaceId, projectId, userId) {
        const workspace = await Workspace_1.default.findById(workspaceId);
        if (!workspace)
            throw new Error('WORKSPACE_NOT_FOUND');
        const member = workspace.members.find(m => m.user.toString() === userId);
        const project = await Project_1.default.findOne({
            _id: new mongoose_1.default.Types.ObjectId(projectId),
            workspaceId: new mongoose_1.default.Types.ObjectId(workspaceId)
        });
        if (!project)
            throw new Error('PROJECT_NOT_FOUND');
        return {
            isWorkspaceMember: !!member,
            isWorkspaceOwner: member?.role === 'owner',
            isProjectOwner: project.owner.toString() === userId,
            workspace
        };
    }
    static async createTask(workspaceId, projectId, userId, data) {
        const context = await this.getContext(workspaceId, projectId, userId);
        if (!context.isWorkspaceMember) {
            throw new Error('FORBIDDEN');
        }
        let assigneeId;
        if (data.assignee) {
            const isAssigneeInWorkspace = context.workspace.members.some(m => m.user.toString() === data.assignee);
            if (!isAssigneeInWorkspace) {
                throw new Error('INVALID_ASSIGNEE');
            }
            assigneeId = new mongoose_1.default.Types.ObjectId(data.assignee);
        }
        const task = new Task_1.default({
            projectId: new mongoose_1.default.Types.ObjectId(projectId),
            title: data.title,
            description: data.description,
            assignee: assigneeId,
            status: data.status || 'todo',
            priority: data.priority || 'medium',
            dueDate: data.dueDate,
        });
        await task.save();
        await activityService_1.ActivityService.recordActivity({
            workspaceId: workspaceId,
            actorId: userId,
            action: 'task_created',
            entityType: 'task',
            entityId: task._id.toString(),
            metadata: { title: task.title }
        });
        // Populate for safe return
        await task.populate('assignee', 'name email');
        return this.toSafeTask(task);
    }
    static async getTasksByProject(workspaceId, projectId, userId, filters) {
        const context = await this.getContext(workspaceId, projectId, userId);
        if (!context.isWorkspaceMember) {
            throw new Error('FORBIDDEN');
        }
        const query = { projectId: new mongoose_1.default.Types.ObjectId(projectId) };
        if (filters?.status)
            query.status = filters.status;
        if (filters?.priority)
            query.priority = filters.priority;
        if (filters?.assignee) {
            if (filters.assignee === 'null') {
                query.assignee = null;
            }
            else {
                query.assignee = new mongoose_1.default.Types.ObjectId(filters.assignee);
            }
        }
        const tasks = await Task_1.default.find(query).populate('assignee', 'name email');
        return tasks.map(t => this.toSafeTask(t));
    }
    static async getTaskById(workspaceId, projectId, taskId, userId) {
        const context = await this.getContext(workspaceId, projectId, userId);
        if (!context.isWorkspaceMember) {
            throw new Error('FORBIDDEN');
        }
        const task = await Task_1.default.findOne({
            _id: new mongoose_1.default.Types.ObjectId(taskId),
            projectId: new mongoose_1.default.Types.ObjectId(projectId)
        }).populate('assignee', 'name email');
        if (!task) {
            throw new Error('TASK_NOT_FOUND');
        }
        return this.toSafeTask(task);
    }
    static async updateTask(workspaceId, projectId, taskId, userId, data) {
        const context = await this.getContext(workspaceId, projectId, userId);
        if (!context.isWorkspaceMember) {
            throw new Error('FORBIDDEN');
        }
        const task = await Task_1.default.findOne({
            _id: new mongoose_1.default.Types.ObjectId(taskId),
            projectId: new mongoose_1.default.Types.ObjectId(projectId)
        });
        if (!task) {
            throw new Error('TASK_NOT_FOUND');
        }
        const isTaskAssignee = task.assignee?.toString() === userId;
        const isOwner = context.isWorkspaceOwner || context.isProjectOwner;
        const changes = {};
        // Check permissions
        if (isOwner) {
            // Full update allowed
            if (data.title !== undefined) {
                task.title = data.title;
                changes.title = true;
            }
            if (data.description !== undefined) {
                task.description = data.description;
            }
            if (data.priority !== undefined) {
                task.priority = data.priority;
                changes.priority = data.priority;
            }
            if (data.dueDate !== undefined) {
                task.dueDate = data.dueDate;
            }
            // Assignee logic for owners
            if (data.assignee !== undefined) {
                if (data.assignee === null) {
                    task.assignee = undefined;
                    changes.unassigned = true;
                }
                else {
                    const isAssigneeInWorkspace = context.workspace.members.some(m => m.user.toString() === data.assignee);
                    if (!isAssigneeInWorkspace) {
                        throw new Error('INVALID_ASSIGNEE');
                    }
                    task.assignee = new mongoose_1.default.Types.ObjectId(data.assignee);
                    changes.assigned_to = data.assignee;
                }
            }
            if (data.status !== undefined) {
                task.status = data.status;
                changes.status = data.status;
            }
        }
        else if (isTaskAssignee) {
            // Partial update allowed
            if (data.title !== undefined || data.description !== undefined || data.priority !== undefined || data.dueDate !== undefined || data.assignee !== undefined) {
                throw new Error('FORBIDDEN_FIELD_UPDATE');
            }
            if (data.status !== undefined) {
                task.status = data.status;
                changes.status = data.status;
            }
        }
        else {
            throw new Error('FORBIDDEN');
        }
        await task.save();
        await activityService_1.ActivityService.recordActivity({
            workspaceId: workspaceId,
            actorId: userId,
            action: 'task_updated',
            entityType: 'task',
            entityId: task._id.toString(),
            metadata: changes
        });
        await task.populate('assignee', 'name email');
        return this.toSafeTask(task);
    }
    static async deleteTask(workspaceId, projectId, taskId, userId) {
        const context = await this.getContext(workspaceId, projectId, userId);
        // Only Project Owner or Workspace Owner can delete
        if (!context.isWorkspaceOwner && !context.isProjectOwner) {
            throw new Error('FORBIDDEN');
        }
        const task = await Task_1.default.findOne({
            _id: new mongoose_1.default.Types.ObjectId(taskId),
            projectId: new mongoose_1.default.Types.ObjectId(projectId)
        });
        if (!task) {
            throw new Error('TASK_NOT_FOUND');
        }
        await Task_1.default.deleteOne({ _id: task._id });
        await activityService_1.ActivityService.recordActivity({
            workspaceId: workspaceId,
            actorId: userId,
            action: 'task_deleted',
            entityType: 'task',
            entityId: task._id.toString(),
            metadata: { title: task.title }
        });
    }
}
exports.TaskService = TaskService;
