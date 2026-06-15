// Mirrors the backend enums (src/database/enums.ts) and API shapes.

export type UserRole = 'USER' | 'ADMIN';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type InviteStatus =
    | 'PENDING'
    | 'ACCEPTED'
    | 'DECLINED'
    | 'EXPIRED'
    | 'REVOKED';
export type AttachmentType = 'FILE' | 'LINK';

export type Permission =
    | 'TASK_READ'
    | 'TASK_CREATE'
    | 'TASK_UPDATE'
    | 'TASK_DELETE'
    | 'TASK_UPDATE_STATUS'
    | 'TASK_UPDATE_PRIORITY'
    | 'TASK_ASSIGN'
    | 'MEMBER_INVITE'
    | 'MEMBER_REMOVE'
    | 'MEMBER_UPDATE_ROLE'
    | 'ROLE_CREATE'
    | 'ROLE_UPDATE'
    | 'ROLE_DELETE'
    | 'TEAM_UPDATE'
    | 'TEAM_DELETE';

export interface User {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    role: UserRole;
    isVerified: boolean;
    isOnline?: boolean;
    isDisabled?: boolean;
    avatarUrl?: string | null;
    createdAt?: string;
}

export interface Team {
    id: string;
    name: string;
    ownerId: string;
    isDefault: boolean;
    roleId?: string;
    isOwner?: boolean;
    memberCount?: number;
    createdAt?: string;
}

export interface TeamAccess {
    isOwner: boolean;
    hasAll: boolean;
    permissions: Permission[];
}

export interface TeamDetail extends Team {
    access: TeamAccess;
}

export interface Role {
    id: string;
    teamId: string | null;
    name: string;
    description?: string | null;
    isSystem: boolean;
    permissions: Permission[];
}

export interface TeamMember {
    userId: string;
    roleId: string;
    roleName: string;
    permissions: Permission[];
    email: string;
    firstName?: string;
    lastName?: string;
    avatarUrl?: string | null;
    isOnline?: boolean;
    isOwner: boolean;
    joinedAt: string;
}

export interface Task {
    id: string;
    teamId: string;
    createdById: string;
    assigneeId?: string | null;
    title: string;
    description?: string | null;
    status: TaskStatus;
    priority: TaskPriority;
    dueDate?: string | null;
    completedAt?: string | null;
    version: number;
    createdAt: string;
    updatedAt: string;
    // Lightweight attachment summary from the list endpoint (for card thumbnails).
    attachmentCount?: number;
    attachmentPreviews?: string[];
}

export interface TaskActivity {
    id: string;
    taskId: string;
    userId?: string | null;
    action: string;
    changes: Record<string, { from: unknown; to: unknown }>;
    actorFirstName?: string;
    actorLastName?: string;
    createdAt: string;
}

export interface TaskAttachment {
    id: string;
    taskId: string;
    type: AttachmentType;
    name: string;
    url: string;
    mimeType?: string | null;
    sizeBytes?: number | null;
    previewUrl?: string | null;
    metadata?: Record<string, unknown>;
    createdAt: string;
}

export interface Invite {
    id: string;
    email: string;
    roleId: string;
    roleName?: string;
    status: InviteStatus;
    expiresAt: string;
    createdAt: string;
    inviteUrl?: string;
}

export interface Paginated<T> {
    data: T[];
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}
