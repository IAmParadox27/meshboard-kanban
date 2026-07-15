using System.Net.Http.Headers;
using System.Net.Http.Json;
using Meshboard.Core.Issues;
using Meshboard.Core.Sources;
using Meshboard.Plugin.Fider.Config;
using Meshboard.Plugin.Sources;
using Microsoft.Extensions.Options;

namespace Meshboard.Plugin.Fider
{
    public class FiderIssueSourcePlugin : IIssueSourcePlugin
    {
        private const string c_postsPath = "api/v1/posts?view=all&limit=100";

        private readonly IHttpClientFactory m_httpClientFactory;

        public string SourceKey => "fider";
        
        public string DisplayName => "Fider";

        public FiderIssueSourcePlugin(IHttpClientFactory httpClientFactory)
        {
            m_httpClientFactory = httpClientFactory;
        }

        private static FiderSourceConfig GetConfig(SourceDefinitionModel source)
        {
            FiderSourceConfig config = new FiderSourceConfig
            {
                BaseUrl = GetRequiredConfig(source, "baseUrl"),
                ApiKey = GetOptionalConfig(source, "apiKey"),
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
                        Key = "baseUrl",
                        Label = "Base URL",
                        Type = "url",
                        Required = true,
                        Placeholder = "https://feedback.example.com/",
                        HelpText = "Root URL of the Fider instance."
                    },
                    new SourceConfigurationField
                    {
                        Key = "apiKey",
                        Label = "API Key",
                        Type = "password",
                        Required = false,
                        Placeholder = "",
                        HelpText = "Optional. Required for protected endpoints."
                    }
                ]
            };
        }

        public async Task<IReadOnlyList<ExternalIssue>> GetIssuesAsync(
            SourceDefinitionModel source,
            CancellationToken cancellationToken = default)
        {
            FiderSourceConfig config = GetConfig(source);

            HttpClient client = m_httpClientFactory.CreateClient();
            client.BaseAddress = new Uri(config.BaseUrl);

            client.DefaultRequestHeaders.Accept.Add(
                new MediaTypeWithQualityHeaderValue("application/json"));

            if (!string.IsNullOrWhiteSpace(config.ApiKey))
            {
                client.DefaultRequestHeaders.Authorization =
                    new AuthenticationHeaderValue("Bearer", config.ApiKey);
            }
            else
            {
                // Remove any existing auth header
                client.DefaultRequestHeaders.Authorization = null;
            }

            List<FiderPostResponse>? posts = await client.GetFromJsonAsync<List<FiderPostResponse>>(
                "api/v1/posts?view=all&limit=100",cancellationToken);

            if (posts == null)
            {
                return [];
            }

            return posts
                .Select(issue => MapIssue(source, config, issue))
                .ToArray();
        }

        private ExternalIssue MapIssue(SourceDefinitionModel source,
            FiderSourceConfig config,
            FiderPostResponse issue)
        {
            string sourceColumn = issue.Status;

            return new ExternalIssue
            {
                ExternalId = $"{source.Id}:{issue.Id}",
                SourceKey = source.ProviderKey,
                IssueNumber = issue.Number.ToString(),
                Title = issue.Title,
                Description = issue.Description,
                Status = sourceColumn,
                SourceColumn = sourceColumn,
                BoardColumnId = GetMappedBoardColumn(config.ColumnMappings, sourceColumn),
                Url = $"{config.BaseUrl}/posts/{issue.Number}",
                Reporter = issue.User?.Name,
                CreatedAt = issue.CreatedAt,
                UpdatedAt = issue.CreatedAt,
                Labels = issue.Tags
                    .Where(tag => !string.IsNullOrWhiteSpace(tag))
                    .ToArray(),
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