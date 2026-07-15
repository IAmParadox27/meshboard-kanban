namespace Meshboard.Core.Sources
{
    public class SourceSummary
    {
        public required string Id { get; set; }
        
        public required string Name { get; set; }
        
        public required string Kind { get; set; }
        
        public required bool Enabled { get; set; }
        
        public required string ProxyMode { get; set; }
        
        public required string Status { get; set; }
        
        public DateTimeOffset? LastSyncAt { get; set; }
        
        public int LinkedItemsCount { get; set; }
        
        public string? Description { get; set; }
    }
}