"use client";

import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { apiClient } from "@/lib/api/api-client";
import { SourcesPageModel } from "@/lib/models/sources-models";
import {
    CurrentUserModel,
    UpdateCurrentUserRequest,
    UpsertUserSourceMappingRequest,
    UserSourceMappingModel,
} from "@/lib/models/users-models";

type ProfileEditorState = {
    displayName: string;
    email: string;
};

type SourceMappingEditorState = {
    sourceId: string;
    externalUserId: string;
    externalUsername: string;
    externalDisplayName: string;
};

export default function ProfilePage()
{
    const [m_currentUser, setCurrentUser] = useState<CurrentUserModel | null>(null);
    const [m_sourcesPage, setSourcesPage] = useState<SourcesPageModel | null>(null);
    const [m_profile, setProfile] = useState<ProfileEditorState>({
        displayName: "",
        email: "",
    });
    const [m_mappingEditor, setMappingEditor] = useState<SourceMappingEditorState>({
        sourceId: "",
        externalUserId: "",
        externalUsername: "",
        externalDisplayName: "",
    });
    const [m_error, setError] = useState<string | null>(null);
    const [m_success, setSuccess] = useState<string | null>(null);
    const [m_isSavingProfile, setIsSavingProfile] = useState(false);
    const [m_isSavingMapping, setIsSavingMapping] = useState(false);

    useEffect(() =>
    {
        void Load();
    }, []);

    const availableSources = useMemo(() => m_sourcesPage?.sources ?? [], [m_sourcesPage]);

    async function Load()
    {
        setError(null);

        try
        {
            const [currentUser, sourcesPage] = await Promise.all([
                apiClient.GetCurrentUser(),
                apiClient.GetSourcesPage(),
            ]);

            setCurrentUser(currentUser);
            setSourcesPage(sourcesPage);
            setProfile({
                displayName: currentUser.displayName,
                email: currentUser.email ?? "",
            });
            setMappingEditor((state) => ({
                ...state,
                sourceId: state.sourceId || sourcesPage.sources[0]?.id || "",
            }));
        }
        catch (error)
        {
            setError(error instanceof Error ? error.message : "Failed to load profile.");
        }
    }

    function StartEditingMapping(mapping: UserSourceMappingModel)
    {
        setMappingEditor({
            sourceId: mapping.sourceId,
            externalUserId: mapping.externalUserId,
            externalUsername: mapping.externalUsername ?? "",
            externalDisplayName: mapping.externalDisplayName ?? "",
        });
        setSuccess(null);
        setError(null);
    }

    function ResetMappingEditor()
    {
        setMappingEditor({
            sourceId: availableSources[0]?.id ?? "",
            externalUserId: "",
            externalUsername: "",
            externalDisplayName: "",
        });
    }

    async function SaveProfile()
    {
        setIsSavingProfile(true);
        setError(null);
        setSuccess(null);

        try
        {
            const request: UpdateCurrentUserRequest = {
                displayName: m_profile.displayName,
                email: m_profile.email || null,
            };

            const updated = await apiClient.UpdateCurrentUser(request);
            setCurrentUser(updated);
            setProfile({
                displayName: updated.displayName,
                email: updated.email ?? "",
            });
            setSuccess("Profile updated.");
        }
        catch (error)
        {
            setError(error instanceof Error ? error.message : "Failed to update profile.");
        }
        finally
        {
            setIsSavingProfile(false);
        }
    }

    async function SaveSourceMapping()
    {
        if (!m_mappingEditor.sourceId)
        {
            setError("Pick a source first.");
            return;
        }

        setIsSavingMapping(true);
        setError(null);
        setSuccess(null);

        try
        {
            const request: UpsertUserSourceMappingRequest = {
                externalUserId: m_mappingEditor.externalUserId,
                externalUsername: m_mappingEditor.externalUsername || null,
                externalDisplayName: m_mappingEditor.externalDisplayName || null,
            };

            await apiClient.UpsertCurrentUserSourceMapping(m_mappingEditor.sourceId, request);
            await Load();
            ResetMappingEditor();
            setSuccess("Source mapping saved.");
        }
        catch (error)
        {
            setError(error instanceof Error ? error.message : "Failed to save source mapping.");
        }
        finally
        {
            setIsSavingMapping(false);
        }
    }

    async function DeleteSourceMapping(sourceId: string)
    {
        setError(null);
        setSuccess(null);

        try
        {
            await apiClient.DeleteCurrentUserSourceMapping(sourceId);
            await Load();
            ResetMappingEditor();
            setSuccess("Source mapping removed.");
        }
        catch (error)
        {
            setError(error instanceof Error ? error.message : "Failed to remove source mapping.");
        }
    }

    return (
        <main className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 px-6 py-6">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight">
                    Profile
                </h1>
                <p className="text-sm text-muted-foreground">
                    Manage your Meshboard identity and link external source accounts for future write-back features.
                </p>
            </div>

            {m_error ? (
                <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                    {m_error}
                </div>
            ) : null}

            {m_success ? (
                <div className="rounded-md border border-emerald-500/30 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
                    {m_success}
                </div>
            ) : null}

            <section className="rounded-xl border bg-card p-6">
                <div className="mb-4">
                    <h2 className="text-lg font-semibold">
                        Meshboard account
                    </h2>
                    {m_currentUser ? (
                        <p className="text-sm text-muted-foreground">
                            Username: @{m_currentUser.username}
                        </p>
                    ) : null}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="displayName">Display name</Label>
                        <Input
                            id="displayName"
                            value={m_profile.displayName}
                            onChange={(event) => setProfile({
                                ...m_profile,
                                displayName: event.target.value,
                            })}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            value={m_profile.email}
                            onChange={(event) => setProfile({
                                ...m_profile,
                                email: event.target.value,
                            })}
                            placeholder="you@example.com"
                        />
                    </div>
                </div>

                <div className="mt-4 flex justify-end">
                    <Button
                        type="button"
                        onClick={() => void SaveProfile()}
                        disabled={m_isSavingProfile}
                    >
                        {m_isSavingProfile ? "Saving..." : "Save profile"}
                    </Button>
                </div>
            </section>

            <section className="rounded-xl border bg-card p-6">
                <div className="mb-4">
                    <h2 className="text-lg font-semibold">
                        Linked source accounts
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        These mappings tell Meshboard which external account belongs to you on each source.
                    </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="sourceId">Source</Label>
                        <select
                            id="sourceId"
                            className="h-8 w-full rounded-md border bg-background px-3 text-sm"
                            value={m_mappingEditor.sourceId}
                            onChange={(event) => setMappingEditor({
                                ...m_mappingEditor,
                                sourceId: event.target.value,
                            })}
                        >
                            {availableSources.map((source) => (
                                <option key={source.id} value={source.id}>
                                    {source.name} ({source.providerKey})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="externalUserId">External user id</Label>
                        <Input
                            id="externalUserId"
                            value={m_mappingEditor.externalUserId}
                            onChange={(event) => setMappingEditor({
                                ...m_mappingEditor,
                                externalUserId: event.target.value,
                            })}
                            placeholder="12345 or octocat"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="externalUsername">External username</Label>
                        <Input
                            id="externalUsername"
                            value={m_mappingEditor.externalUsername}
                            onChange={(event) => setMappingEditor({
                                ...m_mappingEditor,
                                externalUsername: event.target.value,
                            })}
                            placeholder="octocat"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="externalDisplayName">External display name</Label>
                        <Input
                            id="externalDisplayName"
                            value={m_mappingEditor.externalDisplayName}
                            onChange={(event) => setMappingEditor({
                                ...m_mappingEditor,
                                externalDisplayName: event.target.value,
                            })}
                            placeholder="The Octocat"
                        />
                    </div>
                </div>

                <div className="mt-4 flex gap-2">
                    <Button
                        type="button"
                        onClick={() => void SaveSourceMapping()}
                        disabled={m_isSavingMapping}
                    >
                        {m_isSavingMapping ? "Saving..." : "Save source link"}
                    </Button>

                    <Button
                        type="button"
                        variant="outline"
                        onClick={ResetMappingEditor}
                    >
                        Clear
                    </Button>
                </div>

                <div className="mt-6 space-y-3">
                    {(m_currentUser?.sourceMappings ?? []).map((mapping) => (
                        <div
                            key={mapping.sourceId}
                            className="flex flex-col justify-between gap-4 rounded-lg border px-4 py-3 md:flex-row md:items-center"
                        >
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <span className="font-medium">
                                        {mapping.sourceName}
                                    </span>
                                    <Badge variant="outline">
                                        {mapping.providerKey}
                                    </Badge>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    External id: {mapping.externalUserId}
                                </div>
                                {mapping.externalUsername ? (
                                    <div className="text-sm text-muted-foreground">
                                        Username: {mapping.externalUsername}
                                    </div>
                                ) : null}
                                {mapping.externalDisplayName ? (
                                    <div className="text-sm text-muted-foreground">
                                        Display name: {mapping.externalDisplayName}
                                    </div>
                                ) : null}
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => StartEditingMapping(mapping)}
                                >
                                    Edit
                                </Button>
                                <Button
                                    type="button"
                                    variant="destructive"
                                    onClick={() => void DeleteSourceMapping(mapping.sourceId)}
                                >
                                    Remove
                                </Button>
                            </div>
                        </div>
                    ))}

                    {(m_currentUser?.sourceMappings.length ?? 0) === 0 ? (
                        <div className="rounded-lg border border-dashed px-4 py-6 text-sm text-muted-foreground">
                            No source accounts linked yet.
                        </div>
                    ) : null}
                </div>
            </section>
        </main>
    );
}