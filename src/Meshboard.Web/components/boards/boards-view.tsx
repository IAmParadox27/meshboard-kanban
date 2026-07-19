"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
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
import { CurrentUserModel } from "@/lib/models/users-models";
import {
    DndContext,
    DragEndEvent,
    PointerSensor,
    closestCenter,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import {
    SortableContext,
    arrayMove,
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type BoardEditorColumnState = {
    id: string;
    columnId: string;
    title: string;
};

type BoardEditorState = {
    boardId: string | null;
    name: string;
    mode: BoardMode;
    enabled: boolean;
    isPublic: boolean;
    sourceIds: string[];
    columns: BoardEditorColumnState[];
};

type BoardsViewState = {
    boards: BoardDefinitionModel[];
    sources: SourceDefinitionModel[];
};

function CreateDefaultColumns(): BoardEditorColumnState[]
{
    return [
        {
            id: crypto.randomUUID(),
            columnId: "todo",
            title: "Todo",
        },
        {
            id: crypto.randomUUID(),
            columnId: "in-progress",
            title: "In Progress",
        },
        {
            id: crypto.randomUUID(),
            columnId: "done",
            title: "Done",
        },
    ];
}

function CreateEmptyEditorState(): BoardEditorState
{
    return {
        boardId: null,
        name: "",
        mode: BoardModes.DirectFromSources,
        enabled: true,
        isPublic: false,
        sourceIds: [],
        columns: CreateDefaultColumns(),
    };
}

type BoardColumnEditorRowProps = {
    column: BoardEditorColumnState;
    canRemove: boolean;
    disabled: boolean;
    onColumnIdChange: (value: string) => void;
    onTitleChange: (value: string) => void;
    onRemove: () => void;
};

function BoardColumnEditorRow(
    {
        column,
        canRemove,
        disabled,
        onColumnIdChange,
        onTitleChange,
        onRemove,
    }: BoardColumnEditorRowProps,
)
{
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: column.id,
        disabled,
    });

    return (
        <div
            ref={setNodeRef}
            style={{
                transform: CSS.Transform.toString(transform),
                transition,
            }}
            className={[
                "grid gap-3 rounded-md border p-3 md:grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)_auto]",
                isDragging ? "bg-accent shadow-sm opacity-90" : "bg-muted/30",
            ].join(" ")}
        >
            <button
                type="button"
                className="flex h-10 w-10 cursor-grab items-center justify-center rounded-md border text-muted-foreground active:cursor-grabbing"
                aria-label={`Reorder ${column.title || column.columnId || "column"}`}
                {...attributes}
                {...listeners}
            >
                ⋮⋮
            </button>

            <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">
                    Column ID
                </label>

                <Input
                    value={column.columnId}
                    onChange={(event) => onColumnIdChange(event.target.value)}
                    placeholder="todo"
                    disabled={disabled}
                />
            </div>

            <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">
                    Title
                </label>

                <Input
                    value={column.title}
                    onChange={(event) => onTitleChange(event.target.value)}
                    placeholder="Todo"
                    disabled={disabled}
                />
            </div>

            <div className="flex items-end">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onRemove}
                    disabled={disabled || !canRemove}
                >
                    Remove
                </Button>
            </div>
        </div>
    );
}

export function BoardsView()
{
    const [m_currentUser, setCurrentUser] = useState<CurrentUserModel | null>(null);
    const [m_data, setData] = useState<BoardsViewState | null>(null);
    const [m_editor, setEditor] = useState<BoardEditorState>(CreateEmptyEditorState());
    const [m_error, setError] = useState<string | null>(null);
    const [m_isSaving, setIsSaving] = useState(false);
    const [m_copyColumnsBoardId, setCopyColumnsBoardId] = useState<string>("");
    const m_sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
    );

    useEffect(() => {
        void Load();
    }, []);

    function CopyColumnsFromBoard(boardId: string)
    {
        if (!m_data)
        {
            return;
        }

        const sourceBoard = m_data.boards.find((board) => board.id === boardId);

        if (!sourceBoard)
        {
            return;
        }

        setEditor((current) => ({
            ...current,
            columns: [...sourceBoard.columns]
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map((column) => ({
                    id: crypto.randomUUID(),
                    columnId: column.columnId,
                    title: column.title,
                })),
        }));

        setCopyColumnsBoardId("");
    }

    function ReorderColumns(event: DragEndEvent)
    {
        const activeId = String(event.active.id);
        const overId = event.over ? String(event.over.id) : null;

        if (!overId || activeId === overId)
        {
            return;
        }

        const oldIndex = m_editor.columns.findIndex((column) => column.id === activeId);
        const newIndex = m_editor.columns.findIndex((column) => column.id === overId);

        if (oldIndex < 0 || newIndex < 0)
        {
            return;
        }

        setEditor((current) => ({
            ...current,
            columns: arrayMove(current.columns, oldIndex, newIndex),
        }));
    }

    async function Load()
    {
        setError(null);

        try
        {
            const [currentUser, boardsPage] = await Promise.all([
                apiClient.TryGetCurrentUser(),
                apiClient.GetBoardsPage(),
            ]);

            setCurrentUser(currentUser);

            if (currentUser?.isAdmin)
            {
                const sourcesPage = await apiClient.GetSourcesPage();

                setData({
                    boards: boardsPage.boards,
                    sources: sourcesPage.sources,
                });

                return;
            }

            setData({
                boards: boardsPage.boards,
                sources: [],
            });
        }
        catch (error)
        {
            setError(error instanceof Error ? error.message : "Failed to load boards.");
        }
    }

    function StartEditing(board: BoardDefinitionModel)
    {
        setCopyColumnsBoardId("");

        setEditor({
            boardId: board.id,
            name: board.name,
            mode: board.mode,
            enabled: board.enabled,
            isPublic: board.isPublic,
            sourceIds: [...board.sourceIds],
            columns: [...board.columns]
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map((column) => ({
                    id: crypto.randomUUID(),
                    columnId: column.columnId,
                    title: column.title,
                })),
        });
    }

    function CancelEditing()
    {
        setCopyColumnsBoardId("");
        setEditor(CreateEmptyEditorState());
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

    function AddColumn()
    {
        setEditor({
            ...m_editor,
            columns: [
                ...m_editor.columns,
                {
                    id: crypto.randomUUID(),
                    columnId: "",
                    title: "",
                },
            ],
        });
    }

    function UpdateColumn(
        columnId: string,
        changes: Partial<BoardEditorColumnState>,
    )
    {
        setEditor({
            ...m_editor,
            columns: m_editor.columns.map((column) => column.id === columnId
                ? {
                    ...column,
                    ...changes,
                }
                : column),
        });
    }

    function RemoveColumn(columnId: string)
    {
        setEditor({
            ...m_editor,
            columns: m_editor.columns.filter((column) => column.id !== columnId),
        });
    }

    async function SaveBoard()
    {
        setIsSaving(true);
        setError(null);

        try
        {
            const normalizedColumns = m_editor.columns.map((column, index) => ({
                columnId: column.columnId.trim(),
                title: column.title.trim(),
                sortOrder: index,
            }));

            if (normalizedColumns.length === 0)
            {
                throw new Error("At least one column is required.");
            }

            if (normalizedColumns.some((column) => column.columnId.length === 0))
            {
                throw new Error("Every column must have an ID.");
            }

            if (normalizedColumns.some((column) => column.title.length === 0))
            {
                throw new Error("Every column must have a title.");
            }

            const distinctColumnIds = new Set(normalizedColumns.map((column) => column.columnId.toLowerCase()));

            if (distinctColumnIds.size !== normalizedColumns.length)
            {
                throw new Error("Column IDs must be unique within a board.");
            }

            const request: UpsertBoardDefinitionRequest = {
                name: m_editor.name,
                mode: m_editor.mode,
                enabled: m_editor.enabled,
                isPublic: m_editor.isPublic,
                sourceIds: m_editor.mode === BoardModes.Curated
                    ? []
                    : m_editor.sourceIds,
                columns: normalizedColumns,
            };

            if (m_editor.boardId)
            {
                await apiClient.UpdateBoard(m_editor.boardId, request);
            }
            else
            {
                await apiClient.CreateBoard(request);
            }

            setCopyColumnsBoardId("");
            setEditor(CreateEmptyEditorState());
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
                setEditor(CreateEmptyEditorState());
            }

            await Load();
        }
        catch (error)
        {
            setError(error instanceof Error ? error.message : "Failed to delete board.");
        }
    }

    const copyableBoards = useMemo(() => {
        return (m_data?.boards ?? []).filter((board) => board.id !== m_editor.boardId);
    }, [m_data, m_editor.boardId]);

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
                <h2 className="mb-4 text-lg font-semibold">
                    Boards
                </h2>

                <div className="space-y-3">
                    {(m_data?.boards ?? []).map((board) => (
                        <div
                            key={board.id}
                            className="flex items-center justify-between rounded-lg border px-4 py-3"
                        >
                            <div className="space-y-2">
                                <div className="font-medium">
                                    {board.name}
                                </div>

                                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                                    <span>
                                        {GetBoardModeLabel(board.mode)}
                                    </span>

                                    <Badge variant={board.isPublic ? "default" : "secondary"}>
                                        {board.isPublic ? "Public" : "Private"}
                                    </Badge>

                                    <Badge variant={board.enabled ? "outline" : "destructive"}>
                                        {board.enabled ? "Enabled" : "Disabled"}
                                    </Badge>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <Link href={`/boards/${board.id}`}>
                                    <Button type="button" variant="outline">
                                        Open
                                    </Button>
                                </Link>

                                {m_currentUser?.isAdmin ? (
                                    <>
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
                                    </>
                                ) : null}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {!m_currentUser?.isAdmin ? (
                <section className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
                    Admin access is required to create, edit, delete, or reconfigure boards.
                </section>
            ) : null}

            {m_currentUser?.isAdmin ? (
                <section className="rounded-xl border bg-card p-6">
                    <div className="mb-4">
                        <h2 className="text-lg font-semibold">
                            {m_editor.boardId ? "Edit board" : "Add board"}
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
                                className="h-8 w-full rounded-md border bg-background px-3 text-sm"
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
                                </option>
                            </select>
                        </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-6">
                        <label className="flex items-center gap-2 text-sm font-medium">
                            <input
                                id="board-enabled"
                                type="checkbox"
                                checked={m_editor.enabled}
                                onChange={(event) => setEditor({
                                    ...m_editor,
                                    enabled: event.target.checked,
                                })}
                            />
                            Enabled
                        </label>

                        <label className="flex items-center gap-2 text-sm font-medium">
                            <input
                                id="board-public"
                                type="checkbox"
                                checked={m_editor.isPublic}
                                onChange={(event) => setEditor({
                                    ...m_editor,
                                    isPublic: event.target.checked,
                                })}
                            />
                            Public board
                        </label>
                    </div>

                    <p className="mt-2 text-sm text-muted-foreground">
                        Public boards can be viewed without signing in. Private boards require an authenticated user.
                    </p>

                    <div className="mt-6 space-y-3">

                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <h3 className="text-sm font-medium">
                                Columns
                            </h3>

                            <div className="flex flex-wrap items-center gap-2">
                                <select
                                    className="h-8 min-w-56 rounded-md border bg-background px-3 text-sm"
                                    value={m_copyColumnsBoardId}
                                    onChange={(event) => setCopyColumnsBoardId(event.target.value)}
                                    disabled={m_isSaving || copyableBoards.length === 0}
                                >
                                    <option value="">
                                        Copy columns from...
                                    </option>

                                    {copyableBoards.map((board) => (
                                        <option key={board.id} value={board.id}>
                                            {board.name}
                                        </option>
                                    ))}
                                </select>

                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={m_isSaving || m_copyColumnsBoardId.length === 0}
                                    onClick={() => CopyColumnsFromBoard(m_copyColumnsBoardId)}
                                >
                                    Use their columns
                                </Button>

                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={AddColumn}
                                    disabled={m_isSaving}
                                >
                                    Add column
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <DndContext
                                sensors={m_sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={ReorderColumns}
                            >
                                <SortableContext
                                    items={m_editor.columns.map((column) => column.id)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    <div className="space-y-3">
                                        {m_editor.columns.map((column) => (
                                            <BoardColumnEditorRow
                                                key={column.id}
                                                column={column}
                                                canRemove={m_editor.columns.length > 1}
                                                disabled={m_isSaving}
                                                onColumnIdChange={(value) => UpdateColumn(column.id, {
                                                    columnId: value,
                                                })}
                                                onTitleChange={(value) => UpdateColumn(column.id, {
                                                    title: value,
                                                })}
                                                onRemove={() => RemoveColumn(column.id)}
                                            />
                                        ))}
                                    </div>
                                </SortableContext>
                            </DndContext>
                        </div>
                    </div>

                    {m_editor.mode !== BoardModes.Curated ? (
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
                                    </label>
                                ))}
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
            ) : null}
        </main>
    );
}

function GetBoardModeLabel(mode: number): string
{
    switch (mode)
    {
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