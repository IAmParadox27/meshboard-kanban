"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { apiClient } from "@/lib/api/api-client";
import {
    CurrentUserModel,
    UpdateUserRequest,
    UserListItemModel,
    UsersPageModel,
} from "@/lib/models/users-models";

type UserDraftState = Record<string, UpdateUserRequest>;

function createDrafts(users: UserListItemModel[]): UserDraftState
{
    return Object.fromEntries(users.map((user) => [
        user.id,
        {
            displayName: user.displayName,
            email: user.email ?? "",
            isActive: user.isActive,
            isAdmin: user.isAdmin,
        },
    ]));
}

export default function SettingsPage()
{
    const [m_currentUser, setCurrentUser] = useState<CurrentUserModel | null>(null);
    const [m_data, setData] = useState<UsersPageModel | null>(null);
    const [m_drafts, setDrafts] = useState<UserDraftState>({});
    const [m_error, setError] = useState<string | null>(null);
    const [m_success, setSuccess] = useState<string | null>(null);
    const [m_savingUserId, setSavingUserId] = useState<string | null>(null);

    useEffect(() =>
    {
        void Load();
    }, []);

    async function Load()
    {
        setError(null);

        try
        {
            const currentUser = await apiClient.GetCurrentUser();
            setCurrentUser(currentUser);

            if (!currentUser.isAdmin)
            {
                setData(null);
                return;
            }

            const data = await apiClient.GetUsersPage();
            setData(data);
            setDrafts(createDrafts(data.users));
        }
        catch (error)
        {
            setError(error instanceof Error ? error.message : "Failed to load settings.");
        }
    }

    function UpdateDraft(userId: string, value: Partial<UpdateUserRequest>)
    {
        setDrafts((state) => ({
            ...state,
            [userId]: {
                ...state[userId],
                ...value,
            },
        }));
    }

    async function SaveUser(userId: string)
    {
        const draft = m_drafts[userId];

        if (!draft)
        {
            return;
        }

        setSavingUserId(userId);
        setError(null);
        setSuccess(null);

        try
        {
            const updated = await apiClient.UpdateUser(userId, {
                displayName: draft.displayName,
                email: draft.email || null,
                isActive: draft.isActive,
                isAdmin: draft.isAdmin,
            });

            setData((state) => state == null
                ? state
                : {
                    users: state.users.map((user) => user.id === updated.id ? updated : user),
                });

            setDrafts((state) => ({
                ...state,
                [updated.id]: {
                    displayName: updated.displayName,
                    email: updated.email ?? "",
                    isActive: updated.isActive,
                    isAdmin: updated.isAdmin,
                },
            }));

            setSuccess(`Saved ${updated.displayName}.`);
        }
        catch (error)
        {
            setError(error instanceof Error ? error.message : "Failed to update user.");
        }
        finally
        {
            setSavingUserId(null);
        }
    }

    if (m_currentUser && !m_currentUser.isAdmin)
    {
        return (
            <main className="mx-auto w-full max-w-[1600px] px-6 py-6">
                <h1 className="text-2xl font-semibold tracking-tight">
                    Settings
                </h1>
                <div className="mt-6 rounded-xl border bg-card p-6 text-sm text-muted-foreground">
                    Admin access is required to manage users.
                </div>
            </main>
        );
    }

    return (
        <main className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 px-6 py-6">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight">
                    Settings
                </h1>
                <p className="text-sm text-muted-foreground">
                    Admin user management for Meshboard.
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
                <h2 className="mb-4 text-lg font-semibold">
                    Users
                </h2>

                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Username</TableHead>
                            <TableHead>Display name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Active</TableHead>
                            <TableHead>Admin</TableHead>
                            <TableHead>Last login</TableHead>
                            <TableHead className="w-[120px]">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {(m_data?.users ?? []).map((user) => {
                            const draft = m_drafts[user.id];

                            return (
                                <TableRow key={user.id}>
                                    <TableCell className="font-medium">
                                        @{user.username}
                                    </TableCell>
                                    <TableCell>
                                        <Input
                                            value={draft?.displayName ?? ""}
                                            onChange={(event) => UpdateDraft(user.id, {
                                                displayName: event.target.value,
                                            })}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Input
                                            value={draft?.email ?? ""}
                                            onChange={(event) => UpdateDraft(user.id, {
                                                email: event.target.value,
                                            })}
                                            placeholder="you@example.com"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Switch
                                            checked={draft?.isActive ?? false}
                                            onCheckedChange={(checked) => UpdateDraft(user.id, {
                                                isActive: checked,
                                            })}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Switch
                                            checked={draft?.isAdmin ?? false}
                                            onCheckedChange={(checked) => UpdateDraft(user.id, {
                                                isAdmin: checked,
                                            })}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-sm text-muted-foreground">
                                            {user.lastLoginAtUtc
                                                ? new Date(user.lastLoginAtUtc).toLocaleString()
                                                : "Never"}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <Button
                                            type="button"
                                            onClick={() => void SaveUser(user.id)}
                                            disabled={m_savingUserId === user.id}
                                        >
                                            {m_savingUserId === user.id ? "Saving..." : "Save"}
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </section>
        </main>
    );
}