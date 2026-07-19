"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    DndContext,
    DragEndEvent,
    DragOverEvent,
    DragOverlay,
    DragStartEvent,
    PointerSensor,
    pointerWithin,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

import { KanbanCard } from "./kanban-card";
import { KanbanCardDetailsSheet } from "./kanban-card-details-sheet";
import { KanbanColumn } from "./kanban-column";
import { KanbanBoardModel, KanbanCardModel, KanbanColumnModel } from "./kanban-types";

type KanbanBoardProps = KanbanBoardModel & {
    boardId: string;
    curatedBoards: CuratedBoardActionModel[];
    canEditBoard: boolean;
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
        boardId,
        title,
        description,
        columns,
        curatedBoards,
        canEditBoard,
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
    const [m_isClearDialogOpen, setIsClearDialogOpen] = useState(false);
    const [m_isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);
    const [m_collapsedColumnIds, setCollapsedColumnIds] = useState<Record<string, boolean>>(() => {
        return ReadCollapsedColumnIds(boardId, columns);
    });
    const [m_hoverExpandColumnId, setHoverExpandColumnId] = useState<string | null>(null);
    const m_hoverExpandTimerRef = useRef<number | null>(null);

    const m_sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 3,
            },
        }),
    );

    const m_canDragCards = canEditBoard && !isSavingBoardAssignment;

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

    const m_moveTargetBoard = useMemo(() => {
        return moveTargets.find((x) => x.id === moveTargetBoardId) ?? null;
    }, [moveTargetBoardId, moveTargets]);

    const m_visibleCollapsedColumnIds = useMemo(() => {
        const validColumnIds = new Set(m_columns.map((column) => column.id));

        return Object.fromEntries(
            Object.entries(m_collapsedColumnIds)
                .filter(([columnId, isCollapsed]) => validColumnIds.has(columnId) && isCollapsed === true),
        );
    }, [m_columns, m_collapsedColumnIds]);

    const m_allColumnsCollapsed = useMemo(() => {
        return m_columns.length > 0
            && m_columns.every((column) => m_visibleCollapsedColumnIds[column.id] === true);
    }, [m_columns, m_visibleCollapsedColumnIds]);

    const m_hasCollapsedColumns = useMemo(() => {
        return m_columns.some((column) => m_visibleCollapsedColumnIds[column.id] === true);
    }, [m_columns, m_visibleCollapsedColumnIds]);

    useEffect(() => {
        return () => {
            if (m_hoverExpandTimerRef.current != null)
            {
                window.clearTimeout(m_hoverExpandTimerRef.current);
            }
        };
    }, []);

    useEffect(() => {
        window.localStorage.setItem(
            GetCollapsedColumnsStorageKey(boardId),
            JSON.stringify(m_visibleCollapsedColumnIds),
        );
    }, [boardId, m_visibleCollapsedColumnIds]);

    const CancelHoverExpand = useCallback(() => {
        if (m_hoverExpandTimerRef.current != null)
        {
            window.clearTimeout(m_hoverExpandTimerRef.current);
            m_hoverExpandTimerRef.current = null;
        }

        setHoverExpandColumnId(null);
    }, []);

    const ToggleColumnCollapsed = useCallback((columnId: string) => {
        CancelHoverExpand();

        setCollapsedColumnIds((current) => ({
            ...current,
            [columnId]: !current[columnId],
        }));
    }, [CancelHoverExpand]);

    const ExpandColumn = useCallback((columnId: string) => {
        CancelHoverExpand();

        setCollapsedColumnIds((current) => ({
            ...current,
            [columnId]: false,
        }));
    }, [CancelHoverExpand]);

    function CollapseAllColumns()
    {
        CancelHoverExpand();

        setCollapsedColumnIds(
            Object.fromEntries(m_columns.map((column) => [column.id, true])),
        );
    }

    function ExpandAllColumns()
    {
        CancelHoverExpand();

        setCollapsedColumnIds(
            Object.fromEntries(m_columns.map((column) => [column.id, false])),
        );
    }

    const ScheduleHoverExpand = useCallback((columnId: string) => {
        if (m_hoverExpandColumnId === columnId)
        {
            return;
        }

        CancelHoverExpand();
        setHoverExpandColumnId(columnId);

        m_hoverExpandTimerRef.current = window.setTimeout(() => {
            setCollapsedColumnIds((current) => ({
                ...current,
                [columnId]: false,
            }));
            setHoverExpandColumnId(null);
            m_hoverExpandTimerRef.current = null;
        }, 350);
    }, [CancelHoverExpand, m_hoverExpandColumnId]);

    const HandleCardClick = useCallback((card: KanbanCardModel) => {
        setSelectedCardId(card.id);
    }, []);

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
            CancelHoverExpand();
            return;
        }

        const overColumn = m_columns.find((x) => x.id == overId);

        if (overColumn && m_visibleCollapsedColumnIds[overColumn.id] === true) {
            ScheduleHoverExpand(overColumn.id);
        }
        else {
            CancelHoverExpand();
        }

        const activeLocation = FindCardLocation(activeId);

        if (!activeLocation) {
            return;
        }

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

        CancelHoverExpand();
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
                sensors={m_canDragCards ? m_sensors : undefined}
                collisionDetection={pointerWithin}
                onDragStart={m_canDragCards ? HandleDragStart : undefined}
                onDragOver={m_canDragCards ? HandleDragOver : undefined}
                onDragEnd={m_canDragCards ? HandleDragEnd : undefined}
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

                                {!canEditBoard ? (
                                    <div className="text-sm text-muted-foreground">
                                        Read-only public view
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

                                        <AlertDialog open={m_isMoveDialogOpen} onOpenChange={setIsMoveDialogOpen}>
                                            <Button
                                                variant="outline"
                                                disabled={isSavingBoardAssignment || moveTargetBoardId.length === 0}
                                                onClick={() => setIsMoveDialogOpen(true)}
                                            >
                                                Move all cards
                                            </Button>

                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>
                                                        Move all cards?
                                                    </AlertDialogTitle>

                                                    <AlertDialogDescription>
                                                        {m_moveTargetBoard
                                                            ? `This will move every card from ${title} to ${m_moveTargetBoard.name}. Cards already on the target board will be left alone.`
                                                            : "Choose a target board to move all cards to."}
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>

                                                <AlertDialogFooter>
                                                    <AlertDialogCancel disabled={isSavingBoardAssignment}>
                                                        Cancel
                                                    </AlertDialogCancel>

                                                    <AlertDialogAction
                                                        disabled={isSavingBoardAssignment || moveTargetBoardId.length === 0}
                                                        onClick={(event) => {
                                                            event.preventDefault();
                                                            setIsMoveDialogOpen(false);
                                                            onMoveAllFromCurrentBoard(moveTargetBoardId);
                                                        }}
                                                    >
                                                        Move all cards
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                ) : null}

                                {canClearCurrentBoard ? (
                                    <AlertDialog open={m_isClearDialogOpen} onOpenChange={setIsClearDialogOpen}>
                                        <Button
                                            variant="destructive"
                                            onClick={() => setIsClearDialogOpen(true)}
                                            disabled={isSavingBoardAssignment}
                                        >
                                            Remove all cards
                                        </Button>

                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>
                                                    Remove all cards?
                                                </AlertDialogTitle>

                                                <AlertDialogDescription>
                                                    This will remove every card from {title}. This only clears this curated board assignment.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>

                                            <AlertDialogFooter>
                                                <AlertDialogCancel disabled={isSavingBoardAssignment}>
                                                    Cancel
                                                </AlertDialogCancel>

                                                <AlertDialogAction
                                                    variant="destructive"
                                                    disabled={isSavingBoardAssignment}
                                                    onClick={(event) => {
                                                        event.preventDefault();
                                                        setIsClearDialogOpen(false);
                                                        onClearCurrentBoard();
                                                    }}
                                                >
                                                    Remove all cards
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                ) : null}

                                <Button
                                    variant="outline"
                                    onClick={CollapseAllColumns}
                                    disabled={m_allColumnsCollapsed}
                                >
                                    Collapse all
                                </Button>

                                <Button
                                    variant="outline"
                                    onClick={ExpandAllColumns}
                                    disabled={!m_hasCollapsedColumns}
                                >
                                    Expand all
                                </Button>

                                <Button variant="outline">
                                    Filter
                                </Button>

                                {canEditBoard ? (
                                    <Button>
                                        New card
                                    </Button>
                                ) : null}
                            </div>
                        </div>

                        <div className="min-h-0 flex-1 overflow-x-auto pb-4">
                            <div className="flex h-full min-w-full items-stretch gap-4">
                                {m_columns.map((column) => (
                                    <KanbanColumn
                                        key={column.id}
                                        column={column}
                                        isCollapsed={m_visibleCollapsedColumnIds[column.id] === true}
                                        onToggleCollapsed={ToggleColumnCollapsed}
                                        onExpand={ExpandColumn}
                                        onCardClick={HandleCardClick}
                                        curatedBoards={curatedBoards}
                                        isSavingBoardAssignment={isSavingBoardAssignment}
                                        canDragCards={m_canDragCards}
                                        onAddToBoard={onAddToBoard}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </main>

                <DragOverlay>
                    {m_canDragCards && m_activeCard ? (
                        <KanbanCard
                            card={m_activeCard}
                            onClick={(selectedCard) => setSelectedCardId(selectedCard.id)}
                            curatedBoards={curatedBoards}
                            isSavingBoardAssignment={isSavingBoardAssignment}
                            canDrag={false}
                            onAddToBoard={onAddToBoard}
                        />
                    ) : null}
                </DragOverlay>
            </DndContext>

            <KanbanCardDetailsSheet
                boardId={boardId}
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

function GetCollapsedColumnsStorageKey(boardId: string)
{
    return `meshboard:kanban:${boardId}:collapsed-columns`;
}

function ReadCollapsedColumnIds(
    boardId: string,
    columns: KanbanColumnModel[],
): Record<string, boolean>
{
    if (typeof window === "undefined")
    {
        return {};
    }

    try
    {
        const rawValue = window.localStorage.getItem(GetCollapsedColumnsStorageKey(boardId));

        if (!rawValue)
        {
            return {};
        }

        const parsedValue = JSON.parse(rawValue) as Record<string, boolean>;
        const validColumnIds = new Set(columns.map((column) => column.id));

        return Object.fromEntries(
            Object.entries(parsedValue)
                .filter(([columnId, isCollapsed]) => validColumnIds.has(columnId) && isCollapsed === true),
        );
    }
    catch
    {
        return {};
    }
}