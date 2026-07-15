namespace Meshboard.Plugin.Fider
{
    public class FiderSourceConfig
    {
        public string BaseUrl { get; set; } = string.Empty;
        
        public string? ApiKey { get; set; }
        
        public Dictionary<string, string> ColumnMappings { get; set; } = new();
    }
}