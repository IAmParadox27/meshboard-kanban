"use client";

import { useEffect, useState } from "react";

import { KanbanBoard } from "@/components/kanban/kanban-board";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { apiClient } from "@/lib/api/api-client";import { MapIssuesToBoard } from "@/lib/mappers/kanban-board-mapper";
import { BoardDefinitionModel, BoardModes } from "@/lib/models/boards-models";
import { SourceDefinitionModel } from "@/lib/models/sources-models";
import { KanbanBoardModel, KanbanCardModel } from "./kanban-types";

type KanbanBoardViewProps = {
    boardId: string;
};

type KanbanBoardViewState = {
    board: KanbanBoardModel | null;
    boardDefinition: BoardDefinitionModel | null;
    curatedBoards: BoardDefinitionModel[];
    boardRevision: number;
    isLoading: boolean;
    isRefreshing: boolean;
    isSavingBoardAssignment: boolean;
    error: string | null;
};

export function KanbanBoardView(
    {
        boardId,
    }: KanbanBoardViewProps,
)
{
    const [m_state, setState] = useState<KanbanBoardViewState>({
        board: null,
        boardDefinition: null,
        curatedBoards: [],
        boardRevision: 0,
        isLoading: true,
        isRefreshing: false,
        isSavingBoardAssignment: false,
        error: null,
    });

    function RemoveCardFromVisibleBoard(cardId: string)
    {
        setState((current) => {
            if (!current.board)
            {
                return current;
            }

            return {
                ...current,
                board: {
                    ...current.board,
                    columns: current.board.columns.map((column) => ({
                        ...column,
                        cards: column.cards.filter((x) => x.id !== cardId),
                    })),
                },
            };
        });
    }

    async function LoadBoard(showLoading = true)
    {
        setState((current) => ({
            ...current,
            isLoading: showLoading && current.board === null,
            isRefreshing: !showLoading && current.board !== null,
            error: null,
        }));

        try
        {
            const [boardData, boardsPage, sourcesPage] = await Promise.all([
                apiClient.GetBoard(boardId),
                apiClient.GetBoardsPage(),
                apiClient.GetSourcesPage(),
            ]);

            const sourceNameById = BuildSourceNameById(sourcesPage.sources);

            const board = MapIssuesToBoard(
                boardData.board.name,
                GetBoardDescription(boardData.board.mode),
                boardData.board.columns,
                boardData.issues,
                sourceNameById,
            );

            setState((current) => ({
                ...current,
                board,
                boardDefinition: boardData.board,
                curatedBoards: boardsPage.boards.filter((x) => x.enabled && x.mode === BoardModes.Curated),
                boardRevision: current.boardRevision + 1,
                isLoading: false,
                isRefreshing: false,
                isSavingBoardAssignment: false,
                error: null,
            }));
        }
        catch (error)
        {
            setState((current) => ({
                ...current,
                board: showLoading ? null : current.board,
                boardDefinition: showLoading ? null : current.boardDefinition,
                curatedBoards: showLoading ? [] : current.curatedBoards,
                isLoading: false,
                isRefreshing: false,
                isSavingBoardAssignment: false,
                error: error instanceof Error
                    ? error.message
                    : "Failed to load board.",
            }));
        }
    }

    async function AddToBoard(targetBoardId: string, card: KanbanCardModel)
    {
        const currentBoardMode = m_state.boardDefinition?.mode;

        setState((current) => ({
            ...current,
            isSavingBoardAssignment: true,
            error: null,
        }));

        if (currentBoardMode === BoardModes.Unassigned)
        {
            RemoveCardFromVisibleBoard(card.id);
        }

        try
        {
            await apiClient.AddIssueToBoard(targetBoardId, {
                sourceId: card.sourceId,
                externalId: card.externalId,
            });

            await LoadBoard(false);
        }
        catch (error)
        {
            await LoadBoard(false);

            setState((current) => ({
                ...current,
                isSavingBoardAssignment: false,
                error: error instanceof Error
                    ? error.message
                    : "Failed to add issue to board.",
            }));
        }
    }

    async function RemoveFromCurrentBoard(card: KanbanCardModel)
    {
        if (!m_state.boardDefinition)
        {
            return;
        }

        setState((current) => ({
            ...current,
            isSavingBoardAssignment: true,
            error: null,
        }));

        try
        {
            await apiClient.RemoveIssueFromBoard(m_state.boardDefinition.id, {
                sourceId: card.sourceId,
                externalId: card.externalId,
            });

            await LoadBoard(false);
        }
        catch (error)
        {
            setState((current) => ({
                ...current,
                isSavingBoardAssignment: false,
                error: error instanceof Error
                    ? error.message
                    : "Failed to remove issue from board.",}));
        }
    }

    useEffect(() => {
        void LoadBoard();
    }, [boardId]);

    if (m_state.isLoading)
    {
        return (
            <main className="mx-auto w-full max-w-[1600px] px-6 py-6">
                <div className="text-sm text-muted-foreground">
                    Loading board...
                </div>
            </main>
        );
    }

    if (m_state.error)
    {
        return (
            <main className="mx-auto w-full max-w-[1600px] px-6 py-6">
                <Card className="border-destructive/30">
                    <CardHeader>
                        <CardTitle>
                            Unable to load board
                        </CardTitle>

                        <CardDescription>
                            {m_state.error}
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        <Button onClick={() => void LoadBoard()}>
                            Retry
                        </Button>
                    </CardContent>
                </Card>
            </main>
        );
    }

    if (!m_state.board || !m_state.boardDefinition)
    {
        return null;
    }

    return (
        <KanbanBoard
            key={`${boardId}:${m_state.boardRevision}`}
            {...m_state.board}
            curatedBoards={m_state.curatedBoards
                .filter((x) => x.id !== m_state.boardDefinition?.id)
                .map((x) => ({
                    id: x.id,
                    name: x.name,
                }))}
            canRemoveFromCurrentBoard={m_state.boardDefinition.mode === BoardModes.Curated}
            isSavingBoardAssignment={m_state.isSavingBoardAssignment}
            isRefreshing={m_state.isRefreshing}
            onAddToBoard={(targetBoardId, card) => void AddToBoard(targetBoardId, card)}
            onRemoveFromCurrentBoard={(card) => void RemoveFromCurrentBoard(card)}
        />
    );
}

function BuildSourceNameById(sources: SourceDefinitionModel[]): Record<string, string>
{
    return Object.fromEntries(sources.map((x) => [x.id, x.name]));
}

function GetBoardDescription(mode: number): string {
    switch (mode) {
        case BoardModes.DirectFromSources:
            return "Live issues pulled directly from the selected sources.";

        case BoardModes.Curated:
            return "Curated board containing issues explicitly added to it.";

        case BoardModes.Unassigned:
            return "Issues from the selected sources that are not assigned to any curated board.";

        default:
            return "Board";
    }
}