export type SourceConfigurationFieldModel = {
    key: string;
    label: string;
    type: string;
    required: boolean;
    placeholder?: string | null;
    helpText?: string | null;
};

export type SourceProviderDefinitionModel = {
    providerKey: string;
    displayName: string;
    configurationFields: SourceConfigurationFieldModel[];
};

export type SourceDefinitionModel = {
    id: string;
    name: string;
    providerKey: string;
    enabled: boolean;
    config: Record<string, string>;
    createdAt: string;
    updatedAt: string;
};

export type SourcesPageModel = {
    providers: SourceProviderDefinitionModel[];
    sources: SourceDefinitionModel[];
};

export type UpsertSourceDefinitionRequest = {
    name: string;
    providerKey: string;
    enabled: boolean;
    config: Record<string, string>;
};