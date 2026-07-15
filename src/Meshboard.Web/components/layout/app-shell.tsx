import { ReactNode } from "react";

import { AppHeader } from "./app-header";

type AppShellProps = {
    children: ReactNode;
};

export function AppShell(
    {
        children,
    }: AppShellProps,
)
{
    return (
        <div className="min-h-screen bg-muted/30">
            <AppHeader />
            {children}
        </div>
    );
}