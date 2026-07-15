namespace Meshboard.Core.Sources
{
    public class UpsertSourceDefinitionRequest
    {
        public required string Name { get; set; }
        
        public required string ProviderKey { get; set; }
        
        public bool Enabled { get; set; } = true;
        
        public required Dictionary<string, string> Config { get; set; }
    }
}