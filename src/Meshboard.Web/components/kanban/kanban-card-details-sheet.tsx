import Link from "next/link";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Markdown } from "@/components/ui/markdown";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { KanbanCardModel } from "./kanban-types";

type CuratedBoardActionModel = {
    id: string;
    name: string;
};

type KanbanCardDetailsSheetProps = {
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
    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-[1100px] max-w-[95vw] sm:!max-w-[1100px]">
                {card ? (
                    <div className="flex h-full flex-col">
                        <SheetHeader className="space-y-4 text-left">
                            <div className="flex flex-wrap gap-2">
                                <Badge className={sourceClassNames[card.source]}>
                                    {card.sourceLabel}
                                </Badge>

                                <Badge variant={statusVariantMap[card.status]}>
                                    {card.status}
                                </Badge><Badge variant="outline">
                                {card.proxyMode}
                            </Badge>

                                <Badge variant={priorityVariantMap[card.priority]}>
                                    {card.priority} priority
                                </Badge>
                            </div>

                            <div className="space-y-2">
                                <SheetTitle className="text-2xl leading-tight">
                                    {card.title}
                                </SheetTitle>

                                <SheetDescription className="text-sm">
                                    {card.id}
                                </SheetDescription>
                            </div>
                        </SheetHeader>

                        <div className="mt-6 grid min-h-0 flex-1 gap-8 overflow-y-auto pr-1 xl:grid-cols-[minmax(0,2fr)_320px]">
                            <div style={{ marginLeft: "20px", marginRight: "20px" }} className="space-y-8">
                                <section className="space-y-3">
                                    <h3 className="text-sm font-semibold">
                                        Description
                                    </h3>

                                    <Markdown content={card.description} />
                                </section>

                                <Separator />

                                <section className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-semibold">
                                            Comments
                                        </h3>

                                        <span className="text-xs text-muted-foreground">{card.comments.length} comment{card.comments.length == 1 ? "" : "s"}
                                        </span>
                                    </div>

                                    <div className="space-y-4">
                                        {card.comments.map((comment) => (
                                            <div
                                                key={comment.id}
                                                className="rounded-lg border bg-card p-4"
                                            >
                                                <div className="mb-3 flex items-center justify-between gap-3">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-8 w-8">
                                                            <AvatarFallback className="text-xs">
                                                                {comment.author.initials}
                                                            </AvatarFallback>
                                                        </Avatar>

                                                        <div>
                                                            <div className="text-sm font-medium">
                                                                {comment.author.name}
                                                            </div>

                                                            <div className="text-xs text-muted-foreground">
                                                                {comment.createdAt}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div><p className="text-sm leading-6 text-muted-foreground">
                                                {comment.body}
                                            </p>
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                <Separator />

                                <section className="space-y-4">
                                    <h3 className="text-sm font-semibold">
                                        Activity
                                    </h3>

                                    <div className="space-y-3">
                                        {card.activity.map((entry) => (
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

                            <aside style={{ marginLeft: "20px", marginRight: "20px", marginBottom: "20px" }} className="space-y-6"><section className="space-y-3 rounded-lg border bg-card p-4">
                                <h3 className="text-sm font-semibold">
                                    Details
                                </h3>

                                <dl className="grid grid-cols-[110px_1fr] gap-x-3 gap-y-3 text-sm">
                                    <dt className="text-muted-foreground">
                                        Source
                                    </dt>
                                    <dd>{card.sourceLabel}</dd>

                                    <dt className="text-muted-foreground">
                                        Status
                                    </dt>
                                    <dd className="capitalize">{card.status}</dd>

                                    <dt className="text-muted-foreground">
                                        Priority
                                    </dt>
                                    <dd className="capitalize">{card.priority}</dd>

                                    <dt className="text-muted-foreground">
                                        Proxy mode
                                    </dt>
                                    <dd>{card.proxyMode}</dd>

                                    <dt className="text-muted-foreground">
                                        Created
                                    </dt>
                                    <dd>{card.createdAt}</dd>

                                    <dt className="text-muted-foreground">
                                        Updated
                                    </dt>
                                    <dd>{card.updatedAt}</dd>

                                    <dt className="text-muted-foreground">
                                        Comments</dt>
                                    <dd>{card.commentsCount}</dd>
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

                                            {card.assignee ? (
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarFallback className="text-xs">
                                                            {card.assignee.initials}
                                                        </AvatarFallback>
                                                    </Avatar>

                                                    <span className="text-sm">
                                                        {card.assignee.name}
                                                    </span>
                                                </div>
                                            ) : (
                                                <p className="text-sm text-muted-foreground">
                                                    Unassigned
                                                </p>
                                            )}
                                        </div>

                                        <div><div className="mb-2 text-xs text-muted-foreground">
                                            Reporter
                                        </div>

                                            {card.reporter ? (
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarFallback className="text-xs">
                                                            {card.reporter.initials}
                                                        </AvatarFallback>
                                                    </Avatar>

                                                    <span className="text-sm">
                                                        {card.reporter.name}
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
                                        {canRemoveFromCurrentBoard && card ? (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                disabled={isSavingBoardAssignment}
                                                onClick={() => onRemoveFromCurrentBoard(card)}
                                            >
                                                Remove from this board
                                            </Button>
                                        ) : null}

                                        {card ? (
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
                                                            onClick={() => onAddToBoard(board.id, card)}
                                                        >
                                                            {board.name}
                                                        </DropdownMenuItem>
                                                    ))}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        ) : null}

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
                                        {card.tags.map((tag) => (
                                            <Badge key={tag} variant="secondary">
                                                {tag}</Badge>
                                        ))}
                                    </div>
                                </section>

                                {card.externalUrl ? (
                                    <section className="space-y-3 rounded-lg border bg-card p-4">
                                        <h3 className="text-sm font-semibold">
                                            External link
                                        </h3>

                                        <Link
                                            href={card.externalUrl}
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