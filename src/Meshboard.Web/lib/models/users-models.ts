export type UserSourceMappingModel = {
    sourceId: string;
    sourceName: string;
    providerKey: string;
    externalUserId: string;
    externalUsername?: string | null;
    externalDisplayName?: string | null;
};

export type CurrentUserModel = {
    id: string;
    username: string;
    displayName: string;
    email?: string | null;
    isAdmin: boolean;
    sourceMappings: UserSourceMappingModel[];
};

export type UpdateCurrentUserRequest = {
    displayName: string;
    email?: string | null;
};

export type UpsertUserSourceMappingRequest = {
    externalUserId: string;
    externalUsername?: string | null;
    externalDisplayName?: string | null;
};

export type UserListItemModel = {
    id: string;
    username: string;
    displayName: string;
    email?: string | null;
    isActive: boolean;
    isAdmin: boolean;
    createdAtUtc: string;
    lastLoginAtUtc?: string | null;
};

export type UsersPageModel = {
    users: UserListItemModel[];
};

export type UpdateUserRequest = {
    displayName: string;
    email?: string | null;
    isActive: boolean;
    isAdmin: boolean;
};