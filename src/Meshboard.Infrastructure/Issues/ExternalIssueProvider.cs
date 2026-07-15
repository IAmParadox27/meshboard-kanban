using Meshboard.Core.Extensions;
using Meshboard.Core.Issues;
using Meshboard.Core.Sources;
using Meshboard.Plugin.Sources;

namespace Meshboard.Infrastructure.Issues
{
    public class ExternalIssueProvider : IExternalIssueProvider
    {
        private readonly IReadOnlyDictionary<string, IIssueSourcePlugin> m_plugins;
        private readonly ISourceProvider m_sourceProvider;

        public ExternalIssueProvider(IServiceProvider serviceProvider, ISourceProvider sourceProvider)
        {
            IIssueSourcePlugin[] plugins = serviceProvider.GetPluginServices<IIssueSourcePlugin>().ToArray();
            m_plugins = plugins.ToDictionary(x => x.SourceKey, StringComparer.OrdinalIgnoreCase);
            m_sourceProvider = sourceProvider;
        }

        public async Task<IReadOnlyList<ExternalIssue>> GetIssuesAsync(
            CancellationToken cancellationToken = default)
        {
            IReadOnlyList<SourceDefinitionModel> sources = await m_sourceProvider.GetAllAsync(cancellationToken);

            List<ExternalIssue> issues = new List<ExternalIssue>();

            foreach (SourceDefinitionModel source in sources.Where(x => x.Enabled))
            {
                if (!m_plugins.TryGetValue(source.ProviderKey, out IIssueSourcePlugin? plugin))
                {
                    continue;
                }

                IReadOnlyList<ExternalIssue> sourceIssues = await plugin.GetIssuesAsync(source, cancellationToken);
                issues.AddRange(sourceIssues);
            }

            return issues;
        }
    }
}