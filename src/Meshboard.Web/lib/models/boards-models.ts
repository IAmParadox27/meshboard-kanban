import { BoardIssueSummaryModel } from "@/lib/models/external-issue";

export const BoardModes = {
    DirectFromSources: 0,
    Curated: 1,
    Unassigned: 2,
} as const;

export type BoardMode = (typeof BoardModes)[keyof typeof BoardModes];

export type BoardColumnDefinitionModel = {
    columnId: string;
    title: string;
    sortOrder: number;
};

export type UpsertBoardColumnDefinitionRequest = {
    columnId: string;
    title: string;
    sortOrder: number;
};

export type BoardDefinitionModel = {
    id: string;
    name: string;
    mode: BoardMode;
    enabled: boolean;
    isPublic: boolean;
    sourceIds: string[];
    columns: BoardColumnDefinitionModel[];
    createdAt: string;
    updatedAt: string;
};

export type UpsertBoardDefinitionRequest = {
    name: string;
    mode: BoardMode;
    enabled: boolean;
    isPublic: boolean;
    sourceIds: string[];
    columns: UpsertBoardColumnDefinitionRequest[];
};

export type BoardsPageModel = {
    boards: BoardDefinitionModel[];
};

export type BoardDetailsModel = {
    board: BoardDefinitionModel;
    issues: BoardIssueSummaryModel[];
};

export type BoardIssueAssignmentRequest = {
    sourceId: string;
    externalId: string;
};

export type MoveBoardIssuesRequest = {
    targetBoardId: string;
};