"use client";
import { memo } from "react";
import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { KanbanCardModel } from "./kanban-types";
import { MoreVerticalIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type KanbanCardProps = {
    card: KanbanCardModel;
    onClick?: (card: KanbanCardModel) => void;
    dragOverlay?: boolean;
    curatedBoards?: CuratedBoardActionModel[];
    isSavingBoardAssignment?: boolean;
    canDrag?: boolean;
    onAddToBoard?: (boardId: string, card: KanbanCardModel) => void;
};

type CuratedBoardActionModel = {
    id: string;
    name: string;
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

const KanbanCardContent = memo(function KanbanCardContent(
    {
        card,
        curatedBoards = [],
        isSavingBoardAssignment = false,
        onAddToBoard,
    }: {
        card: KanbanCardModel;
        curatedBoards?: CuratedBoardActionModel[];
        isSavingBoardAssignment?: boolean;
        onAddToBoard?: (boardId: string, card: KanbanCardModel) => void;
    },
)
{
    return (
        <Card className="transition-colors hover:bg-accent/40">
            <CardHeader className="space-y-3 pb-3">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-wrap gap-2">
                        <Badge className={sourceClassNames[card.source]}>
                            {card.sourceLabel}
                        </Badge>

                        <Badge variant={statusVariantMap[card.status]}>
                            {card.status}
                        </Badge>
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 shrink-0"
                                disabled={isSavingBoardAssignment || curatedBoards.length === 0}
                                onClick={(event) => event.stopPropagation()}
                            >
                                <MoreVerticalIcon className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end" className="w-56">
                            {curatedBoards.length > 0 ? (
                                curatedBoards.map((board) => (
                                    <DropdownMenuItem
                                        key={board.id}
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            onAddToBoard?.(board.id, card);
                                        }}
                                    >
                                        Add to {board.name}
                                    </DropdownMenuItem>
                                ))
                            ) : (
                                <DropdownMenuItem disabled>
                                    No curated boards available
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <CardTitle className="text-base leading-snug">
                    {card.title}
                </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground sm:!max-w-[240px]">
                    {`${card.description.substring(0, 100)}${card.description.length > 100 ? "..." : ""}`}
                </p>

                <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">
                        {card.proxyMode}
                    </Badge>

                    {card.tags.map((tag) => (
                        <Badge
                            key={tag}
                            variant="secondary"
                        >
                            {tag}
                        </Badge>
                    ))}
                </div>

                <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                        {card.number}
                    </span>

                    {card.assignee ? (
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                                {card.assignee.name}
                            </span>

                            <Avatar className="h-7 w-7">
                                <AvatarFallback className="text-xs">
                                    {card.assignee.initials}
                                </AvatarFallback>
                            </Avatar>
                        </div>
                    ) : (
                        <span className="text-xs text-muted-foreground">
                            Unassigned
                        </span>
                    )}
                </div>
            </CardContent>
        </Card>
    );
});

export const KanbanCard = memo(function KanbanCard(
    {
        card,
        onClick,
        dragOverlay = false,
        curatedBoards = [],
        isSavingBoardAssignment = false,
        canDrag = true,
        onAddToBoard,
    }: KanbanCardProps,
) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: card.id,
        data: {
            type: "card",
            cardId: card.id,
        },
        disabled: dragOverlay || !canDrag,
    });

    const style = dragOverlay
        ? undefined
        : {
            transform: CSS.Transform.toString(transform),
            transition,
            zIndex: isDragging ? 10 : undefined,
        };

    if (dragOverlay) {
        return (
            <div className="w-[280px] rotate-10 shadow-xl">
                <KanbanCardContent
                    card={card}
                    curatedBoards={curatedBoards}
                    isSavingBoardAssignment={isSavingBoardAssignment}
                    onAddToBoard={onAddToBoard}
                />
            </div>
        );
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={isDragging ? "opacity-30" : ""}
        >
            <div
                onClick={() => onClick?.(card)}
                onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ")
                    {
                        event.preventDefault();
                        onClick?.(card);
                    }
                }}
                className="block w-full cursor-pointer text-left"
                {...attributes}
                {...listeners}
            >
                <div className={isDragging ? "scale-[1.01]" : ""}>
                    <KanbanCardContent
                        card={card}
                        curatedBoards={curatedBoards}
                        isSavingBoardAssignment={isSavingBoardAssignment}
                        onAddToBoard={onAddToBoard}
                    />
                </div>
            </div>
        </div>
    );
});