using System.Text.Json.Serialization;

namespace Meshboard.Plugin.GitHub
{
    public class GitHubRepositoryResponse
    {
        [JsonPropertyName("description")]
        public string? Description { get; set; }

        [JsonPropertyName("open_issues_count")]
        public int OpenIssuesCount { get; set; }
    }
}