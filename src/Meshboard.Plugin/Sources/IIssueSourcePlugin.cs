using Meshboard.Core.Issues;
using Meshboard.Core.Sources;

namespace Meshboard.Plugin.Sources
{
    public interface IIssueSourcePlugin
    {
        string SourceKey { get; }

        string DisplayName { get; }

        SourceProviderDefinition GetDefinition();

        Task<IReadOnlyList<ExternalIssue>> GetIssuesAsync(
            SourceDefinitionModel source,
            CancellationToken cancellationToken = default);
    }
}