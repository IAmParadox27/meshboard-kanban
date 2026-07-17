namespace Meshboard.Core.Sources
{
    public class SourceProviderDefinition
    {
        public required string ProviderKey { get; set; }
        
        public required string DisplayName { get; set; }
        
        public required IReadOnlyList<SourceConfigurationField> ConfigurationFields { get; set; }
        
        public SourceCapabilitiesModel Capabilities { get; set; } = new SourceCapabilitiesModel();
    }

    public class SourceConfigurationField
    {
        public required string Key { get; set; }
        
        public required string Label { get; set; }
        
        public required string Type { get; set; }
        
        public required bool Required { get; set; }
        
        public string? Placeholder { get; set; }
        
        public string? HelpText { get; set; }
    }
}