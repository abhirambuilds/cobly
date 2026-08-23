import type { User } from './auth';

export interface Discussion {
  id: string;
  title: string;
  content: string;
  projectId: string;
  workspaceId: string;
  author: User;
  createdAt: string;
  updatedAt: string;
}

export interface DiscussionsResponse {
  discussions: Discussion[];
}

export interface DiscussionResponse {
  discussion: Discussion;
}

export interface Comment {
  id: string;
  content: string;
  discussionId: string;
  projectId: string;
  workspaceId: string;
  author: User;
  createdAt: string;
  updatedAt: string;
}

export interface CommentsResponse {
  comments: Comment[];
}

export interface CommentResponse {
  comment: Comment;
}
