export type SourceSummaryModel = {
    id: string;
    name: string;
    kind: "github" | "fider" | "internal" | string;
    enabled: boolean;
    proxyMode: "import-only" | "export-only" | "two-way" | string;
    status: "healthy" | "warning" | "error" | "disabled" | string;
    lastSyncAt?: string | null;
    linkedItemsCount: number;
    description?: string | null;
};