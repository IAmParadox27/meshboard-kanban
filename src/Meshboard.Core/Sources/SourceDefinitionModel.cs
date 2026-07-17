namespace Meshboard.Core.Sources
{
    public class SourceDefinitionModel
    {
        public required Guid Id { get; set; }

        public required string Name { get; set; }

        public required string ProviderKey { get; set; }

        public required bool Enabled { get; set; }

        public required Dictionary<string, string> Config { get; set; }

        public SourceCapabilitiesModel Capabilities { get; set; } = new SourceCapabilitiesModel();

        public required DateTimeOffset CreatedAt { get; set; }

        public required DateTimeOffset UpdatedAt { get; set; }
    }
}