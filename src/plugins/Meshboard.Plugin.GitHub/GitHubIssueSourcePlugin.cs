using System.Net.Http.Headers;
using System.Net.Http.Json;
using Meshboard.Core.Issues;
using Meshboard.Core.Sources;
using Meshboard.Plugin.Sources;

namespace Meshboard.Plugin.GitHub
{
    public class GitHubIssueSourcePlugin : IIssueSourcePlugin
    {
        private readonly IHttpClientFactory m_httpClientFactory;

        public string SourceKey => "github";
        
        public string DisplayName => "GitHub";

        public GitHubIssueSourcePlugin(IHttpClientFactory httpClientFactory)
        {
            m_httpClientFactory = httpClientFactory;
        }
        
        private static GitHubSourceConfig GetConfig(SourceDefinitionModel source)
        {
            GitHubSourceConfig config = new GitHubSourceConfig
            {
                Owner = GetRequiredConfig(source, "owner"),
                Repository = GetRequiredConfig(source, "repository"),
                Token = GetOptionalConfig(source, "token"),
                State = GetOptionalConfig(source, "state") ?? "open",
                ColumnMappings = GetPrefixedConfig(source, "columnMappings."),
            };

            return config;
        }
        
        public SourceProviderDefinition GetDefinition()
        {
            return new SourceProviderDefinition
            {
                ProviderKey = SourceKey,
                DisplayName = DisplayName,
                ConfigurationFields =
                [
                    new SourceConfigurationField
                    {
                        Key = "owner",
                        Label = "Owner",
                        Type = "text",
                        Required = true,
                        Placeholder = "octocat",
                        HelpText = "GitHub user or organisation name."
                    },
                    new SourceConfigurationField
                    {
                        Key = "repository",
                        Label = "Repository",
                        Type = "text",
                        Required = true,
                        Placeholder = "hello-world",
                        HelpText = "Repository name."
                    },
                    new SourceConfigurationField
                    {
                        Key = "token",
                        Label = "Personal Access Token",
                        Type = "password",
                        Required = false,
                        Placeholder = "",
                        HelpText = "Optional for public repos. Needed for private repos or higher rate limits."
                    },
                    new SourceConfigurationField
                    {
                        Key = "state",
                        Label = "State",
                        Type = "text",
                        Required = false,
                        Placeholder = "open",
                        HelpText = "Optional. open, closed, or all. Defaults to open."
                    }
                ]
            };
        }

        public async Task<IReadOnlyList<ExternalIssue>> GetIssuesAsync(
            SourceDefinitionModel source,
            CancellationToken cancellationToken = default)
        {
            GitHubSourceConfig config = GetConfig(source);
            
            HttpClient client = m_httpClientFactory.CreateClient("GitHub");
            
            if (!string.IsNullOrWhiteSpace(config.Token))
            {
                client.DefaultRequestHeaders.Authorization =
                    new AuthenticationHeaderValue("Bearer", config.Token);
            }
            else
            {
                client.DefaultRequestHeaders.Authorization = null;
            }
            
            string requestPath =
                $"repos/{Uri.EscapeDataString(config.Owner)}/{Uri.EscapeDataString(config.Repository)}/issues?state={Uri.EscapeDataString(config.State)}&per_page=100";

            List<GitHubIssueResponse>? issues = null;

            try
            {
                issues = await client.GetFromJsonAsync<List<GitHubIssueResponse>>(
                    requestPath,
                    cancellationToken);
            }
            catch (HttpRequestException ex)
            {
            }

            if (issues == null)
            {
                return [];
            }
            
            return issues
                .Where(x => x.PullRequest == null)
                .Select(x => MapIssue(source, config, x))
                .ToArray();
        }
        
        private ExternalIssue MapIssue(SourceDefinitionModel source,
            GitHubSourceConfig config,
            GitHubIssueResponse issue)
        {
            string sourceColumn = MapStatus(issue.State);
            
            return new ExternalIssue
            {
                ExternalId = issue.Id.ToString(),
                SourceKey = source.Name,
                IssueNumber = issue.Number.ToString(),
                Title = issue.Title,
                Description = issue.Body,
                Status = sourceColumn,
                SourceColumn = sourceColumn,
                BoardColumnId = GetMappedBoardColumn(config.ColumnMappings, sourceColumn),
                Url = issue.HtmlUrl ?? $"https://github.com/{config.Owner}/{config.Repository}/issues/{issue.Number}",
                Assignee = issue.Assignee?.Login,
                Reporter = issue.User?.Login,
                CreatedAt = issue.CreatedAt,
                UpdatedAt = issue.UpdatedAt,
                Labels = issue.Labels
                    .Where(x => !string.IsNullOrWhiteSpace(x.Name))
                    .Select(x => x.Name)
                    .ToArray(),
            };
        }

        private static string MapStatus(string state)
        {
            return state.ToLowerInvariant() switch
            {
                "open" => "open",
                "closed" => "closed",
                _ => state.ToLowerInvariant(),
            };
        }
        
        private static string GetRequiredConfig(SourceDefinitionModel source, string key)
        {
            if (!source.Config.TryGetValue(key, out string? value) || string.IsNullOrWhiteSpace(value))
            {
                throw new InvalidOperationException($"Source '{source.Name}' is missing required config '{key}'.");
            }

            return value;
        }

        private static string? GetOptionalConfig(SourceDefinitionModel source, string key)
        {
            return source.Config.TryGetValue(key, out string? value) && !string.IsNullOrWhiteSpace(value)
                ? value
                : null;
        }

        private static Dictionary<string, string> GetPrefixedConfig(SourceDefinitionModel source, string prefix)
        {
            return source.Config
                .Where(x => x.Key.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
                .ToDictionary(
                    x => x.Key[prefix.Length..],
                    x => x.Value,
                    StringComparer.OrdinalIgnoreCase);
        }
        
        private static string? GetMappedBoardColumn(
            Dictionary<string, string> columnMappings,
            string sourceColumn)
        {
            return columnMappings.TryGetValue(sourceColumn, out string? boardColumnId)
                   && !string.IsNullOrWhiteSpace(boardColumnId)
                ? boardColumnId
                : null;
        }
    }
}