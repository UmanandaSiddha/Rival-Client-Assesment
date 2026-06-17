// Human labels and UI grouping for the backend Permission enum (src/database/enums.ts).
import type { Permission } from '@/lib/types';

export const PERMISSION_LABELS: Record<Permission, string> = {
    TASK_READ: 'View tasks',
    TASK_CREATE: 'Create tasks',
    TASK_UPDATE: 'Edit tasks',
    TASK_DELETE: 'Delete tasks',
    TASK_UPDATE_STATUS: 'Change status',
    TASK_UPDATE_PRIORITY: 'Change priority',
    TASK_ASSIGN: 'Assign tasks',
    MEMBER_INVITE: 'Invite members',
    MEMBER_REMOVE: 'Remove members',
    MEMBER_UPDATE_ROLE: 'Change member roles',
    ROLE_CREATE: 'Create roles',
    ROLE_UPDATE: 'Edit roles',
    ROLE_DELETE: 'Delete roles',
    TEAM_UPDATE: 'Edit team',
    TEAM_DELETE: 'Delete team',
};

export const PERMISSION_GROUPS: { label: string; permissions: Permission[] }[] = [
    {
        label: 'Tasks',
        permissions: [
            'TASK_READ',
            'TASK_CREATE',
            'TASK_UPDATE',
            'TASK_DELETE',
            'TASK_UPDATE_STATUS',
            'TASK_UPDATE_PRIORITY',
            'TASK_ASSIGN',
        ],
    },
    {
        label: 'Members',
        permissions: ['MEMBER_INVITE', 'MEMBER_REMOVE', 'MEMBER_UPDATE_ROLE'],
    },
    { label: 'Roles', permissions: ['ROLE_CREATE', 'ROLE_UPDATE', 'ROLE_DELETE'] },
    { label: 'Team', permissions: ['TEAM_UPDATE', 'TEAM_DELETE'] },
];
