export type KanbanUserModel = {
    name: string;
    initials: string;
};

export type KanbanCommentModel = {
    id: string;
    author: KanbanUserModel;
    body: string;
    createdAt: string;
};

export type KanbanActivityModel = {
    id: string;
    description: string;
    createdAt: string;
};

export type KanbanCardModel = {
    id: string;
    title: string;
    description: string;
    source: "github" | "fider" | "internal";
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