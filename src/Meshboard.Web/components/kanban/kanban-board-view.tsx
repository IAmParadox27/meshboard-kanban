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
    isLoading: boolean;
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
        isLoading: true,
        isSavingBoardAssignment: false,
        error: null,
    });

    async function LoadBoard()
    {
        setState((current) => ({
            ...current,
            isLoading: true,
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

            setState({
                board,
                boardDefinition: boardData.board,
                curatedBoards: boardsPage.boards.filter((x) => x.enabled && x.mode === BoardModes.Curated),
                isLoading: false,
                isSavingBoardAssignment: false,
                error: null,
            });
        }catch (error)
        {
            setState({
                board: null,
                boardDefinition: null,
                curatedBoards: [],
                isLoading: false,
                isSavingBoardAssignment: false,
                error: error instanceof Error
                    ? error.message
                    : "Failed to load board.",
            });
        }
    }

    async function AddToBoard(targetBoardId: string, card: KanbanCardModel)
    {
        setState((current) => ({
            ...current,
            isSavingBoardAssignment: true,
            error: null,
        }));

        try
        {
            await apiClient.AddIssueToBoard(targetBoardId, {
                sourceId: card.sourceId,
                externalId: card.externalId,
            });

            await LoadBoard();
        }
        catch (error)
        {
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

            await LoadBoard();
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
            {...m_state.board}
            curatedBoards={m_state.curatedBoards
                .filter((x) => x.id !== m_state.boardDefinition?.id)
                .map((x) => ({
                    id: x.id,
                    name: x.name,
                }))}
            canRemoveFromCurrentBoard={m_state.boardDefinition.mode === BoardModes.Curated}
            isSavingBoardAssignment={m_state.isSavingBoardAssignment}
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