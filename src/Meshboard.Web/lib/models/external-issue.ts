export type ExternalIssueModel = {
    externalId: string;
    issueNumber: string;
    sourceKey: string;
    title: string;
    description?: string | null;
    status: string;
    url?: string | null;
    assignee?: string | null;
    reporter?: string | null;
    sourceColumn?: string | null;
    boardColumnId?: string | null;
    createdAt?: string | null;
    updatedAt?: string | null;
    labels: string[];
};

export type ExternalIssueActorModel = {
    name: string;
    username?: string | null;
};

export type ExternalIssueCommentModel = {
    id: string;
    kind: string;
    author?: ExternalIssueActorModel | null;
    body: string;
    createdAt?: string | null;
    updatedAt?: string | null;
};

export type ExternalIssueActivityEntryModel = {
    id: string;
    type: string;
    description: string;
    createdAt?: string | null;
    actor?: ExternalIssueActorModel | null;
};

export type ExternalIssueDetailsModel = {
    issue: ExternalIssueModel;
    comments: ExternalIssueCommentModel[];
    activity: ExternalIssueActivityEntryModel[];
};