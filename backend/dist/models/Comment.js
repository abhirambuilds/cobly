"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const CommentSchema = new mongoose_1.Schema({
    workspaceId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Workspace',
        required: true,
    },
    projectId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Project',
        required: true,
    },
    discussionId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Discussion',
        required: true,
    },
    author: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    content: {
        type: String,
        required: true,
        maxlength: 5000,
    },
}, {
    timestamps: true,
});
CommentSchema.index({ discussionId: 1, createdAt: 1 });
exports.default = mongoose_1.default.model('Comment', CommentSchema);
