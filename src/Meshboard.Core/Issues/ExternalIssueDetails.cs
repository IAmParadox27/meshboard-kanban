namespace Meshboard.Core.Issues
{
    public class ExternalIssueDetails
    {
        public required ExternalIssue Issue { get; set; }

        public IReadOnlyList<ExternalIssueComment> Comments { get; set; } = [];

        public IReadOnlyList<ExternalIssueActivityEntry> Activity { get; set; } = [];
    }

    public class ExternalIssueComment
    {
        public required string Id { get; set; }

        public string Kind { get; set; } = "comment";

        public ExternalIssueActor? Author { get; set; }

        public string Body { get; set; } = string.Empty;

        public DateTimeOffset? CreatedAt { get; set; }

        public DateTimeOffset? UpdatedAt { get; set; }
    }

    public class ExternalIssueActivityEntry
    {
        public required string Id { get; set; }

        public string Type { get; set; } = "event";

        public string Description { get; set; } = string.Empty;

        public DateTimeOffset? CreatedAt { get; set; }

        public ExternalIssueActor? Actor { get; set; }
    }

    public class ExternalIssueActor
    {
        public required string Name { get; set; }

        public string? Username { get; set; }

        public string? ExternalUserId { get; set; }

        public string? ExternalUsername { get; set; }

        public string? ExternalDisplayName { get; set; }

        public Guid? MeshboardUserId { get; set; }

        public string? MeshboardUsername { get; set; }

        public string? MeshboardDisplayName { get; set; }
    }
}