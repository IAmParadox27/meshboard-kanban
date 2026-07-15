"use client";

import { useEffect, useState } from "react";

import { KanbanBoard } from "@/components/kanban/kanban-board";
import { Button } from "@/components/ui/button";
import {
    Card,CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { apiClient } from "@/lib/api/api-client";
import { MapIssuesToBoard } from "@/lib/mappers/kanban-board-mapper";
import { KanbanBoardModel } from "./kanban-types";

type KanbanBoardViewState = {
    board: KanbanBoardModel | null;
    isLoading: boolean;
    error: string | null;
};

export function KanbanBoardView() {
    const [m_state, setState] = useState<KanbanBoardViewState>({
        board: null,
        isLoading: true,
        error: null,
    });

    async function LoadBoard() {
        setState((current) => ({
            ...current,
            isLoading: true,
            error: null,
        }));

        try {
            const issues = await apiClient.GetIssues();
            const board = MapIssuesToBoard(issues);

            setState({
                board,
                isLoading: false,
                error: null,
            });
        } catch (error) {
            setState({
                board: null,
                isLoading: false,
                error: error instanceof Error
                    ? error.message
                    : "Failed to load issues.",
            });
        }
    }

    useEffect(() => {
        void LoadBoard();
    }, []);

    if (m_state.isLoading) {
        return (
            <main className="mx-auto w-full max-w-[1600px] px-6 py-6">
                <div className="text-sm text-muted-foreground">
                    Loading board...
                </div>
            </main>
        );
    }

    if (m_state.error) {
        return (
            <main className="mx-auto w-full max-w-[1600px] px-6 py-6">
                <Card className="border-destructive/30">
                    <CardHeader>
                        <CardTitle>
                            Unable to load issues
                        </CardTitle><CardDescription>
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

    if (!m_state.board) {
        return null;
    }

    return <KanbanBoard {...m_state.board} />;
}