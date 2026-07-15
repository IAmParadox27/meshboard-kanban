namespace Meshboard.Plugin.GitHub
{
    public class GitHubSourceConfig
    {
        public string Owner { get; set; } = string.Empty;
       
        public string Repository { get; set; } = string.Empty;
        
        public string? Token { get; set; }
        
        public string State { get; set; } = "open";
        
        public Dictionary<string, string> ColumnMappings { get; set; } = new();
    }
}