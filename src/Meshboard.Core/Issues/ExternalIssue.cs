namespace Meshboard.Core.Issues
{
    public class ExternalIssue
    {
        public required string ExternalId { get; set; }

        public required string IssueNumber { get; set; }

        public required string SourceKey { get; set; }

        public required string Title { get; set; }

        public string? Description { get; set; }

        public string Status { get; set; } = "open";

        public string? Url { get; set; }

        public ExternalIssueActor? Assignee { get; set; }

        public ExternalIssueActor? Reporter { get; set; }

        public string? SourceColumn { get; set; }

        public string? BoardColumnId { get; set; }

        public DateTimeOffset? UpdatedAt { get; set; }

        public DateTimeOffset? CreatedAt { get; set; }

        public IReadOnlyList<string> Labels { get; set; } = [];
    }
}