namespace Meshboard.Core.Boards
{
    public class BoardIssueAssignmentRequest
    {
        public Guid SourceId { get; set; }

        public string ExternalId { get; set; } = string.Empty;
    }
}