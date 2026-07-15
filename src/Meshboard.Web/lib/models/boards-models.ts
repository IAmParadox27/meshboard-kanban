import { ExternalIssueModel } from "@/lib/models/external-issue";

export const BoardModes = {
    DirectFromSources: 0,
    Curated: 1,
    Unassigned: 2,
} as const;

export type BoardMode = (typeof BoardModes)[keyof typeof BoardModes];

export type BoardDefinitionModel = {
    id: string;
    name: string;
    mode: BoardMode;
    enabled: boolean;
    sourceIds: string[];
    createdAt: string;
    updatedAt: string;
};

export type UpsertBoardDefinitionRequest = {
    name: string;
    mode: BoardMode;
    enabled: boolean;
    sourceIds: string[];
};

export type BoardsPageModel = {
    boards: BoardDefinitionModel[];
};

export type BoardDetailsModel = {
    board: BoardDefinitionModel;
    issues: ExternalIssueModel[];
};

export type BoardIssueAssignmentRequest = {
    sourceId: string;
    externalId: string;
};