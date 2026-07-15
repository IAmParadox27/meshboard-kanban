"use client";

import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { SourceSummaryModel } from "@/lib/models/source";
import { apiClient } from "@/lib/api/api-client";

type SourcesState = {
    sources: SourceSummaryModel[];
    isLoading: boolean;
    error: string | null;
};

function GetStatusVariant(status: SourceSummaryModel["status"]): "secondary" | "outline" | "destructive"
{
    switch (status)
    {
        case "healthy":
            return "secondary";

        case "warning":
            return "outline";

        case "error":
            return "destructive";

        case "disabled":
            return "outline";

        default:
            return "outline";
    }
}

function FormatLastSync(lastSyncAt?: string | null): string
{
    if (!lastSyncAt)
    {
        return "Never";
    }

    const parsed = new Date(lastSyncAt);

    if (Number.isNaN(parsed.getTime()))
    {
        return lastSyncAt;
    }

    return parsed.toLocaleString();
}

export function SourcesView() {
    const [m_state, setState] = useState<SourcesState>({
        sources: [],
        isLoading: true,
        error: null,
    });

    async function LoadSources()
    {
        setState((current) => ({
            ...current,
            isLoading: true,
            error: null,
        }));

        try
        {
            const sources = await apiClient.GetSources();

            setState({
                sources,
                isLoading: false,
                error: null,
            });
        }
        catch (error)
        {
            setState({
                sources: [],
                isLoading: false,
                error: error instanceof Error
                    ? error.message
                    : "Failed to load sources.",
            });
        }
    }

    useEffect(() => {
        void LoadSources();
    }, []);

    if (m_state.isLoading) {
        return (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {Array.from({length: 3}).map((_, index) => (
                    <Card key={index}>
                        <CardHeader className="space-y-3">
                            <div className="h-5 w-32 animate-pulse rounded bg-muted"/>
                            <div className="h-4 w-full animate-pulse rounded bg-muted"/>
                        </CardHeader>

                        <CardContent className="space-y-3">
                            {Array.from({length: 5}).map((__, rowIndex) => (
                                <div key={rowIndex} className="flex justify-between gap-3">
                                    <div className="h-4 w-20 animate-pulse rounded bg-muted"/>
                                    <div className="h-4 w-24 animate-pulse rounded bg-muted"/>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    if (m_state.error) {
        return (
            <Card className="border-destructive/30">
                <CardHeader>
                    <CardTitle>
                        Unable to load sources
                    </CardTitle>

                    <CardDescription>
                        {m_state.error}
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <Button onClick={() => void LoadSources()}>
                        Retry
                    </Button></CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Total sources</CardDescription>
                        <CardTitle className="text-2xl">
                            {m_state.sources.length}
                        </CardTitle>
                    </CardHeader>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Healthy</CardDescription>
                        <CardTitle className="text-2xl">
                            {m_state.sources.filter((x) => x.status == "healthy").length}
                        </CardTitle>
                    </CardHeader>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Needs attention</CardDescription>
                        <CardTitle className="text-2xl">
                            {m_state.sources.filter((x) => x.status != "healthy").length}
                        </CardTitle>
                    </CardHeader>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {m_state.sources.map((source) => (
                    <Card key={source.id}>
                        <CardHeader>
                            <div className="flex items-start justify-between gap-3">
                                <div className="space-y-1">
                                    <CardTitle>
                                        {source.name}
                                    </CardTitle>

                                    <CardDescription>
                                        {source.description}
                                    </CardDescription></div>

                                <Badge variant={GetStatusVariant(source.status)}>
                                    {source.status}
                                </Badge>
                            </div>
                        </CardHeader>

                        <CardContent className="space-y-3 text-sm">
                            <div className="flex justify-between gap-3">
                                <span className="text-muted-foreground">Kind</span>
                                <span>{source.kind}</span>
                            </div>

                            <div className="flex justify-between gap-3">
                                <span className="text-muted-foreground">Mode</span>
                                <span>{source.proxyMode}</span>
                            </div>

                            <div className="flex justify-between gap-3">
                                <span className="text-muted-foreground">Enabled</span>
                                <span>{source.enabled ? "Yes" : "No"}</span>
                            </div>

                            <div className="flex justify-between gap-3">
                                <span className="text-muted-foreground">Linked items</span>
                                <span>{source.linkedItemsCount}</span>
                            </div>

                            <div className="flex justify-between gap-3">
                                <span className="text-muted-foreground">Last sync</span>
                                <span className="text-right">{FormatLastSync(source.lastSyncAt)}</span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}