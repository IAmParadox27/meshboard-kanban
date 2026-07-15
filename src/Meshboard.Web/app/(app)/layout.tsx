import { AppHeader } from "@/components/layout/app-header";

export default function AppLayout(
    {
        children,
    }: Readonly<{
        children: React.ReactNode;
    }>,
)
{
    return (
        <div className="flex h-screen flex-col overflow-hidden bg-muted/30">
            <AppHeader />
            <div className="min-h-0 flex-1">
                {children}
            </div>
        </div>
    );
}