using System.Text.Json.Serialization;

namespace Meshboard.Plugin.GitHub
{
    public class GitHubIssueResponse
    {
        [JsonPropertyName("id")]
        public long Id { get; set; }

        [JsonPropertyName("number")]
        public int Number { get; set; }

        [JsonPropertyName("title")]
        public string Title { get; set; } = null!;

        [JsonPropertyName("body")]
        public string? Body { get; set; }

        [JsonPropertyName("html_url")]
        public string HtmlUrl { get; set; } = null!;

        [JsonPropertyName("state")]
        public string State { get; set; } = null!;

        [JsonPropertyName("created_at")]
        public DateTimeOffset CreatedAt { get; set; }

        [JsonPropertyName("updated_at")]
        public DateTimeOffset UpdatedAt { get; set; }

        [JsonPropertyName("user")]
        public GitHubUserResponse? User { get; set; }

        [JsonPropertyName("assignee")]
        public GitHubUserResponse? Assignee { get; set; }

        [JsonPropertyName("labels")]
        public List<GitHubLabelResponse> Labels { get; set; } = [];

        [JsonPropertyName("pull_request")]
        public object? PullRequest { get; set; }
    }

    public class GitHubUserResponse
    {
        [JsonPropertyName("login")]
        public string Login { get; set; } = null!;
    }

    public class GitHubLabelResponse
    {
        [JsonPropertyName("name")]
        public string Name { get; set; } = null!;
    }
}