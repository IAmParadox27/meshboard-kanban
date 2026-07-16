"use client";

import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";

import { ScrollArea } from "@/components/ui/scroll-area";import { Separator } from "@/components/ui/separator";

import { KanbanCard } from "./kanban-card";
import { KanbanCardModel, KanbanColumnModel } from "./kanban-types";

type KanbanColumnProps = {
    column: KanbanColumnModel;
    onCardClick: (card: KanbanCardModel) => void;
    curatedBoards: CuratedBoardActionModel[];
    isSavingBoardAssignment: boolean;
    onAddToBoard: (boardId: string, card: KanbanCardModel) => void;
};

type CuratedBoardActionModel = {
    id: string;
    name: string;
};

export function KanbanColumn(
    {
        column,
        onCardClick,
        curatedBoards,
        isSavingBoardAssignment,
        onAddToBoard,
    }: KanbanColumnProps,
) {
    const {setNodeRef} = useDroppable({
        id: column.id,
        data: {
            type: "column",
            columnId: column.id,
        },
    });

    return (
        <section className="flex h-full min-w-[320px] max-w-[320px] flex-col rounded-xl border bg-card">
            <div className="flex shrink-0 items-center justify-between px-4 py-4">
                <div>
                    <h2 className="text-sm font-semibold tracking-tight">
                        {column.title}
                    </h2>

                    <p className="text-xs text-muted-foreground">
                        {column.cards.length} card{column.cards.length == 1 ? "" : "s"}
                    </p>
                </div>
            </div>

            <Separator/>

            <div className="min-h-0 flex-1" ref={setNodeRef}>
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
                                    onAddToBoard={onAddToBoard}
                                />
                            ))}
                        </SortableContext>
                    </div>
                </ScrollArea>
            </div>
        </section>
    );
}