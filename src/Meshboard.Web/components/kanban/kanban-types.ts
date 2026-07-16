export type KanbanUserModel = {
    name: string;
    initials: string;
    username?: string;
};

export type KanbanCommentModel = {
    id: string;
    kind: "comment" | "response";
    author: KanbanUserModel;
    body: string;
    createdAt: string;
    updatedAt?: string;
};

export type KanbanActivityModel = {
    id: string;
    type?: string;
    description: string;
    createdAt: string;
    actor?: KanbanUserModel;
};

export type KanbanCardModel = {
    id: string;
    sourceId: string;
    externalId: string;
    number: string;
    title: string;
    description: string;
    source: string;
    sourceLabel: string;
    status: "synced" | "pending" | "conflict" | "error";
    proxyMode: "import-only" | "export-only" | "two-way";
    assignee?: KanbanUserModel;
    tags: string[];
    externalUrl?: string;
    updatedAt: string;
    commentsCount: number;
    createdAt: string;
    priority: "low" | "medium" | "high";
    reporter?: KanbanUserModel;
    comments: KanbanCommentModel[];
    activity: KanbanActivityModel[];
};

export type KanbanColumnModel = {
    id: string;
    title: string;
    cards: KanbanCardModel[];
};

export type KanbanBoardModel = {
    title: string;
    description: string;
    columns: KanbanColumnModel[];
};