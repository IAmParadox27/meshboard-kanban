using Meshboard.Core.Issues;
using Meshboard.Core.Sources;

namespace Meshboard.Plugin.Sources
{
    public interface IDirectIssueDetailsSourcePlugin
    {
        Task<ExternalIssueDetails?> GetIssueDetailsAsync(
            SourceDefinitionModel source,
            string externalId,
            CancellationToken cancellationToken = default);
    }
}