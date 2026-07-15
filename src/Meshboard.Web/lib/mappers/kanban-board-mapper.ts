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

function SlugifyColumnId(value: string): string
{
    return value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

function ToFallbackColumnId(status: string): string
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

        default:return "todo";
    }
}

function ToColumnId(issue: ExternalIssueModel): string
{
    if (issue.boardColumnId && issue.boardColumnId.trim().length > 0)
    {
        return SlugifyColumnId(issue.boardColumnId);
    }

    if (issue.sourceColumn && issue.sourceColumn.trim().length > 0)
    {
        return SlugifyColumnId(issue.sourceColumn);
    }

    return ToFallbackColumnId(issue.status);
}

function ToColumnTitle(columnId: string): string
{
    return columnId
        .split("-")
        .filter((x) => x.length > 0)
        .map((x) => x[0]!.toUpperCase() + x.slice(1))
        .join(" ");
}

function ToCard(issue: ExternalIssueModel): KanbanCardModel
{
    const source = issue.sourceKey.toLowerCase().includes("github")
        ? "github"
        : issue.sourceKey.toLowerCase().includes("fider")
            ? "fider"
            : "internal";

    return {
        id: `${issue.sourceKey}:${issue.externalId}`,
        number: issue.issueNumber,
        title: issue.title,
        description: issue.description ?? "No description provided.",
        source,
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

export function MapIssuesToBoard(
    title: string,
    description: string,
    issues: ExternalIssueModel[],
): KanbanBoardModel
{
    const groupedCards = issues.reduce<Record<string, KanbanCardModel[]>>((accumulator, issue) => {
        const columnId = ToColumnId(issue);

        if (!accumulator[columnId])
        {
            accumulator[columnId] = [];
        }accumulator[columnId].push(ToCard(issue));
        return accumulator;
    }, {});

    const columnOrder = Object.keys(groupedCards).sort((a, b) => a.localeCompare(b));

    const columns: KanbanColumnModel[] = columnOrder.map((columnId) => ({
        id: columnId,
        title: ToColumnTitle(columnId),
        cards: groupedCards[columnId] ?? [],
    }));

    return {
        title,
        description,
        columns,
    };
}