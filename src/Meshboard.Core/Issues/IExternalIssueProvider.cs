namespace Meshboard.Core.Issues
{
    public interface IExternalIssueProvider
    {
        Task<IReadOnlyList<ExternalIssue>> GetIssuesAsync(
            CancellationToken cancellationToken = default);
        
        Task<ExternalIssueDetails?> GetIssueDetailsAsync(
            Guid sourceId,
            string externalId,
            CancellationToken cancellationToken = default);
    }
}