using Meshboard.Core.Issues;
using Meshboard.Core.Sources;

namespace Meshboard.Plugin.Sources
{
    public interface IIssueSourcePlugin
    {
        string SourceKey { get; }

        Task<IReadOnlyList<ExternalIssue>> GetIssuesAsync(
            CancellationToken cancellationToken = default);
    }
}