import { SourcesView } from "@/components/sources/sources-view";

export default function SourcesPage()
{
    return (
        <main className="mx-auto w-full max-w-[1600px] px-6 py-6">
            <div className="mb-6">
                <h1 className="text-2xl font-semibold tracking-tight">
                    Sources
                </h1>

                <p className="text-sm text-muted-foreground">
                    Connected systems and their current sync state.
                </p>
            </div>

            <SourcesView />
        </main>
    );
}