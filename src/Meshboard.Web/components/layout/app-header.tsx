import Link from "next/link";

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

type AppHeaderProps = {
    title?: string;
};

const navigationItems = [
    {
        href: "/boards",
        label: "Board",
    },
    {
        href: "/sources",
        label: "Sources",
    },
    {
        href: "/settings",
        label: "Settings",
    },
];

export function AppHeader(
    {
        title = "Meshboard",
    }: AppHeaderProps,
)
{
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
                    <div className="hidden w-72 lg:block"><Input placeholder="Search cards, boards, or sources..." />
                    </div>

                    <Button
                        variant="outline"
                        className="hidden sm:inline-flex"
                    >
                        New card
                    </Button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                className="h-auto rounded-full p-0"
                            >
                                <Avatar className="h-9 w-9">
                                    <AvatarFallback>
                                        Z
                                    </AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem asChild>
                                <Link href="/profile">
                                    Profile
                                </Link>
                            </DropdownMenuItem>

                            <DropdownMenuItem asChild>
                                <Link href="/settings">
                                    Settings
                                </Link>
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            <DropdownMenuItem>
                                Sign out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <div className="border-t px-6 py-3 md:hidden">
                <div className="mx-auto flex w-full max-w-[1600px] gap-2 overflow-x-auto">{navigationItems.map((item) => (
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