# Cobly API reference

REST API for the Cobly collaborative workspace app. This document describes every endpoint, its authentication and validation rules, and example requests and responses.

- [Conventions](#conventions)
- [Health](#health)
- [Authentication](#authentication)
- [Users](#users)
- [Workspaces](#workspaces)
- [Workspace members](#workspace-members)
- [Projects](#projects)
- [Tasks](#tasks)
- [Discussions](#discussions)
- [Comments](#comments)
- [Meetings](#meetings)
- [Activity](#activity)
- [Notifications](#notifications)

---

## Conventions

**Base URL.** All routes are mounted under `/api`. In local development that is `http://localhost:5000/api`.

**Authentication.** All routes except `POST /api/auth/register`, `POST /api/auth/login`, and the health probes require a JWT. Send it as a Bearer token:

```
Authorization: Bearer YOUR_JWT
```

Obtain a token from [`POST /api/auth/login`](#login). Missing or invalid tokens return `401`.

**Success envelope.** Successful responses wrap their payload under a named key rather than returning a bare object or array:

```json
{ "workspace": { "id": "…", "name": "…" } }
{ "tasks": [ { "id": "…" } ] }
```

Deletions and simple actions return:

```json
{ "success": true, "message": "Task deleted" }
```

**Error envelope.** Errors always use this shape (a `stack` field is included only when `NODE_ENV` is not `production`):

```json
{ "error": { "message": "Forbidden: insufficient permissions for this workspace" } }
```

**Common status codes.**

| Code | Meaning |
| --- | --- |
| `200` | OK |
| `201` | Created |
| `400` | Validation failed or a bad request (e.g. invalid ID format, assignee not a member) |
| `401` | Missing/invalid token, or invalid credentials |
| `403` | Authenticated but not permitted (not a member, or insufficient role) |
| `404` | Resource not found (or not visible to the caller) |
| `409` | Conflict (duplicate email, already a member) |
| `413` | Request body exceeds the 100 kB limit |
| `429` | Rate limit exceeded |
| `500` | Unexpected server error |

**Validation.** Request bodies and path params are validated with Zod before any handler runs. All `*Id` path segments must be valid MongoDB ObjectIds; an invalid format returns `400`. Date/time fields are ISO-8601 strings (e.g. `2026-01-15T09:00:00.000Z`).

**Rate limits.** All `/api` routes are limited to 500 requests per 15 minutes per IP. The auth routes (`/api/auth/*`) are limited more strictly to 20 requests per 15 minutes per IP. Standard `RateLimit-*` response headers are included; exceeding a limit returns `429`.

**Identifiers below.** Examples use placeholders: `YOUR_JWT`, `WORKSPACE_ID`, `PROJECT_ID`, `TASK_ID`, `DISCUSSION_ID`, `COMMENT_ID`, `MEETING_ID`, `USER_ID`, `NOTIFICATION_ID`. Replace them with real values.

---

## Health

### Liveness

```
GET /api/health
```

No authentication. Returns `200` whenever the process is up.

```json
{ "status": "ok", "service": "cobly-api", "type": "liveness", "timestamp": "2026-01-15T09:00:00.000Z" }
```

### Readiness

```
GET /api/health/readiness
```

No authentication. Returns `200` only when MongoDB is connected, otherwise `503`. Suitable for a container/orchestrator readiness probe.

```json
{ "status": "ok", "service": "cobly-api", "type": "readiness", "database": "connected", "timestamp": "2026-01-15T09:00:00.000Z" }
```

---

## Authentication

### Register

```
POST /api/auth/register
```

No authentication. Creates a user account.

**Body**

| Field | Type | Rules |
| --- | --- | --- |
| `name` | string | 2–50 characters |
| `email` | string | valid email; stored lowercased; must be unique |
| `password` | string | 6–100 characters |

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Ada Lovelace","email":"ada@example.com","password":"secret123"}'
```

**`201`**

```json
{
  "message": "User registered successfully",
  "user": { "id": "USER_ID", "name": "Ada Lovelace", "email": "ada@example.com" }
}
```

**Errors:** `400` invalid input · `409` email already exists.

### Login

```
POST /api/auth/login
```

No authentication. Returns a JWT on success.

**Body**

| Field | Type | Rules |
| --- | --- | --- |
| `email` | string | valid email |
| `password` | string | non-empty |

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ada@example.com","password":"secret123"}'
```

**`200`**

```json
{
  "message": "Login successful",
  "token": "YOUR_JWT",
  "user": { "id": "USER_ID", "name": "Ada Lovelace", "email": "ada@example.com" }
}
```

**Errors:** `400` invalid input · `401` invalid credentials.

---

## Users

### Get current user

```
GET /api/users/me
```

Requires auth. Returns the authenticated user's profile.

```bash
curl http://localhost:5000/api/users/me -H "Authorization: Bearer YOUR_JWT"
```

**`200`**

```json
{
  "user": {
    "id": "USER_ID", "name": "Ada Lovelace", "email": "ada@example.com",
    "role": "user", "createdAt": "…", "updatedAt": "…"
  }
}
```

---

## Workspaces

All workspace routes require auth. The caller must be a member; mutations that change the workspace itself require the `owner` role.

### List workspaces

```
GET /api/workspaces
```

Returns only workspaces the caller belongs to.

```json
{ "workspaces": [ { "id": "WORKSPACE_ID", "name": "Acme", "description": "…", "ownerId": "USER_ID", "membersCount": 3, "createdAt": "…", "updatedAt": "…" } ] }
```

### Create workspace

```
POST /api/workspaces
```

The creator becomes the `owner`.

**Body**

| Field | Type | Rules |
| --- | --- | --- |
| `name` | string | 1–100 characters |
| `description` | string | optional, ≤ 500 characters |

```bash
curl -X POST http://localhost:5000/api/workspaces \
  -H "Authorization: Bearer YOUR_JWT" -H "Content-Type: application/json" \
  -d '{"name":"Acme","description":"Company workspace"}'
```

**`201`** → `{ "workspace": { … } }`

### Get workspace

```
GET /api/workspaces/WORKSPACE_ID
```

**`200`** → `{ "workspace": { … } }` · **Errors:** `403` not a member · `404` not found.

### Update workspace

```
PATCH /api/workspaces/WORKSPACE_ID
```

Owner only. Body: `name` (1–100) and/or `description` (≤ 500), both optional.

**`200`** → `{ "workspace": { … } }` · **Errors:** `403` not owner · `404` not found.

### Delete workspace

```
DELETE /api/workspaces/WORKSPACE_ID
```

Owner only. **`200`** → `{ "success": true, "message": "Workspace deleted" }`.

---

## Workspace members

### List members

```
GET /api/workspaces/WORKSPACE_ID/members
```

Any member may list. **`200`**

```json
{ "members": [ { "id": "USER_ID", "name": "Ada Lovelace", "email": "ada@example.com", "role": "owner" } ] }
```

### Add member

```
POST /api/workspaces/WORKSPACE_ID/members
```

Owner only. The target user must already have a Cobly account.

**Body**

| Field | Type | Rules |
| --- | --- | --- |
| `userId` | string | valid ObjectId of an existing user |

```bash
curl -X POST http://localhost:5000/api/workspaces/WORKSPACE_ID/members \
  -H "Authorization: Bearer YOUR_JWT" -H "Content-Type: application/json" \
  -d '{"userId":"USER_ID"}'
```

**`200`** → `{ "success": true, "message": "Member added" }` · **Errors:** `403` not owner · `404` target user not found · `409` already a member.

### Remove member

```
DELETE /api/workspaces/WORKSPACE_ID/members/USER_ID
```

Owner only. **`200`** → `{ "success": true, "message": "Member removed" }` · **Errors:** `400` cannot remove the owner · `403` not owner · `404` member not found.

---

## Projects

Nested under a workspace. All routes require auth and workspace membership.

### List / create

```
GET  /api/workspaces/WORKSPACE_ID/projects
POST /api/workspaces/WORKSPACE_ID/projects
```

**Create body**

| Field | Type | Rules |
| --- | --- | --- |
| `name` | string | 1–100 characters |
| `description` | string | optional, ≤ 500 characters |
| `status` | enum | optional: `planned` · `active` · `completed` · `archived` |
| `deadline` | string | optional ISO-8601 datetime |

```bash
curl -X POST http://localhost:5000/api/workspaces/WORKSPACE_ID/projects \
  -H "Authorization: Bearer YOUR_JWT" -H "Content-Type: application/json" \
  -d '{"name":"Website revamp","status":"active","deadline":"2026-03-01T00:00:00.000Z"}'
```

**`201`**

```json
{ "project": { "id": "PROJECT_ID", "workspaceId": "WORKSPACE_ID", "ownerId": "USER_ID", "name": "Website revamp", "description": null, "status": "active", "deadline": "2026-03-01T00:00:00.000Z", "createdAt": "…", "updatedAt": "…" } }
```

### Get / update / delete

```
GET    /api/workspaces/WORKSPACE_ID/projects/PROJECT_ID
PATCH  /api/workspaces/WORKSPACE_ID/projects/PROJECT_ID
DELETE /api/workspaces/WORKSPACE_ID/projects/PROJECT_ID
```

`PATCH` accepts any subset of the create fields. `DELETE` returns `{ "success": true, "message": "…" }`. **Errors:** `403` not a member · `404` project not found in this workspace.

---

## Tasks

Nested under a project. All routes require auth and workspace membership.

### List tasks

```
GET /api/workspaces/WORKSPACE_ID/projects/PROJECT_ID/tasks
```

**Query params (all optional):** `status` (`todo`|`in_progress`|`completed`), `priority` (`low`|`medium`|`high`), `assignee` (user ObjectId).

```bash
curl "http://localhost:5000/api/workspaces/WORKSPACE_ID/projects/PROJECT_ID/tasks?status=todo&priority=high" \
  -H "Authorization: Bearer YOUR_JWT"
```

**`200`** → `{ "tasks": [ … ] }`

### Create task

```
POST /api/workspaces/WORKSPACE_ID/projects/PROJECT_ID/tasks
```

**Body**

| Field | Type | Rules |
| --- | --- | --- |
| `title` | string | 1–200 characters |
| `description` | string | optional, ≤ 2000 characters |
| `assignee` | string \| null | optional ObjectId; if set, **must be a workspace member** |
| `status` | enum | optional: `todo` · `in_progress` · `completed` |
| `priority` | enum | optional: `low` · `medium` · `high` |
| `dueDate` | string | optional ISO-8601 datetime |

**`201`**

```json
{ "task": { "id": "TASK_ID", "projectId": "PROJECT_ID", "title": "Design homepage", "description": null, "assignee": { "id": "USER_ID", "name": "Ada Lovelace", "email": "ada@example.com" }, "status": "todo", "priority": "high", "dueDate": null, "createdAt": "…", "updatedAt": "…" } }
```

**Errors:** `400` assignee is not a workspace member · `403` not a member · `404` project not found.

### Get / update / delete

```
GET    …/tasks/TASK_ID
PATCH  …/tasks/TASK_ID
DELETE …/tasks/TASK_ID
```

`PATCH` accepts any subset of the create fields (assignee may be set to `null` to unassign). `DELETE` returns `{ "success": true, "message": "Task deleted" }`.

---

## Discussions

Nested under a project. All routes require auth and workspace membership. The discussion author, the project owner, or the workspace owner may edit or delete a discussion.

```
GET    /api/workspaces/WORKSPACE_ID/projects/PROJECT_ID/discussions
POST   /api/workspaces/WORKSPACE_ID/projects/PROJECT_ID/discussions
GET    …/discussions/DISCUSSION_ID
PATCH  …/discussions/DISCUSSION_ID
DELETE …/discussions/DISCUSSION_ID
```

**Create body**

| Field | Type | Rules |
| --- | --- | --- |
| `title` | string | 1–200 characters |
| `content` | string | 1–5000 characters |

**`201`**

```json
{ "discussion": { "id": "DISCUSSION_ID", "workspaceId": "WORKSPACE_ID", "projectId": "PROJECT_ID", "author": { "id": "USER_ID", "name": "Ada Lovelace", "email": "ada@example.com" }, "title": "Kickoff", "content": "Let's align on scope.", "createdAt": "…", "updatedAt": "…" } }
```

---

## Comments

Nested under a discussion. All routes require auth and workspace membership. The comment author, the project owner, or the workspace owner may edit or delete a comment.

```
GET    /api/workspaces/WORKSPACE_ID/projects/PROJECT_ID/discussions/DISCUSSION_ID/comments
POST   …/discussions/DISCUSSION_ID/comments
PATCH  …/discussions/DISCUSSION_ID/comments/COMMENT_ID
DELETE …/discussions/DISCUSSION_ID/comments/COMMENT_ID
```

**Create/update body**

| Field | Type | Rules |
| --- | --- | --- |
| `content` | string | 1–5000 characters (optional on update) |

**`201`**

```json
{ "comment": { "id": "COMMENT_ID", "workspaceId": "WORKSPACE_ID", "projectId": "PROJECT_ID", "discussionId": "DISCUSSION_ID", "author": { "id": "USER_ID", "name": "Ada Lovelace", "email": "ada@example.com" }, "content": "Sounds good.", "createdAt": "…", "updatedAt": "…" } }
```

---

## Meetings

Nested under a workspace (a meeting may optionally reference a project). All routes require auth and workspace membership.

```
GET    /api/workspaces/WORKSPACE_ID/meetings
POST   /api/workspaces/WORKSPACE_ID/meetings
GET    …/meetings/MEETING_ID
PATCH  …/meetings/MEETING_ID
DELETE …/meetings/MEETING_ID
```

**Create body**

| Field | Type | Rules |
| --- | --- | --- |
| `title` | string | 1–200 characters |
| `description` | string | optional, ≤ 2000 characters |
| `projectId` | string | optional ObjectId |
| `startTime` | string | **required** ISO-8601 datetime |
| `endTime` | string | **required** ISO-8601 datetime |
| `attendees` | string[] | array of user ObjectIds |
| `meetingLink` | string | optional, valid URL, ≤ 500 characters |

On update you may also set `status` (`scheduled` · `completed` · `cancelled`); `startTime`, `endTime`, `projectId`, and `meetingLink` become optional.

**`201`**

```json
{ "meeting": { "id": "MEETING_ID", "workspaceId": "WORKSPACE_ID", "projectId": "PROJECT_ID", "organizer": { "id": "USER_ID", "name": "Ada Lovelace", "email": "ada@example.com" }, "title": "Sprint planning", "description": null, "startTime": "…", "endTime": "…", "status": "scheduled", "attendees": [ { "id": "USER_ID", "name": "…", "email": "…" } ], "meetingLink": null, "createdAt": "…", "updatedAt": "…" } }
```

---

## Activity

```
GET /api/workspaces/WORKSPACE_ID/activity
```

Requires auth and workspace membership. Returns the most recent activity entries (newest first), each recording an actor and the action they performed.

**`200`**

```json
{ "activities": [ { "id": "…", "workspaceId": "WORKSPACE_ID", "actor": { "id": "USER_ID", "name": "Ada Lovelace", "email": "ada@example.com" }, "action": "workspace_created", "entityType": "workspace", "entityId": "WORKSPACE_ID", "metadata": { "name": "Acme" }, "createdAt": "…" } ] }
```

---

## Notifications

All notification routes require auth and act only on the authenticated user's own notifications.

### List

```
GET /api/notifications
```

**Query params (optional):** `limit` (1–100), `unreadOnly` (`true`/`false`).

**`200`**

```json
{ "notifications": [ { "id": "NOTIFICATION_ID", "workspaceId": "WORKSPACE_ID", "type": "workspace_member_added", "title": "Added to workspace", "message": "You were added to workspace: Acme", "entityType": null, "entityId": null, "read": false, "createdAt": "…" } ] }
```

### Mark all as read

```
PATCH /api/notifications/read-all
```

**`200`** → `{ "success": true, "message": "…" }`

### Mark one as read

```
PATCH /api/notifications/NOTIFICATION_ID/read
```

**`200`** → the updated notification. **Errors:** `404` if it is not the caller's notification.

### Delete

```
DELETE /api/notifications/NOTIFICATION_ID
```

**`200`** → `{ "success": true, "message": "…" }`.
