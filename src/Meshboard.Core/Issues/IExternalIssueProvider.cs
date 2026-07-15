namespace Meshboard.Core.Issues
{
    public interface IExternalIssueProvider
    {
        Task<IReadOnlyList<ExternalIssue>> GetIssuesAsync(
            CancellationToken cancellationToken = default);
    }
}