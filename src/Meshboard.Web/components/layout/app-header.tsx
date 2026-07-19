"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { apiClient } from "@/lib/api/api-client";
import { CurrentUserModel } from "@/lib/models/users-models";

type AppHeaderProps = {
    title?: string;
};

function getInitials(user: CurrentUserModel | null): string
{
    if (!user)
    {
        return "?";
    }

    const value = (user.displayName || user.username).trim();

    if (!value)
    {
        return "?";
    }

    const parts = value
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2);

    return parts
        .map((x) => x[0]?.toUpperCase() ?? "")
        .join("") || value[0]!.toUpperCase();
}

export function AppHeader(
    {
        title = "Meshboard",
    }: AppHeaderProps,
)
{
    const router = useRouter();

    const [m_currentUser, setCurrentUser] = useState<CurrentUserModel | null>(null);
    const [m_isSigningOut, setIsSigningOut] = useState(false);

    useEffect(() =>
    {
        void LoadCurrentUser();
    }, []);

    const navigationItems = useMemo(() =>
    {
        const items = [
            {
                href: "/boards",
                label: "Boards",
            },
        ];

        if (m_currentUser)
        {
            items.push({
                href: "/sources",
                label: "Sources",
            });
        }

        if (m_currentUser?.isAdmin)
        {
            items.push({
                href: "/settings",
                label: "Settings",
            });
        }

        return items;
    }, [m_currentUser]);

    async function LoadCurrentUser()
    {
        try
        {
            const currentUser = await apiClient.GetCurrentUser();
            setCurrentUser(currentUser);
        }
        catch
        {
            setCurrentUser(null);
        }
    }

    async function SignOut()
    {
        setIsSigningOut(true);

        try
        {
            await apiClient.SignOut();
            router.push("/login");
            router.refresh();
        }
        finally
        {
            setIsSigningOut(false);
        }
    }

    return (
        <header className="border-b bg-background">
            <div className="mx-auto flex w-full max-w-[1600px] items-center gap-4 px-6 py-4">
                <div className="flex min-w-0 items-center gap-6">
                    <Link
                        href="/boards"
                        className="shrink-0 text-lg font-semibold tracking-tight"
                    >
                        {title}
                    </Link>

                    <nav className="hidden items-center gap-2 md:flex">
                        {navigationItems.map((item) => (
                            <Button
                                key={item.href}
                                asChild
                                variant="ghost"
                                className="text-sm text-muted-foreground hover:text-foreground"
                            >
                                <Link href={item.href}>
                                    {item.label}
                                </Link>
                            </Button>
                        ))}
                    </nav>
                </div>

                <div className="ml-auto flex items-center gap-3">
                    <div className="hidden w-72 lg:block">
                        <Input placeholder="Search cards, boards, or sources..." />
                    </div>

                    {m_currentUser ? (
                        <Button
                            variant="outline"
                            className="hidden sm:inline-flex"
                        >
                            New card
                        </Button>
                    ) : null}

                    <ThemeToggle />

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                className="h-auto rounded-full p-0"
                            >
                                <Avatar className="h-9 w-9">
                                    <AvatarFallback>
                                        {getInitials(m_currentUser)}
                                    </AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end" className="w-64">
                            {m_currentUser ? (
                                <>
                                    <div className="px-2 py-1.5">
                                        <div className="text-sm font-medium">
                                            {m_currentUser.displayName}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            @{m_currentUser.username}
                                        </div>
                                        {m_currentUser.email ? (
                                            <div className="text-xs text-muted-foreground">
                                                {m_currentUser.email}
                                            </div>
                                        ) : null}
                                    </div>

                                    <DropdownMenuSeparator />

                                    <DropdownMenuItem asChild>
                                        <Link href="/profile">
                                            Profile
                                        </Link>
                                    </DropdownMenuItem>

                                    {m_currentUser.isAdmin ? (
                                        <DropdownMenuItem asChild>
                                            <Link href="/settings">
                                                Settings
                                            </Link>
                                        </DropdownMenuItem>
                                    ) : null}

                                    <DropdownMenuSeparator />

                                    <DropdownMenuItem
                                        onClick={() => void SignOut()}
                                        disabled={m_isSigningOut}
                                    >
                                        {m_isSigningOut ? "Signing out..." : "Sign out"}
                                    </DropdownMenuItem>
                                </>
                            ) : (
                                <DropdownMenuItem asChild>
                                    <Link href="/login">
                                        Sign in
                                    </Link>
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <div className="border-t px-6 py-3 md:hidden">
                <div className="mx-auto flex w-full max-w-[1600px] gap-2 overflow-x-auto">
                    {navigationItems.map((item) => (
                        <Button
                            key={item.href}
                            asChild
                            variant="ghost"
                            className="shrink-0"
                        >
                            <Link href={item.href}>
                                {item.label}
                            </Link>
                        </Button>
                    ))}
                </div>
            </div>
        </header>
    );
}