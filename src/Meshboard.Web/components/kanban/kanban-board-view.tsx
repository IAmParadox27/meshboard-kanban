"use client";

import { useEffect, useState } from "react";

import { KanbanBoard } from "@/components/kanban/kanban-board";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { apiClient } from "@/lib/api/api-client";
import { MapIssuesToBoard } from "@/lib/mappers/kanban-board-mapper";
import { KanbanBoardModel } from "./kanban-types";

type KanbanBoardViewProps = {
    boardId: string;
};

type KanbanBoardViewState = {
    board: KanbanBoardModel | null;
    isLoading: boolean;
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
        isLoading: true,
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
            const data = await apiClient.GetBoard(boardId);
            const board = MapIssuesToBoard(
                data.board.name,
                GetBoardDescription(data.board.mode),
                data.issues,
            );

            setState({
                board,
                isLoading: false,
                error: null,
            });
        }
        catch (error)
        {
            setState({
                board: null,
                isLoading: false,
                error: error instanceof Error
                    ? error.message
                    : "Failed to load board.",
            });
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
            <main className="mx-auto w-full max-w-[1600px] px-6 py-6"><Card className="border-destructive/30">
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

    if (!m_state.board)
    {
        return null;
    }

    return <KanbanBoard {...m_state.board} />;
}

function GetBoardDescription(mode: number): string {
    switch (mode) {
        case 0:
            return "Live issues pulled directly from the selected sources.";

        case 1:
            return "Curated board containing issues explicitly added to it.";

        case 2:
            return "Issues not currently assigned to another curated board.";

        default:
            return "Board";
    }
}