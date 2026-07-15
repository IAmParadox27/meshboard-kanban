import {
    KanbanBoardModel,
    KanbanCardModel,
    KanbanColumnModel,
    KanbanUserModel,
} from "@/components/kanban/kanban-types";
import { ExternalIssueModel } from "@/lib/models/external-issue";

function ToUser(name?: string | null): KanbanUserModel | undefined
{
    if (!name)
    {
        return undefined;
    }

    const initials = name
        .split(/[\s_-]+/)
        .filter((x) => x.length > 0)
        .slice(0, 2)
        .map((x) => x[0]?.toUpperCase() ?? "")
        .join("");

    return {
        name,
        initials: initials || "?",
    };
}

function ToColumnId(status: string): string
{
    switch (status.toLowerCase())
    {
        case "open":
        case "todo":
        case "backlog":
            return "todo";

        case "in_progress":
        case "in-progress":
        case "doing":
            return "in-progress";

        case "closed":
        case "done":
        case "resolved":
            return "done";

        default:
            return "todo";
    }
}

function ToColumnTitle(columnId: string): string
{
    switch (columnId)
    {
        case "todo":
            return "To do";

        case "in-progress":
            return "In progress";

        case "done":
            return "Done";

        default:
            return columnId;
    }
}

function ToCard(issue: ExternalIssueModel): KanbanCardModel
{
    return {
        id: issue.externalId,
        number: issue.issueNumber,
        title: issue.title,
        description: issue.description ?? "No description provided.",
        source: issue.sourceKey == "github"
            ? "github"
            : issue.sourceKey == "fider"
                ? "fider"
                : "internal",
        sourceLabel: issue.sourceKey,
        status: "synced",
        proxyMode: "import-only",
        assignee: ToUser(issue.assignee),
        tags: issue.labels ?? [],
        externalUrl: issue.url ?? undefined,
        updatedAt: issue.updatedAt ?? issue.createdAt ?? new Date().toISOString(),
        commentsCount: 0,
        createdAt: issue.createdAt ?? new Date().toISOString(),
        priority: "medium",
        reporter: ToUser(issue.reporter),
        comments: [],
        activity: [],
    };
}

export function MapIssuesToBoard(issues: ExternalIssueModel[]): KanbanBoardModel {
    const columnOrder = ["todo", "in-progress", "done"];

    const groupedCards = issues.reduce<Record<string, KanbanCardModel[]>>((accumulator, issue) => {
        const columnId = ToColumnId(issue.status);

        if (!accumulator[columnId]) {
            accumulator[columnId] = [];
        }

        accumulator[columnId].push(ToCard(issue));
        return accumulator;
    }, {});

    const columns: KanbanColumnModel[] = columnOrder.map((columnId) => ({
        id: columnId,
        title: ToColumnTitle(columnId),
        cards: groupedCards[columnId] ?? [],
    }));

    return {
        title: "Board",
        description: "Live issues pulled from configured sources.",
        columns,
    };
}