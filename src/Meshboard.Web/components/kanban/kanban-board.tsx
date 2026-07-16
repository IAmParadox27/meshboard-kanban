"use client";

import { useMemo, useState, useEffect } from "react";
import {
    DndContext,
    DragEndEvent,
    DragOverEvent,
    DragOverlay,
    DragStartEvent,
    PointerSensor,
    closestCorners,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";

import { Button } from "@/components/ui/button";

import { KanbanCard } from "./kanban-card";
import { KanbanCardDetailsSheet } from "./kanban-card-details-sheet";
import { KanbanColumn } from "./kanban-column";
import {KanbanBoardModel, KanbanCardModel, KanbanColumnModel} from "./kanban-types";
import {Spinner} from "@/components/ui/spinner";

type KanbanBoardProps = KanbanBoardModel & {
    curatedBoards: CuratedBoardActionModel[];
    canRemoveFromCurrentBoard: boolean;
    isSavingBoardAssignment: boolean;
    onAddToBoard: (boardId: string, card: KanbanCardModel) => void;
    onRemoveFromCurrentBoard: (card: KanbanCardModel) => void;
    isRefreshing: boolean;
    canClearCurrentBoard: boolean;
    onClearCurrentBoard: () => void;
    canMoveAllFromCurrentBoard: boolean;
    moveTargets: CuratedBoardActionModel[];
    moveTargetBoardId: string;
    onMoveTargetBoardIdChange: (boardId: string) => void;
    onMoveAllFromCurrentBoard: (targetBoardId: string) => void;
};

type CuratedBoardActionModel = {
    id: string;
    name: string;
};

export function KanbanBoard(
    {
        title,
        description,
        columns,
        curatedBoards,
        canRemoveFromCurrentBoard,
        isSavingBoardAssignment,
        onAddToBoard,
        onRemoveFromCurrentBoard,
        isRefreshing,
        canClearCurrentBoard,
        onClearCurrentBoard,
        canMoveAllFromCurrentBoard,
        moveTargets,
        moveTargetBoardId,
        onMoveTargetBoardIdChange,
        onMoveAllFromCurrentBoard,
    }: KanbanBoardProps,
) {
    const [m_columns, setColumns] = useState<KanbanColumnModel[]>(columns);
    const [m_selectedCardId, setSelectedCardId] = useState<string | null>(null);
    const [m_activeCardId, setActiveCardId] = useState<string | null>(null);

    const m_sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
    );

    const m_selectedCard = useMemo(() => {
        for (const column of m_columns) {
            const card = column.cards.find((x) => x.id == m_selectedCardId);

            if (card) {
                return card;
            }
        }

        return null;
    }, [m_columns, m_selectedCardId]);

    const m_activeCard = useMemo(() => {
        for (const column of m_columns) {
            const card = column.cards.find((x) => x.id == m_activeCardId);

            if (card) {
                return card;
            }
        }

        return null;
    }, [m_columns, m_activeCardId]);

    function FindCardLocation(cardId: string) {
        for (const column of m_columns) {
            const cardIndex = column.cards.findIndex((x) => x.id == cardId);

            if (cardIndex >= 0) {
                return {
                    columnId: column.id,
                    cardIndex,
                };
            }
        }

        return null;
    }

    function HandleDragStart(event: DragStartEvent) {
        setActiveCardId(String(event.active.id));
    }

    function HandleDragOver(event: DragOverEvent) {
        const activeId = String(event.active.id);
        const overId = event.over ? String(event.over.id) : null;

        if (!overId) {
            return;
        }

        const activeLocation = FindCardLocation(activeId);

        if (!activeLocation) {
            return;
        }

        const overColumn = m_columns.find((x) => x.id == overId);
        const overLocation = FindCardLocation(overId);

        const destinationColumnId = overLocation?.columnId ?? overColumn?.id;

        if (!destinationColumnId || destinationColumnId == activeLocation.columnId) {
            return;
        }

        setColumns((currentColumns) => {
            const sourceColumnIndex = currentColumns.findIndex((x) => x.id == activeLocation.columnId);
            const destinationColumnIndex = currentColumns.findIndex((x) => x.id == destinationColumnId);

            if (sourceColumnIndex < 0 || destinationColumnIndex < 0) {
                return currentColumns;
            }

            const sourceColumn = sourceColumnIndex >= 0 ? currentColumns[sourceColumnIndex] : null;
            const destinationColumn = destinationColumnIndex >= 0 ? currentColumns[destinationColumnIndex] : null;

            if (!sourceColumn || !destinationColumn) {
                return currentColumns;
            }

            const movingCard = sourceColumn.cards[activeLocation.cardIndex];

            if (!movingCard) {
                return currentColumns;
            }

            const updatedSourceCards = sourceColumn.cards.filter((x) => x.id != activeId);
            const updatedDestinationCards = [...destinationColumn.cards, movingCard];

            const nextColumns = [...currentColumns];
            nextColumns[sourceColumnIndex] = {
                ...sourceColumn,
                cards: updatedSourceCards,
            };
            nextColumns[destinationColumnIndex] = {
                ...destinationColumn,
                cards: updatedDestinationCards,
            };

            return nextColumns;
        });
    }

    function HandleDragEnd(event: DragEndEvent) {
        const activeId = String(event.active.id);
        const overId = event.over ? String(event.over.id) : null;

        setActiveCardId(null);

        if (!overId) {
            return;
        }

        const activeLocation = FindCardLocation(activeId);
        const overLocation = FindCardLocation(overId);

        if (!activeLocation || !overLocation) {
            return;
        }

        if (activeLocation.columnId != overLocation.columnId) {
            return;
        }

        if (activeLocation.cardIndex == overLocation.cardIndex) {
            return;
        }

        setColumns((currentColumns) => {
            return currentColumns.map((column) => {
                if (column.id != activeLocation.columnId) {
                    return column;
                }

                return {
                    ...column,
                    cards: arrayMove(column.cards, activeLocation.cardIndex, overLocation.cardIndex),
                };
            });
        });
    }

    return (
        <>
            <DndContext
                sensors={m_sensors}
                collisionDetection={closestCorners}
                onDragStart={HandleDragStart}
                onDragOver={HandleDragOver}
                onDragEnd={HandleDragEnd}
            >
                <main className="flex h-full min-h-0 flex-col overflow-y-auto">
                    <div className="mx-auto flex h-full min-h-0 w-full max-w-[1600px] flex-col px-6 py-6">
                        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-muted-foreground">
                                    Board
                                </p>

                                <h1 className="text-2xl font-semibold tracking-tight">
                                    {title}
                                </h1>

                                <p className="text-sm text-muted-foreground">
                                    {description}
                                </p>
                            </div>

                            <div className="flex items-center gap-2">
                                {isRefreshing ? (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Spinner className="size-4" />
                                        Refreshing…
                                    </div>
                                ) : null}

                                {canMoveAllFromCurrentBoard ? (
                                    <div className="flex flex-wrap items-center gap-2">
                                        <select
                                            className="h-8 min-w-56 rounded-md border bg-background px-3 text-sm"
                                            value={moveTargetBoardId}
                                            onChange={(event) => onMoveTargetBoardIdChange(event.target.value)}
                                            disabled={isSavingBoardAssignment || moveTargets.length === 0}
                                        >
                                            <option value="">
                                                Move all to board...
                                            </option>

                                            {moveTargets.map((board) => (
                                                <option key={board.id} value={board.id}>
                                                    {board.name}
                                                </option>
                                            ))}
                                        </select>

                                        <Button
                                            variant="outline"
                                            disabled={isSavingBoardAssignment || moveTargetBoardId.length === 0}
                                            onClick={() => onMoveAllFromCurrentBoard(moveTargetBoardId)}
                                        >
                                            Move all cards
                                        </Button>
                                    </div>
                                ) : null}

                                {canClearCurrentBoard ? (
                                    <Button
                                        variant="destructive"
                                        onClick={onClearCurrentBoard}
                                        disabled={isSavingBoardAssignment}
                                    >
                                        Remove all cards
                                    </Button>
                                ) : null}

                                <Button variant="outline">
                                    Filter
                                </Button>

                                <Button>New card
                                </Button>
                            </div>
                        </div>

                        <div className="flex min-h-0 flex-1 items-stretch gap-6 overflow-x-auto pb-4">
                            {m_columns.map((column) => (
                                <KanbanColumn
                                    key={column.id}
                                    column={column}
                                    onCardClick={(card) => setSelectedCardId(card.id)}
                                    curatedBoards={curatedBoards}
                                    isSavingBoardAssignment={isSavingBoardAssignment}
                                    onAddToBoard={onAddToBoard}
                                />
                            ))}
                        </div>
                    </div>
                </main>

                <DragOverlay>
                    {m_activeCard ? (
                        <KanbanCard
                            card={m_activeCard}
                            onClick={(selectedCard) => setSelectedCardId(selectedCard.id)}
                            curatedBoards={curatedBoards}
                            isSavingBoardAssignment={isSavingBoardAssignment}
                            onAddToBoard={onAddToBoard}
                        />
                    ) : null}
                </DragOverlay>
            </DndContext>

            <KanbanCardDetailsSheet
                card={m_selectedCard}
                open={m_selectedCard != null}
                onOpenChange={(open) => {
                    if (!open)
                    {
                        setSelectedCardId(null);
                    }
                }}
                curatedBoards={curatedBoards}
                canRemoveFromCurrentBoard={canRemoveFromCurrentBoard}
                isSavingBoardAssignment={isSavingBoardAssignment}
                onAddToBoard={onAddToBoard}
                onRemoveFromCurrentBoard={onRemoveFromCurrentBoard}
            />
        </>
    );
}