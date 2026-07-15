namespace Meshboard.Core.Sources
{
    public class SourcesPageModel
    {
        public required IReadOnlyList<SourceProviderDefinition> Providers { get; set; }
        public required IReadOnlyList<SourceDefinitionModel> Sources { get; set; }
    }
}