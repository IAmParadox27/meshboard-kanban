"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    SourceDefinitionModel,
    SourceProviderDefinitionModel,
    SourcesPageModel,
    UpsertSourceDefinitionRequest,
} from "@/lib/models/sources-models";

import { apiClient } from "@/lib/api/api-client";

type SourceColumnMapping = {
    sourceValue: string;
    boardColumnId: string;
};

type SourceEditorState = {
    sourceId: string | null;
    name: string;
    providerKey: string;
    enabled: boolean;
    config: Record<string, string>;
    columnMappings: SourceColumnMapping[];
};

const emptyState: SourceEditorState = {
    sourceId: null,
    name: "",
    providerKey: "",
    enabled: true,
    config: {},
    columnMappings: [],
};

function extractColumnMappings(config: Record<string, string>): SourceColumnMapping[]
{
    return Object.entries(config)
        .filter(([key]) => key.startsWith("columnMappings."))
        .map(([key, value]) => ({
            sourceValue: key.substring("columnMappings.".length),
            boardColumnId: value,
        }));
}

function buildConfigPayload(editor: SourceEditorState): Record<string, string>
{
    const baseConfig: Record<string, string> = { ...editor.config };

    for (const mapping of editor.columnMappings)
    {
        const sourceValue = mapping.sourceValue.trim();
        const boardColumnId = mapping.boardColumnId.trim();

        if (!sourceValue || !boardColumnId)
        {
            continue;
        }

        baseConfig[`columnMappings.${sourceValue}`] = boardColumnId;
    }

    return baseConfig;
}

function extractPlainConfig(config: Record<string, string>): Record<string, string>
{
    return Object.fromEntries(
        Object.entries(config).filter(([key]) => !key.startsWith("columnMappings."))
    );
}

export function SourcesView() {
    const [m_data, setData] = useState<SourcesPageModel | null>(null);
    const [m_editor, setEditor] = useState<SourceEditorState>(emptyState);
    const [m_error, setError] = useState<string | null>(null);
    const [m_isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        void Load();
    }, []);

    async function Load() {
        setError(null);

        try {
            const data = await apiClient.GetSourcesPage();
            setData(data);

            if (!m_editor.providerKey && data.providers.length > 0) {
                setEditor({
                    ...emptyState,
                    providerKey: data.providers[0].providerKey,
                });
            }
        } catch (error) {
            setError(error instanceof Error ? error.message : "Failed to load sources.");
        }
    }

    const selectedProvider = useMemo(() => {
        return m_data?.providers.find((x) => x.providerKey === m_editor.providerKey) ?? null;
    }, [m_data, m_editor.providerKey]);

    function updateColumnMapping(index: number, mapping: SourceColumnMapping)
    {
        setEditor({
            ...m_editor,
            columnMappings: m_editor.columnMappings.map((x, i) =>
                i === index ? mapping : x
            ),
        });
    }

    function removeColumnMapping(index: number)
    {
        setEditor({
            ...m_editor,
            columnMappings: m_editor.columnMappings.filter((_, i) => i !== index),
        });
    }

    function StartEditing(source: SourceDefinitionModel)
    {
        setEditor({
            sourceId: source.id,
            name: source.name,
            providerKey: source.providerKey,
            enabled: source.enabled,
            config: extractPlainConfig(source.config),
            columnMappings: extractColumnMappings(source.config),
        });
    }

    function CancelEditing()
    {
        setEditor({
            ...emptyState,
            providerKey: m_data?.providers[0]?.providerKey ?? "",
        });
    }

    async function SaveSource() {
        if (!m_editor.providerKey) {
            return;
        }

        setIsSaving(true);
        setError(null);

        try {
            const request: UpsertSourceDefinitionRequest = {
                name: m_editor.name,
                providerKey: m_editor.providerKey,
                enabled: m_editor.enabled,
                config: buildConfigPayload(m_editor),
            };

            if (m_editor.sourceId) {
                await apiClient.UpdateSource(m_editor.sourceId, request);
            } else {
                await apiClient.CreateSource(request);
            }

            setEditor({
                ...emptyState,
                providerKey: m_editor.providerKey,
            });

            await Load();
        } catch (error) {
            setError(error instanceof Error
                ? error.message
                : m_editor.sourceId
                    ? "Failed to update source."
                    : "Failed to create source.");
        } finally {
            setIsSaving(false);
        }
    }

    async function DeleteSource(source: SourceDefinitionModel) {
        setError(null);

        try {
            await apiClient.DeleteSource(source.id);
            await Load();
        } catch (error) {
            setError(error instanceof Error ? error.message : "Failed to delete source.");
        }
    }

    return (
        <main className="mx-auto flex h-full w-full max-w-[1600px] flex-col gap-6 overflow-y-auto px-6 py-6">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight">
                    Sources
                </h1>
            </div>

            {m_error ? (
                <div
                    className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                    {m_error}
                </div>
            ) : null}

            <section className="rounded-xl border bg-card p-6">
                <div className="mb-4">
                    <h2 className="text-lg font-semibold">
                        {m_editor.sourceId ? "Edit source" : "Add source"}
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
                            placeholder="Public roadmap"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">
                            Provider
                        </label>

                        <select
                            className="h-8 w-full rounded-md border bg-background px-3 text-sm"
                            value={m_editor.providerKey}
                            disabled={m_editor.sourceId !== null}
                            onChange={(event) => setEditor({
                                ...m_editor,
                                providerKey: event.target.value,
                                config: {},
                                columnMappings: [],
                            })}
                        >
                            {(m_data?.providers ?? []).map((provider) => (
                                <option
                                    key={provider.providerKey}
                                    value={provider.providerKey}
                                >
                                    {provider.displayName}
                                </option>
                            ))}
                        </select>
                    </div>

                    {selectedProvider?.configurationFields.map((field) => (
                        <div
                            key={field.key}
                            className="space-y-2"
                        >
                            <label className="text-sm font-medium">
                                {field.label}
                            </label>

                            <Input
                                type={field.type === "password" ? "password" : "text"}
                                value={m_editor.config[field.key] ?? ""}
                                onChange={(event) => setEditor({
                                    ...m_editor,
                                    config: {
                                        ...m_editor.config,
                                        [field.key]: event.target.value,
                                    },
                                })}
                                placeholder={field.placeholder ?? ""}
                            />

                            {field.helpText ? (
                                <p className="text-xs text-muted-foreground">
                                    {field.helpText}
                                </p>
                            ) : null}
                        </div>
                    ))}
                </div>

                <div style={{ marginTop: "2rem" }}>
                    <h3 className="text-sm font-medium" style={{ marginBottom: "0.5rem" }}>Column Mappings</h3>
                    {m_editor.columnMappings.map((mapping, index) => (
                        <div
                            key={index}
                            style={{ marginBottom: "1rem" }}
                            className="grid gap-3 md:grid-cols-[1fr_1fr_auto]"
                        >
                            <Input
                                value={mapping.sourceValue}
                                onChange={(event) => updateColumnMapping(index, {
                                    ...mapping,
                                    sourceValue: event.target.value,
                                })}
                                placeholder="Source Column Name (e.g. In Progress)"
                            />

                            <Input
                                value={mapping.boardColumnId}
                                onChange={(event) => updateColumnMapping(index, {
                                    ...mapping,
                                    boardColumnId: event.target.value,
                                })}
                                placeholder="Meshboard Column Name (e.g. in-progress)"
                            />

                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => removeColumnMapping(index)}
                            >
                                Remove
                            </Button>
                        </div>
                    ))}

                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setEditor({
                            ...m_editor,
                            columnMappings: [
                                ...m_editor.columnMappings,
                                {
                                    sourceValue: "",
                                    boardColumnId: "",
                                },
                            ],
                        })}
                    >
                        Add mapping
                    </Button>
                </div>
                <div className="mt-4 flex justify-end gap-2">
                    {m_editor.sourceId ? (
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
                        onClick={() => void SaveSource()}
                        disabled={m_isSaving}
                    >
                        {m_editor.sourceId ? "Save changes" : "Add source"}
                    </Button>
                </div>
            </section>

            <section className="rounded-xl border bg-card p-6">
                <h2 className="mb-4 text-lg font-semibold">
                    Configured sources
                </h2>

                <div className="space-y-3">
                    {(m_data?.sources ?? []).map((source) => (
                        <div
                            key={source.id}
                            className="flex items-center justify-between rounded-lg border px-4 py-3"
                        >
                            <div>
                                <div className="font-medium">
                                    {source.name}
                                </div>

                                <div className="text-sm text-muted-foreground">
                                    {source.providerKey}
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">
                                    {source.enabled ? "Enabled" : "Disabled"}
                                </span>

                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => StartEditing(source)}
                                >
                                    Edit
                                </Button>

                                <Button
                                    variant="destructive"
                                    onClick={() => void DeleteSource(source)}
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