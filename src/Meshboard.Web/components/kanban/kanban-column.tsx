"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { PanelLeftCloseIcon, PanelLeftOpenIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

import { KanbanCard } from "./kanban-card";
import { KanbanCardModel, KanbanColumnModel } from "./kanban-types";
import {memo} from "react";

type KanbanColumnProps = {
    column: KanbanColumnModel;
    isCollapsed: boolean;
    onToggleCollapsed: (columnId: string) => void;
    onExpand: (columnId: string) => void;
    onCardClick: (card: KanbanCardModel) => void;
    curatedBoards: CuratedBoardActionModel[];
    isSavingBoardAssignment: boolean;
    canDragCards: boolean;
    onAddToBoard: (boardId: string, card: KanbanCardModel) => void;
};

type CuratedBoardActionModel = {
    id: string;
    name: string;
};

export const KanbanColumn = memo(function KanbanColumn(
    {
        column,
        isCollapsed,
        onToggleCollapsed,
        onExpand,
        onCardClick,
        curatedBoards,
        isSavingBoardAssignment,
        canDragCards,
        onAddToBoard,
    }: KanbanColumnProps,
)
{
    const { setNodeRef, isOver } = useDroppable({
        id: column.id,
        data: {
            type: "column",
            columnId: column.id,
        },
    });

    if (isCollapsed)
    {
        return (
            <section
                ref={setNodeRef}
                className={`flex h-full min-w-[64px] max-w-[64px] flex-col items-center rounded-xl border bg-card px-2 py-3 transition-colors ${isOver ? "border-primary bg-primary/10 shadow-sm" : ""}`}
            >
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="mb-3 h-8 w-8 shrink-0"
                    onClick={() => onExpand(column.id)}
                    aria-label={`Expand ${column.title}`}
                    title={`Expand ${column.title}`}
                >
                    <PanelLeftOpenIcon className="h-4 w-4" />
                </Button>

                <button
                    type="button"
                    className="flex min-h-0 flex-1 items-center justify-center rounded-md px-1 text-center text-sm font-semibold tracking-tight text-foreground/90 transition-colors hover:bg-accent/50"
                    onClick={() => onExpand(column.id)}
                    aria-label={`Expand ${column.title}`}
                    title={`Expand ${column.title}`}
                >
                    <span
                        style={{
                            writingMode: "vertical-rl",
                            transform: "rotate(180deg)",
                        }}
                    >
                        {column.title}
                    </span>
                </button>

                <div className="mt-3 rounded-full bg-muted px-2 py-1 text-[11px] font-medium text-muted-foreground">
                    {column.cards.length} card{column.cards.length === 1 ? "" : "s"}
                </div>
            </section>
        );
    }

    return (
        <section
            ref={setNodeRef}
            className={`flex h-full min-w-[320px] flex-1 basis-0 flex-col rounded-xl border bg-card transition-colors ${isOver ? "border-primary bg-primary/5" : ""}`}
        >
            <div className="flex shrink-0 items-center justify-between px-4 py-4">
                <div>
                    <h2 className="text-sm font-semibold tracking-tight">
                        {column.title}
                    </h2>

                    <p className="text-xs text-muted-foreground">
                        {column.cards.length} card{column.cards.length === 1 ? "" : "s"}
                    </p>
                </div>

                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() => onToggleCollapsed(column.id)}
                    aria-label={`Collapse ${column.title}`}
                    title={`Collapse ${column.title}`}
                >
                    <PanelLeftCloseIcon className="h-4 w-4" />
                </Button>
            </div>

            <Separator />

            <div className="min-h-0 flex-1">
                <ScrollArea className="h-full">
                    <div className="space-y-4 p-4">
                        <SortableContext
                            items={column.cards.map((x) => x.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            {column.cards.map((card) => (
                                <KanbanCard
                                    key={card.id}
                                    card={card}
                                    onClick={onCardClick}
                                    curatedBoards={curatedBoards}
                                    isSavingBoardAssignment={isSavingBoardAssignment}
                                    canDrag={canDragCards}
                                    onAddToBoard={onAddToBoard}
                                />
                            ))}
                        </SortableContext>
                    </div>
                </ScrollArea>
            </div>
        </section>
    );
});