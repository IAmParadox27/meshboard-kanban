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