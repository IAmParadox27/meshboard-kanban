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
        public string Title { get; set; } = string.Empty;

        [JsonPropertyName("body")]
        public string? Body { get; set; }

        [JsonPropertyName("state")]
        public string State { get; set; } = string.Empty;

        [JsonPropertyName("html_url")]
        public string? HtmlUrl { get; set; }

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
        public GitHubPullRequestMarkerResponse? PullRequest { get; set; }
    }

    public class GitHubUserResponse
    {
        [JsonPropertyName("login")]
        public string Login { get; set; } = string.Empty;
    }

    public class GitHubLabelResponse
    {
        [JsonPropertyName("name")]
        public string Name { get; set; } = string.Empty;
    }

    public class GitHubPullRequestMarkerResponse
    {
    }
}