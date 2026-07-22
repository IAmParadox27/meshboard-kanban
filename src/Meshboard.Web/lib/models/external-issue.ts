export type ExternalIssueActorModel = {
    name: string;
    username?: string | null;
    externalUserId?: string | null;
    externalUsername?: string | null;
    externalDisplayName?: string | null;
    meshboardUserId?: string | null;
    meshboardUsername?: string | null;
    meshboardDisplayName?: string | null;
};

export type BoardIssueSummaryModel = {
    externalId: string;
    detailsLookupKey: string;
    issueNumber: string;
    sourceKey: string;
    sourceName?: string | null;
    title: string;
    descriptionPreview?: string | null;
    status: string;
    url?: string | null;
    assignee?: ExternalIssueActorModel | null;
    sourceColumn?: string | null;
    boardColumnId?: string | null;
    createdAt?: string | null;
    updatedAt?: string | null;
    labels: string[];
};

export type ExternalIssueModel = {
    externalId: string;
    detailsLookupKey: string;
    issueNumber: string;
    sourceKey: string;
    sourceName?: string | null;
    title: string;
    description?: string | null;
    status: string;
    url?: string | null;
    assignee?: ExternalIssueActorModel | null;
    reporter?: ExternalIssueActorModel | null;
    sourceColumn?: string | null;
    boardColumnId?: string | null;
    createdAt?: string | null;
    updatedAt?: string | null;
    labels: string[];
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