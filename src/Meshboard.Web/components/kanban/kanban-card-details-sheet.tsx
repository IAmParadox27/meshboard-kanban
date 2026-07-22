"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { apiClient } from "@/lib/api/api-client";
import {
    ExternalIssueActorModel,
    ExternalIssueDetailsModel,
} from "@/lib/models/external-issue";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Markdown } from "@/components/ui/markdown";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";

import { KanbanCardModel, KanbanUserModel } from "./kanban-types";

type CuratedBoardActionModel = {
    id: string;
    name: string;
};

type KanbanCardDetailsSheetProps = {
    boardId: string;
    card: KanbanCardModel | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    canRemoveFromCurrentBoard: boolean;
    curatedBoards: CuratedBoardActionModel[];
    isSavingBoardAssignment: boolean;
    onAddToBoard: (boardId: string, card: KanbanCardModel) => void;
    onRemoveFromCurrentBoard: (card: KanbanCardModel) => void;
};

const sourceClassNames: Record<KanbanCardModel["source"], string> = {
    github: "bg-slate-900 text-white",
    fider: "bg-blue-600 text-white",
    internal: "bg-zinc-200 text-zinc-900",
};

const statusVariantMap: Record<KanbanCardModel["status"], "default" | "secondary" | "destructive" | "outline"> = {
    synced: "secondary",
    pending: "outline",
    conflict: "destructive",
    error: "destructive",
};

const priorityVariantMap: Record<KanbanCardModel["priority"], "default" | "secondary" | "destructive" | "outline"> = {
    low: "secondary",
    medium: "outline",
    high: "destructive",
};

export function KanbanCardDetailsSheet(
    {
        boardId,
        card,
        open,
        onOpenChange,
        canRemoveFromCurrentBoard,
        curatedBoards,
        isSavingBoardAssignment,
        onAddToBoard,
        onRemoveFromCurrentBoard,
    }: KanbanCardDetailsSheetProps,
)
{
    const [m_detailsByCardId, setDetailsByCardId] = useState<Record<string, ExternalIssueDetailsModel>>({});
    const [m_loadingCardId, setLoadingCardId] = useState<string | null>(null);
    const [m_errorByCardId, setErrorByCardId] = useState<Record<string, string>>({});

    useEffect(() => {
        if (!open || !card)
        {
            return;
        }

        if (m_detailsByCardId[card.id])
        {
            return;
        }

        let isCancelled = false;

        async function LoadDetails()
        {
            setLoadingCardId(card!.id);
            setErrorByCardId((current) => ({
                ...current,
                [card!.id]: "",
            }));

            try
            {
                const details = await apiClient.GetBoardIssueDetails(boardId, card!.sourceId, card!.detailsLookupKey);

                if (isCancelled)
                {
                    return;
                }

                setDetailsByCardId((current) => ({
                    ...current,
                    [card!.id]: details,
                }));
            }
            catch (error)
            {
                if (isCancelled)
                {
                    return;
                }

                setErrorByCardId((current) => ({
                    ...current,
                    [card!.id]: error instanceof Error
                        ? error.message
                        : "Failed to load issue details.",
                }));
            }
            finally
            {
                if (!isCancelled)
                {
                    setLoadingCardId((current) => current === card!.id ? null : current);
                }
            }
        }

        void LoadDetails();

        return () => {
            isCancelled = true;
        };
    }, [boardId, card, open, m_detailsByCardId]);

    async function RetryLoadDetails()
    {
        if (!card)
        {
            return;
        }

        setLoadingCardId(card.id);
        setErrorByCardId((current) => ({
            ...current,
            [card.id]: "",
        }));

        try
        {
            const details = await apiClient.GetBoardIssueDetails(boardId, card.sourceId, card.detailsLookupKey);

            setDetailsByCardId((current) => ({
                ...current,
                [card.id]: details,
            }));
        }
        catch (error)
        {
            setErrorByCardId((current) => ({
                ...current,
                [card.id]: error instanceof Error
                    ? error.message
                    : "Failed to load issue details.",
            }));
        }
        finally
        {
            setLoadingCardId((current) => current === card.id ? null : current);
        }
    }

    const m_details = card ? m_detailsByCardId[card.id] ?? null : null;
    const m_detailsError = card ? m_errorByCardId[card.id] : null;
    const m_isLoadingDetails = card != null && m_loadingCardId === card.id;

    const m_displayCard = useMemo(() => {
        if (!card)
        {
            return null;
        }

        if (!m_details)
        {
            return card;
        }

        return {
            ...card,
            title: m_details.issue.title || card.title,
            description: m_details.issue.description?.trim() || card.description,
            assignee: ToUser(m_details.issue.assignee) ?? card.assignee,
            reporter: ToUser(m_details.issue.reporter) ?? card.reporter,
            tags: m_details.issue.labels?.length > 0 ? m_details.issue.labels : card.tags,
            externalUrl: m_details.issue.url ?? card.externalUrl,
            createdAt: m_details.issue.createdAt ?? card.createdAt,
            updatedAt: m_details.issue.updatedAt ?? card.updatedAt,
            commentsCount: m_details.comments.length,
            comments: m_details.comments.map((comment) => ({
                id: comment.id,
                kind: comment.kind === "response" ? "response" : "comment",
                author: ToActorUser(comment.author),
                body: comment.body,
                createdAt: FormatDateTime(comment.createdAt),
                updatedAt: comment.updatedAt && comment.updatedAt !== comment.createdAt
                    ? FormatDateTime(comment.updatedAt)
                    : undefined,
            })),
            activity: m_details.activity.map((entry) => ({
                id: entry.id,
                type: entry.type,
                description: entry.description,
                createdAt: FormatDateTime(entry.createdAt),
                actor: entry.actor ? ToActorUser(entry.actor) : undefined,
            })),
        } satisfies KanbanCardModel;
    }, [card, m_details]);

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-[1100px] max-w-[95vw] sm:!max-w-[1100px]">
                {m_displayCard ? (
                    <div className="flex h-full flex-col">
                        <SheetHeader className="space-y-4 text-left">
                            <div className="flex flex-wrap items-center gap-2">
                                <Badge className={sourceClassNames[m_displayCard.source]}>
                                    {m_displayCard.sourceLabel}
                                </Badge>

                                <Badge variant={statusVariantMap[m_displayCard.status]}>
                                    {m_displayCard.status}
                                </Badge>

                                <Badge variant="outline">
                                    {m_displayCard.proxyMode}
                                </Badge>

                                <Badge variant={priorityVariantMap[m_displayCard.priority]}>
                                    {m_displayCard.priority} priority
                                </Badge>

                                {m_isLoadingDetails ? (
                                    <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
                                        <Spinner className="size-3.5" />
                                        Loading issue details…
                                    </div>
                                ) : null}
                            </div>

                            <div className="space-y-2">
                                <SheetTitle className="text-2xl leading-tight">
                                    {m_displayCard.title}
                                </SheetTitle>

                                <SheetDescription className="text-sm">
                                    {m_displayCard.id}
                                </SheetDescription>
                            </div>
                        </SheetHeader>

                        <div className="mt-6 grid min-h-0 flex-1 gap-8 overflow-y-auto pr-1 xl:grid-cols-[minmax(0,2fr)_320px]">
                            <div className="space-y-8 px-5" style={{ marginBottom: "1rem" }}>
                                <section className="space-y-3">
                                    <h3 className="text-sm font-semibold">
                                        Description
                                    </h3>

                                    <Markdown content={m_displayCard.description || "No description provided."} />
                                </section>

                                <Separator />

                                <section className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-semibold">
                                            Comments
                                        </h3>

                                        <span className="text-xs text-muted-foreground">
                                            {m_displayCard.commentsCount} comment{m_displayCard.commentsCount === 1 ? "" : "s"}
                                        </span>
                                    </div>

                                    {m_isLoadingDetails && !m_details ? (
                                        <div className="space-y-4">
                                            <Skeleton className="h-24 w-full rounded-lg" />
                                            <Skeleton className="h-24 w-full rounded-lg" />
                                        </div>
                                    ) : null}

                                    {m_detailsError ? (
                                        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
                                            <p className="text-sm text-destructive">
                                                {m_detailsError}
                                            </p>

                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="mt-3"
                                                onClick={() => void RetryLoadDetails()}
                                                disabled={m_isLoadingDetails}
                                            >
                                                Retry loading details
                                            </Button>
                                        </div>
                                    ) : null}

                                    {!m_isLoadingDetails && m_displayCard.comments.length === 0 ? (
                                        <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                                            No comments yet.
                                        </div>
                                    ) : null}

                                    <div className="space-y-4">
                                        {m_displayCard.comments.map((comment) => (
                                            <div
                                                key={comment.id}
                                                className="rounded-lg border bg-card p-4"
                                            >
                                                <div className="mb-3 flex items-start justify-between gap-3">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-8 w-8">
                                                            <AvatarFallback className="text-xs">
                                                                {comment.author.initials}
                                                            </AvatarFallback>
                                                        </Avatar>

                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <div className="text-sm font-medium">
                                                                    {comment.author.name}
                                                                </div>

                                                                {comment.kind === "response" ? (
                                                                    <Badge variant="secondary">
                                                                        Official response
                                                                    </Badge>
                                                                ) : null}
                                                            </div>

                                                            <div className="text-xs text-muted-foreground">
                                                                {comment.createdAt}
                                                                {comment.updatedAt ? ` • Edited ${comment.updatedAt}` : ""}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <Markdown content={comment.body || "_No comment body provided._"} />
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                <Separator />

                                <section className="space-y-4">
                                    <h3 className="text-sm font-semibold">
                                        Activity
                                    </h3>

                                    {m_isLoadingDetails && !m_details ? (
                                        <div className="space-y-3">
                                            <Skeleton className="h-10 w-full" />
                                            <Skeleton className="h-10 w-full" />
                                        </div>
                                    ) : null}

                                    {!m_isLoadingDetails && m_displayCard.activity.length === 0 ? (
                                        <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                                            No activity available.
                                        </div>
                                    ) : null}

                                    <div className="space-y-3">
                                        {m_displayCard.activity.map((entry) => (
                                            <div
                                                key={entry.id}
                                                className="flex items-start gap-3"
                                            >
                                                <div className="mt-2 h-2 w-2 rounded-full bg-primary" />

                                                <div className="min-w-0">
                                                    <p className="text-sm">
                                                        {entry.description}
                                                    </p>

                                                    <p className="text-xs text-muted-foreground">
                                                        {entry.createdAt}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            </div>

                            <aside className="space-y-6 px-5 pb-5">
                                <section className="space-y-3 rounded-lg border bg-card p-4">
                                    <h3 className="text-sm font-semibold">
                                        Details
                                    </h3>

                                    <dl className="grid grid-cols-[110px_1fr] gap-x-3 gap-y-3 text-sm">
                                        <dt className="text-muted-foreground">
                                            Source
                                        </dt>
                                        <dd>{m_displayCard.sourceLabel}</dd>

                                        <dt className="text-muted-foreground">
                                            Status
                                        </dt>
                                        <dd className="capitalize">{m_displayCard.status}</dd>

                                        <dt className="text-muted-foreground">
                                            Priority
                                        </dt>
                                        <dd className="capitalize">{m_displayCard.priority}</dd>

                                        <dt className="text-muted-foreground">
                                            Proxy mode
                                        </dt>
                                        <dd>{m_displayCard.proxyMode}</dd>

                                        <dt className="text-muted-foreground">
                                            Created
                                        </dt>
                                        <dd>{FormatDateTime(m_displayCard.createdAt)}</dd>

                                        <dt className="text-muted-foreground">
                                            Updated
                                        </dt>
                                        <dd>{FormatDateTime(m_displayCard.updatedAt)}</dd>

                                        <dt className="text-muted-foreground">
                                            Comments
                                        </dt>
                                        <dd>{m_displayCard.commentsCount}</dd>
                                    </dl>
                                </section>

                                <section className="space-y-3 rounded-lg border bg-card p-4">
                                    <h3 className="text-sm font-semibold">
                                        People
                                    </h3>

                                    <div className="space-y-4">
                                        <div>
                                            <div className="mb-2 text-xs text-muted-foreground">
                                                Assignee
                                            </div>

                                            {m_displayCard.assignee ? (
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarFallback className="text-xs">
                                                            {m_displayCard.assignee.initials}
                                                        </AvatarFallback>
                                                    </Avatar>

                                                    <span className="text-sm">
                                                        {m_displayCard.assignee.name}
                                                    </span>
                                                </div>
                                            ) : (
                                                <p className="text-sm text-muted-foreground">
                                                    Unassigned
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <div className="mb-2 text-xs text-muted-foreground">
                                                Reporter
                                            </div>

                                            {m_displayCard.reporter ? (
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarFallback className="text-xs">
                                                            {m_displayCard.reporter.initials}
                                                        </AvatarFallback>
                                                    </Avatar>

                                                    <span className="text-sm">
                                                        {m_displayCard.reporter.name}
                                                    </span>
                                                </div>
                                            ) : (
                                                <p className="text-sm text-muted-foreground">
                                                    Unknown
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </section>

                                <section className="space-y-3 rounded-lg border bg-card p-4">
                                    <h3 className="text-sm font-semibold">
                                        Board actions
                                    </h3>

                                    <div className="flex flex-col gap-2">
                                        {canRemoveFromCurrentBoard ? (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                disabled={isSavingBoardAssignment}
                                                onClick={() => onRemoveFromCurrentBoard(m_displayCard)}
                                            >
                                                Remove from this board
                                            </Button>
                                        ) : null}

                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    type="button"
                                                    disabled={isSavingBoardAssignment || curatedBoards.length === 0}
                                                >
                                                    Add to board
                                                </Button>
                                            </DropdownMenuTrigger>

                                            <DropdownMenuContent align="start" className="w-64">
                                                {curatedBoards.map((board) => (
                                                    <DropdownMenuItem
                                                        key={board.id}
                                                        onClick={() => onAddToBoard(board.id, m_displayCard)}
                                                    >
                                                        {board.name}
                                                    </DropdownMenuItem>
                                                ))}
                                            </DropdownMenuContent>
                                        </DropdownMenu>

                                        {curatedBoards.length === 0 ? (
                                            <p className="text-xs text-muted-foreground">
                                                No curated boards available yet.
                                            </p>
                                        ) : null}
                                    </div>
                                </section>

                                <section className="space-y-3 rounded-lg border bg-card p-4">
                                    <h3 className="text-sm font-semibold">
                                        Tags
                                    </h3>

                                    <div className="flex flex-wrap gap-2">
                                        {m_displayCard.tags.length > 0 ? m_displayCard.tags.map((tag) => (
                                            <Badge key={tag} variant="secondary">
                                                {tag}
                                            </Badge>
                                        )) : (
                                            <p className="text-sm text-muted-foreground">
                                                No tags.
                                            </p>
                                        )}
                                    </div>
                                </section>

                                {m_displayCard.externalUrl ? (
                                    <section className="space-y-3 rounded-lg border bg-card p-4">
                                        <h3 className="text-sm font-semibold">
                                            External link
                                        </h3>

                                        <Link
                                            href={m_displayCard.externalUrl}
                                            target="_blank"
                                            className="text-sm text-primary underline-offset-4 hover:underline"
                                        >
                                            Open source item
                                        </Link>
                                    </section>
                                ) : null}
                            </aside>
                        </div>
                    </div>
                ) : null}
            </SheetContent>
        </Sheet>
    );
}

function ToUser(actor?: ExternalIssueActorModel | null): KanbanUserModel | undefined
{
    const preferredName = actor?.meshboardDisplayName
        || actor?.meshboardUsername
        || actor?.username
        || actor?.externalDisplayName
        || actor?.externalUsername
        || actor?.name;

    if (!preferredName)
    {
        return undefined;
    }

    return {
        name: preferredName,
        initials: ToInitials(preferredName),
        username: actor?.meshboardUsername
            || actor?.username
            || actor?.externalUsername
            || undefined,
    };
}

function ToActorUser(actor?: ExternalIssueActorModel | null): KanbanUserModel
{
    return ToUser(actor) ?? {
        name: "Unknown",
        initials: "?",
    };
}

function ToInitials(name: string): string
{
    console.log("ToInitials arg", name, typeof name, JSON.stringify(name));
    const initials = name
        .split(/[\s_-]+/)
        .filter((x) => x.length > 0)
        .slice(0, 2)
        .map((x) => x[0]?.toUpperCase() ?? "")
        .join("");

    return initials || "?";
}

function FormatDateTime(value?: string | null): string
{
    if (!value)
    {
        return "Unknown";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime()))
    {
        return value;
    }

    return new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(date);
}