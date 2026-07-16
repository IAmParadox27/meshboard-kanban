using System.Text.Json.Nodes;
using System.Text.Json.Serialization;

namespace Meshboard.Plugin.GitHub
{
    public class GitHubProjectResponse
    {
        [JsonPropertyName("id")]
        public long Id { get; set; }

        [JsonPropertyName("content")]
        public GitHubIssueResponse? Issue { get; set; }

        [JsonPropertyName("requested_reviewers")]
        public List<GitHubUserResponse> RequestedReviewers { get; set; } = new();

        [JsonPropertyName("creator")]
        public GitHubUserResponse Creator { get; set; } = new();

        [JsonPropertyName("item_url")]
        public string? ItemUrl { get; set; }

        [JsonPropertyName("fields")]
        public List<GitHubFieldResponse> Fields { get; set; } = new();
    }

    public class GitHubFieldResponse
    {
        [JsonPropertyName("id")]
        public long Id { get; set; }

        [JsonPropertyName("data_type")]
        public string DataType { get; set; } = string.Empty;

        [JsonPropertyName("name")]
        public string Name { get; set; } = string.Empty;

        [JsonPropertyName("value")]
        public JsonNode? Value { get; set; }
    }

    public class GitHubFieldSingleSelectResponse
    {
        [JsonPropertyName("id")]
        public string Id { get; set; } = string.Empty;

        [JsonPropertyName("name")]
        public GitHubFieldSingleSelectValueResponse? Name { get; set; }

        [JsonPropertyName("color")]
        public string Color { get; set; } = string.Empty;

        [JsonPropertyName("description")]
        public GitHubFieldSingleSelectValueResponse? Description { get; set; }
    }

    public class GitHubFieldSingleSelectValueResponse
    {
        [JsonPropertyName("raw")]
        public string Raw { get; set; } = string.Empty;

        [JsonPropertyName("html")]
        public string Html { get; set; } = string.Empty;
    }

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

        [JsonPropertyName("comments_url")]
        public string? CommentsUrl { get; set; }

        [JsonPropertyName("comments")]
        public int CommentsCount { get; set; }

        [JsonPropertyName("created_at")]
        public DateTimeOffset CreatedAt { get; set; }

        [JsonPropertyName("updated_at")]
        public DateTimeOffset UpdatedAt { get; set; }

        [JsonPropertyName("closed_at")]
        public DateTimeOffset? ClosedAt { get; set; }

        [JsonPropertyName("user")]
        public GitHubUserResponse? User { get; set; }

        [JsonPropertyName("assignee")]
        public GitHubUserResponse? Assignee { get; set; }

        [JsonPropertyName("labels")]
        public List<GitHubLabelResponse> Labels { get; set; } = [];

        [JsonPropertyName("pull_request")]
        public GitHubPullRequestMarkerResponse? PullRequest { get; set; }
    }

    public class GitHubIssueCommentResponse
    {
        [JsonPropertyName("id")]
        public long Id { get; set; }

        [JsonPropertyName("body")]
        public string? Body { get; set; }

        [JsonPropertyName("created_at")]
        public DateTimeOffset CreatedAt { get; set; }

        [JsonPropertyName("updated_at")]
        public DateTimeOffset UpdatedAt { get; set; }

        [JsonPropertyName("html_url")]
        public string? HtmlUrl { get; set; }

        [JsonPropertyName("user")]
        public GitHubUserResponse? User { get; set; }
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