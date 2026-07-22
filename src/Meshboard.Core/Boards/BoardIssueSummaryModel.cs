using Meshboard.Core.Issues;

namespace Meshboard.Core.Boards
{
    public class BoardIssueSummaryModel
    {
        public required string ExternalId { get; set; }
        
        public required string DetailsLookupKey { get; set; }
        
        public required string IssueNumber { get; set; }

        public required string SourceKey { get; set; }

        public string? SourceName { get; set; }

        public required string Title { get; set; }

        public string? DescriptionPreview { get; set; }

        public string Status { get; set; } = "open";

        public string? Url { get; set; }

        public ExternalIssueActor? Assignee { get; set; }

        public string? SourceColumn { get; set; }

        public string? BoardColumnId { get; set; }

        public DateTimeOffset? UpdatedAt { get; set; }

        public DateTimeOffset? CreatedAt { get; set; }

        public IReadOnlyList<string> Labels { get; set; } = [];
    }
}