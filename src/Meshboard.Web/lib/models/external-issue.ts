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
    createdAt?: string | null;
    updatedAt?: string | null;
    labels: string[];
};