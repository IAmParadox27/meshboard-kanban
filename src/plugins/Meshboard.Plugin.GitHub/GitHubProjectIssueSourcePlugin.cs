using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Meshboard.Core.Issues;
using Meshboard.Core.Sources;
using Meshboard.Plugin.Sources;

namespace Meshboard.Plugin.GitHub
{
    public class GitHubProjectIssueSourcePlugin : IIssueSourcePlugin
    {
        private readonly IHttpClientFactory m_httpClientFactory;

        public string SourceKey => "github-project";
        
        public string DisplayName => "GitHub Project";

        public GitHubProjectIssueSourcePlugin(IHttpClientFactory httpClientFactory)
        {
            m_httpClientFactory = httpClientFactory;
        }
        
        private static GitHubSourceConfig GetConfig(SourceDefinitionModel source)
        {
            GitHubSourceConfig config = new GitHubSourceConfig
            {
                Owner = GetRequiredConfig(source, "owner"),
                ProjectId = GetRequiredConfig(source, "projectId"),
                Token = GetOptionalConfig(source, "token"),
                ColumnMappings = GetPrefixedConfig(source, "columnMappings."),
                StatusFieldName = GetOptionalConfig(source, "statusFieldName"),
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
                        Key = "projectId",
                        Label = "Project ID",
                        Type = "text",
                        Required = true,
                        Placeholder = "hello-world",
                        HelpText = "Project name."
                    },
                    new SourceConfigurationField
                    {
                        Key = "statusFieldName",
                        Label = "Status Field Name",
                        Type = "text",
                        Required = true,
                        Placeholder = "Status",
                        HelpText = "Name of the field used to store issue status."
                    },
                    new SourceConfigurationField
                    {
                        Key = "token",
                        Label = "Personal Access Token",
                        Type = "password",
                        Required = true,
                        Placeholder = "",
                        HelpText = "Access token with permission to query the project."
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
            
            string fieldsRequestPath =
                $"users/{Uri.EscapeDataString(config.Owner)}/projectsV2/{Uri.EscapeDataString(config.ProjectId!)}/fields?per_page=5000";

            List<GitHubFieldResponse>? fields = await client.GetFromJsonAsync<List<GitHubFieldResponse>>(fieldsRequestPath, cancellationToken);
            long? statusFieldId = fields?.FirstOrDefault(x => x.Name == config.StatusFieldName)?.Id;
            
            string requestPath =
                $"users/{Uri.EscapeDataString(config.Owner)}/projectsV2/{Uri.EscapeDataString(config.ProjectId!)}/items?per_page=5000";

            if (statusFieldId != null)
            {
                requestPath += $"&fields[]={statusFieldId}";
            }

            List<GitHubProjectResponse>? issues = null;

            try
            {
                issues = await client.GetFromJsonAsync<List<GitHubProjectResponse>>(
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
                .Where(x => x.Issue?.PullRequest == null)
                .Select(x => MapIssue(source, config, x))
                .ToArray();
        }
        
        private ExternalIssue MapIssue(SourceDefinitionModel source,
            GitHubSourceConfig config,
            GitHubProjectResponse project)
        {
            GitHubFieldSingleSelectResponse? statusField = project.Fields?
                .Where(f => f.DataType == "single_select")
                .Where(x => x.Name == config.StatusFieldName)
                .Select(f => f.Value?.AsObject().Deserialize<GitHubFieldSingleSelectResponse>())
                .FirstOrDefault();
            
            string sourceColumn = statusField?.Name?.Raw ?? "Unknown";
            
            return new ExternalIssue
            {
                ExternalId = project.Issue?.Id.ToString() ?? "No issue id",
                SourceKey = source.Id.ToString(),
                IssueNumber = project.Issue?.Number.ToString() ?? "No issue number",
                Title = project.Issue?.Title ?? "No title",
                Description = project.Issue?.Body,
                Status = sourceColumn ?? "Unknown",
                SourceColumn = sourceColumn,
                BoardColumnId = GetMappedBoardColumn(config.ColumnMappings, sourceColumn ?? "Unknown"),
                Url = project.Issue?.HtmlUrl ?? $"https://github.com/{config.Owner}/{config.Repository}/issues/{project.Issue?.Number}",
                Assignee = project.Issue?.Assignee?.Login,
                Reporter = project.Issue?.User?.Login,
                CreatedAt = project.Issue?.CreatedAt,
                UpdatedAt = project.Issue?.UpdatedAt,
                Labels = project.Issue?.Labels?
                    .Where(x => !string.IsNullOrWhiteSpace(x.Name))
                    .Select(x => x.Name)
                    .ToArray() ?? Array.Empty<string>(),
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