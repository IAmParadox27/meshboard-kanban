using Meshboard.Core.Extensions;
using Meshboard.Core.Issues;
using Meshboard.Plugin.Sources;

namespace Meshboard.Infrastructure.Issues
{
    public class ExternalIssueProvider : IExternalIssueProvider
    {
        private readonly IReadOnlyCollection<IIssueSourcePlugin> m_plugins;

        public ExternalIssueProvider(IServiceProvider serviceProvider)
        {
            m_plugins = serviceProvider.GetPluginServices<IIssueSourcePlugin>().ToArray();
        }

        public async Task<IReadOnlyList<ExternalIssue>> GetIssuesAsync(
            CancellationToken cancellationToken = default)
        {
            List<ExternalIssue> issues = new List<ExternalIssue>();

            foreach (IIssueSourcePlugin plugin in m_plugins)
            {
                IReadOnlyList<ExternalIssue> pluginIssues = await plugin.GetIssuesAsync(cancellationToken);
                issues.AddRange(pluginIssues);
            }

            return issues;
        }
    }
}