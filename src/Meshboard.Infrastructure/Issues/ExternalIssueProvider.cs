using Meshboard.Core.Auth;
using Meshboard.Core.Domain;
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
        private readonly IUserSourceMappingProvider m_userSourceMappingProvider;

        public ExternalIssueProvider(
            IServiceProvider serviceProvider,
            ISourceProvider sourceProvider,
            IUserSourceMappingProvider userSourceMappingProvider)
        {
            IIssueSourcePlugin[] plugins = serviceProvider.GetPluginServices<IIssueSourcePlugin>().ToArray();
            m_plugins = plugins.ToDictionary(x => x.SourceKey, StringComparer.OrdinalIgnoreCase);
            m_sourceProvider = sourceProvider;
            m_userSourceMappingProvider = userSourceMappingProvider;
        }

        public async Task<IReadOnlyList<ExternalIssue>> GetIssuesAsync(
            CancellationToken cancellationToken = default)
        {
            IReadOnlyList<SourceDefinitionModel> sources = await m_sourceProvider.GetAllAsync(cancellationToken);

            List<ExternalIssue> issues = [];

            foreach (SourceDefinitionModel source in sources.Where(x => x.Enabled))
            {
                if (!m_plugins.TryGetValue(source.ProviderKey, out IIssueSourcePlugin? plugin))
                {
                    continue;
                }

                IReadOnlyList<ExternalIssue> sourceIssues = await plugin.GetIssuesAsync(source, cancellationToken);
                issues.AddRange(sourceIssues);
            }

            return await ResolveIssuesAsync(issues, cancellationToken);
        }

        public async Task<ExternalIssueDetails?> GetIssueDetailsAsync(
            Guid sourceId,
            string externalId,
            CancellationToken cancellationToken = default)
        {
            SourceDefinitionModel? source = await m_sourceProvider.GetByIdAsync(sourceId, cancellationToken);

            if (source == null || !source.Enabled)
            {
                return null;
            }

            if (!m_plugins.TryGetValue(source.ProviderKey, out IIssueSourcePlugin? plugin))
            {
                return null;
            }

            IReadOnlyList<ExternalIssue> sourceIssues = await plugin.GetIssuesAsync(source, cancellationToken);
            IReadOnlyList<ExternalIssue> resolvedSourceIssues = await ResolveIssuesAsync(sourceIssues, cancellationToken);

            ExternalIssue? issue = resolvedSourceIssues.FirstOrDefault(
                x => string.Equals(x.ExternalId, externalId, StringComparison.OrdinalIgnoreCase));

            if (issue == null)
            {
                return null;
            }

            ExternalIssueDetails? details = await plugin.GetIssueDetailsAsync(source, issue, cancellationToken);
            return await ResolveDetailsAsync(details, cancellationToken);
        }

        private async Task<IReadOnlyList<ExternalIssue>> ResolveIssuesAsync(
            IReadOnlyList<ExternalIssue> issues,
            CancellationToken cancellationToken)
        {
            if (issues.Count == 0)
            {
                return issues;
            }

            IReadOnlyDictionary<Guid, SourceActorMappingLookup> lookupBySourceId =
                await BuildLookupBySourceIdAsync(
                    issues
                        .Select(x => TryParseSourceId(x.SourceKey))
                        .Where(x => x != null)
                        .Select(x => x!.Value)
                        .Distinct()
                        .ToArray(),
                    cancellationToken);

            return issues
                .Select(issue => ResolveIssue(issue, lookupBySourceId))
                .ToArray();
        }

        private async Task<ExternalIssueDetails?> ResolveDetailsAsync(
            ExternalIssueDetails? details,
            CancellationToken cancellationToken)
        {
            if (details == null)
            {
                return null;
            }

            Guid? sourceId = TryParseSourceId(details.Issue.SourceKey);

            if (sourceId == null)
            {
                return details;
            }

            IReadOnlyDictionary<Guid, SourceActorMappingLookup> lookupBySourceId =
                await BuildLookupBySourceIdAsync([sourceId.Value], cancellationToken);

            return new ExternalIssueDetails
            {
                Issue = ResolveIssue(details.Issue, lookupBySourceId),
                Comments = details.Comments
                    .Select(comment => ResolveComment(sourceId.Value, comment, lookupBySourceId))
                    .ToArray(),
                Activity = details.Activity
                    .Select(entry => ResolveActivity(sourceId.Value, entry, lookupBySourceId))
                    .ToArray(),
            };
        }

        private async Task<IReadOnlyDictionary<Guid, SourceActorMappingLookup>> BuildLookupBySourceIdAsync(
            IReadOnlyCollection<Guid> sourceIds,
            CancellationToken cancellationToken)
        {
            IReadOnlyList<UserSourceMapping> mappings = await m_userSourceMappingProvider.GetBySourceIdsAsync(
                sourceIds,
                cancellationToken);

            return mappings
                .GroupBy(x => x.SourceId)
                .ToDictionary(
                    x => x.Key,
                    x => new SourceActorMappingLookup(x));
        }

        private static ExternalIssue ResolveIssue(
            ExternalIssue issue,
            IReadOnlyDictionary<Guid, SourceActorMappingLookup> lookupBySourceId)
        {
            Guid? sourceId = TryParseSourceId(issue.SourceKey);

            if (sourceId == null)
            {
                return issue;
            }

            return new ExternalIssue
            {
                ExternalId = issue.ExternalId,
                IssueNumber = issue.IssueNumber,
                SourceKey = issue.SourceKey,
                Title = issue.Title,
                Description = issue.Description,
                Status = issue.Status,
                Url = issue.Url,
                Assignee = ResolveActor(sourceId.Value, issue.Assignee, lookupBySourceId),
                Reporter = ResolveActor(sourceId.Value, issue.Reporter, lookupBySourceId),
                SourceColumn = issue.SourceColumn,
                BoardColumnId = issue.BoardColumnId,
                UpdatedAt = issue.UpdatedAt,
                CreatedAt = issue.CreatedAt,
                Labels = issue.Labels,
            };
        }

        private static ExternalIssueComment ResolveComment(
            Guid sourceId,
            ExternalIssueComment comment,
            IReadOnlyDictionary<Guid, SourceActorMappingLookup> lookupBySourceId)
        {
            return new ExternalIssueComment
            {
                Id = comment.Id,
                Kind = comment.Kind,
                Author = ResolveActor(sourceId, comment.Author, lookupBySourceId),
                Body = comment.Body,
                CreatedAt = comment.CreatedAt,
                UpdatedAt = comment.UpdatedAt,
            };
        }

        private static ExternalIssueActivityEntry ResolveActivity(
            Guid sourceId,
            ExternalIssueActivityEntry entry,
            IReadOnlyDictionary<Guid, SourceActorMappingLookup> lookupBySourceId)
        {
            return new ExternalIssueActivityEntry
            {
                Id = entry.Id,
                Type = entry.Type,
                Description = entry.Description,
                CreatedAt = entry.CreatedAt,
                Actor = ResolveActor(sourceId, entry.Actor, lookupBySourceId),
            };
        }

        private static ExternalIssueActor? ResolveActor(
            Guid sourceId,
            ExternalIssueActor? actor,
            IReadOnlyDictionary<Guid, SourceActorMappingLookup> lookupBySourceId)
        {
            if (actor == null)
            {
                return null;
            }

            if (!lookupBySourceId.TryGetValue(sourceId, out SourceActorMappingLookup? lookup))
            {
                return actor;
            }

            UserSourceMapping? mapping = lookup.Find(actor);

            if (mapping == null)
            {
                return actor;
            }

            return new ExternalIssueActor
            {
                Name = mapping.User.Username,
                Username = mapping.User.Username,
                ExternalUserId = actor.ExternalUserId ?? mapping.ExternalUserId,
                ExternalUsername = actor.ExternalUsername ?? mapping.ExternalUsername,
                ExternalDisplayName = actor.ExternalDisplayName ?? mapping.ExternalDisplayName ?? actor.Name,
                MeshboardUserId = mapping.User.Id,
                MeshboardUsername = mapping.User.Username,
                MeshboardDisplayName = mapping.User.DisplayName,
            };
        }

        private static Guid? TryParseSourceId(string? value)
        {
            if (!Guid.TryParse(value, out Guid sourceId))
            {
                return null;
            }

            return sourceId;
        }

        private sealed class SourceActorMappingLookup
        {
            private readonly IReadOnlyDictionary<string, UserSourceMapping> m_byExternalUserId;
            private readonly IReadOnlyDictionary<string, UserSourceMapping> m_byExternalUsername;
            private readonly IReadOnlyDictionary<string, UserSourceMapping> m_byExternalDisplayName;

            public SourceActorMappingLookup(IEnumerable<UserSourceMapping> mappings)
            {
                m_byExternalUserId = mappings
                    .Where(x => !string.IsNullOrWhiteSpace(x.ExternalUserId))
                    .GroupBy(x => x.ExternalUserId, StringComparer.OrdinalIgnoreCase)
                    .ToDictionary(x => x.Key, x => x.First(), StringComparer.OrdinalIgnoreCase);

                m_byExternalUsername = mappings
                    .Where(x => !string.IsNullOrWhiteSpace(x.ExternalUsername))
                    .GroupBy(x => x.ExternalUsername!, StringComparer.OrdinalIgnoreCase)
                    .ToDictionary(x => x.Key, x => x.First(), StringComparer.OrdinalIgnoreCase);

                m_byExternalDisplayName = mappings
                    .Where(x => !string.IsNullOrWhiteSpace(x.ExternalDisplayName))
                    .GroupBy(x => x.ExternalDisplayName!, StringComparer.OrdinalIgnoreCase)
                    .ToDictionary(x => x.Key, x => x.First(), StringComparer.OrdinalIgnoreCase);
            }

            public UserSourceMapping? Find(ExternalIssueActor actor)
            {
                if (!string.IsNullOrWhiteSpace(actor.ExternalUserId)
                    && m_byExternalUserId.TryGetValue(actor.ExternalUserId, out UserSourceMapping? byExternalUserId))
                {
                    return byExternalUserId;
                }

                if (!string.IsNullOrWhiteSpace(actor.ExternalUsername)
                    && m_byExternalUsername.TryGetValue(actor.ExternalUsername, out UserSourceMapping? byExternalUsername))
                {
                    return byExternalUsername;
                }

                if (!string.IsNullOrWhiteSpace(actor.ExternalDisplayName)
                    && m_byExternalDisplayName.TryGetValue(actor.ExternalDisplayName, out UserSourceMapping? byExternalDisplayName))
                {
                    return byExternalDisplayName;
                }

                if (!string.IsNullOrWhiteSpace(actor.Username)
                    && m_byExternalUsername.TryGetValue(actor.Username, out UserSourceMapping? byUsername))
                {
                    return byUsername;
                }

                if (!string.IsNullOrWhiteSpace(actor.Name)
                    && m_byExternalDisplayName.TryGetValue(actor.Name, out UserSourceMapping? byName))
                {
                    return byName;
                }

                return null;
            }
        }
    }
}