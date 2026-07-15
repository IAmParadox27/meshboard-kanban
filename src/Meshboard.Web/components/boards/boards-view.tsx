"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiClient } from "@/lib/api/api-client";
import {
    BoardDefinitionModel,
    BoardModes,
    BoardMode,
    BoardsPageModel,
    UpsertBoardDefinitionRequest,
} from "@/lib/models/boards-models";
import { SourceDefinitionModel } from "@/lib/models/sources-models";


type BoardEditorState = {
    boardId: string | null;
    name: string;
    mode: BoardMode;
    enabled: boolean;
    sourceIds: string[];
};

type BoardsViewState = {
    boards: BoardDefinitionModel[];
    sources: SourceDefinitionModel[];
};
const emptyEditorState: BoardEditorState = {
    boardId: null,
    name: "",
    mode: BoardModes.DirectFromSources,
    enabled: true,
    sourceIds: [],
};

export function BoardsView()
{
    const [m_data, setData] = useState<BoardsViewState | null>(null);
    const [m_editor, setEditor] = useState<BoardEditorState>(emptyEditorState);
    const [m_error, setError] = useState<string | null>(null);
    const [m_isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        void Load();
    }, []);

    async function Load()
    {
        setError(null);

        try
        {
            const [boardsPage, sourcesPage] = await Promise.all([
                apiClient.GetBoardsPage(),
                apiClient.GetSourcesPage(),
            ]);

            setData({
                boards: boardsPage.boards,
                sources: sourcesPage.sources,
            });
        }
        catch (error)
        {
            setError(error instanceof Error ? error.message : "Failed to load boards.");
        }
    }

    function StartEditing(board: BoardDefinitionModel)
    {
        setEditor({
            boardId: board.id,
            name: board.name,
            mode: board.mode,
            enabled: board.enabled,
            sourceIds: board.sourceIds,
        });
    }

    function CancelEditing()
    {
        setEditor(emptyEditorState);
    }

    function ToggleSource(sourceId: string)
    {
        const hasSource = m_editor.sourceIds.includes(sourceId);

        setEditor({
            ...m_editor,
            sourceIds: hasSource
                ? m_editor.sourceIds.filter((x) => x !== sourceId)
                : [...m_editor.sourceIds, sourceId],
        });
    }

    async function SaveBoard()
    {
        setIsSaving(true);
        setError(null);

        try
        {
            const request: UpsertBoardDefinitionRequest = {
                name: m_editor.name,
                mode: m_editor.mode,
                enabled: m_editor.enabled,
                sourceIds: m_editor.mode === BoardModes.DirectFromSources
                    ? m_editor.sourceIds
                    : [],
            };

            if (m_editor.boardId)
            {
                await apiClient.UpdateBoard(m_editor.boardId, request);
            }
            else
            {
                await apiClient.CreateBoard(request);
            }

            setEditor(emptyEditorState);
            await Load();
        }
        catch (error)
        {
            setError(error instanceof Error ? error.message : "Failed to save board.");
        }
        finally
        {
            setIsSaving(false);
        }
    }

    async function DeleteBoard(board: BoardDefinitionModel)
    {
        setError(null);

        try
        {
            await apiClient.DeleteBoard(board.id);

            if (m_editor.boardId === board.id)
            {
                setEditor(emptyEditorState);
            }

            await Load();
        }
        catch (error)
        {
            setError(error instanceof Error ? error.message : "Failed to delete board.");
        }
    }

    const directSources = useMemo(() => {
        return (m_data?.sources ?? []).filter((x) => x.enabled);
    }, [m_data]);

    return (
        <main className="mx-auto flex h-full w-full max-w-[1600px] flex-col gap-6 overflow-y-auto px-6 py-6">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight">
                    Boards
                </h1>
            </div>

            {m_error ? (
                <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                    {m_error}
                </div>
            ) : null}

            <section className="rounded-xl border bg-card p-6">
                <div className="mb-4">
                    <h2 className="text-lg font-semibold">{m_editor.boardId ? "Edit board" : "Add board"}
                    </h2>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">
                            Name
                        </label>

                        <Input
                            value={m_editor.name}
                            onChange={(event) => setEditor({
                                ...m_editor,
                                name: event.target.value,
                            })}
                            placeholder="Next up"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">
                            Mode
                        </label>

                        <select
                            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                            value={String(m_editor.mode)}
                            onChange={(event) => setEditor({
                                ...m_editor,
                                mode: Number(event.target.value) as BoardMode,
                                sourceIds: Number(event.target.value) === BoardModes.DirectFromSources
                                    ? m_editor.sourceIds
                                    : [],
                            })}
                        >
                            <option value={BoardModes.DirectFromSources}>
                                Direct from sources
                            </option>
                            <option value={BoardModes.Curated}>
                                Curated
                            </option>
                            <option value={BoardModes.Unassigned}>
                                Unassigned
                            </option></select>
                    </div>
                </div>

                <div className="mt-4 flex items-center gap-2">
                    <input
                        id="board-enabled"
                        type="checkbox"
                        checked={m_editor.enabled}
                        onChange={(event) => setEditor({
                            ...m_editor,
                            enabled: event.target.checked,
                        })}
                    />
                    <label htmlFor="board-enabled" className="text-sm font-medium">
                        Enabled
                    </label>
                </div>

                {m_editor.mode === BoardModes.DirectFromSources ? (
                    <div className="mt-6 space-y-3">
                        <h3 className="text-sm font-medium">
                            Sources
                        </h3>

                        <div className="space-y-2">
                            {directSources.map((source) => (
                                <label
                                    key={source.id}
                                    className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
                                >
                                    <input
                                        type="checkbox"
                                        checked={m_editor.sourceIds.includes(source.id)}
                                        onChange={() => ToggleSource(source.id)}
                                    />
                                    <span className="font-medium">
                                        {source.name}
                                    </span>
                                    <span className="text-muted-foreground">
                                        ({source.providerKey})
                                    </span>
                                </label>))}
                        </div>
                    </div>
                ) : null}

                <div className="mt-4 flex justify-end gap-2">
                    {m_editor.boardId ? (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={CancelEditing}
                            disabled={m_isSaving}
                        >
                            Cancel
                        </Button>
                    ) : null}

                    <Button
                        type="button"
                        onClick={() => void SaveBoard()}
                        disabled={m_isSaving}
                    >
                        {m_editor.boardId ? "Save changes" : "Add board"}
                    </Button>
                </div>
            </section>

            <section className="rounded-xl border bg-card p-6">
                <h2 className="mb-4 text-lg font-semibold">
                    Configured boards
                </h2>

                <div className="space-y-3">
                    {(m_data?.boards ?? []).map((board) => (
                        <div
                            key={board.id}
                            className="flex items-center justify-between rounded-lg border px-4 py-3"
                        >
                            <div>
                                <div className="font-medium">
                                    {board.name}
                                </div>

                                <div className="text-sm text-muted-foreground">
                                    {GetBoardModeLabel(board.mode)}
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <Link href={`/boards/${board.id}`}><Button type="button" variant="outline">
                                    Open
                                </Button>
                                </Link>

                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => StartEditing(board)}
                                >
                                    Edit
                                </Button>

                                <Button
                                    type="button"
                                    variant="destructive"
                                    onClick={() => void DeleteBoard(board)}
                                >
                                    Delete
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </main>
    );
}

function GetBoardModeLabel(mode: number): string {
    switch (mode) {
        case BoardModes.DirectFromSources:
            return "Direct from sources";

        case BoardModes.Curated:
            return "Curated";

        case BoardModes.Unassigned:
            return "Unassigned";

        default:
            return "Unknown";
    }
}