using System.Net.Http.Headers;
using System.Net.Http.Json;
using Meshboard.Core.Issues;
using Meshboard.Core.Sources;
using Meshboard.Plugin.Sources;

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

        public SourceCapabilitiesModel GetCapabilities(SourceDefinitionModel source)
        {
            return new SourceCapabilitiesModel
            {
                CanReadDetails = true,
                CanComment = false,
                CanMoveIssue = false,
                CanAssignUser = false,
                CanCreateIssue = false,
            };
        }
        
        public async Task<IReadOnlyList<ExternalIssue>> GetIssuesAsync(
            SourceDefinitionModel source,
            CancellationToken cancellationToken = default)
        {
            FiderSourceConfig config = GetConfig(source);
            HttpClient client = CreateClient(config);

            List<FiderPostResponse>? posts = await TryGetFromJsonAsync<List<FiderPostResponse>>(
                client,
                c_postsPath,
                cancellationToken);

            if (posts == null)
            {
                return [];
            }

            return posts
                .Select(issue => MapIssue(source, config, issue))
                .ToArray();
        }

        public async Task<ExternalIssueDetails?> GetIssueDetailsAsync(
            SourceDefinitionModel source,
            ExternalIssue issue,
            CancellationToken cancellationToken = default)
        {
            FiderSourceConfig config = GetConfig(source);
            HttpClient client = CreateClient(config);

            FiderPostResponse? post = await TryGetFromJsonAsync<FiderPostResponse>(
                client,
                $"api/v1/posts/{Uri.EscapeDataString(issue.IssueNumber)}",
                cancellationToken);

            if (post == null)
            {
                return CreateFallbackDetails(issue);
            }

            List<FiderCommentResponse>? comments = await TryGetFromJsonAsync<List<FiderCommentResponse>>(
                client,
                $"api/v1/posts/{Uri.EscapeDataString(issue.IssueNumber)}/comments",
                cancellationToken);

            ExternalIssue mappedIssue = MapIssue(source, config, post);
            IReadOnlyList<ExternalIssueComment> mappedComments = BuildComments(post, comments ?? []);

            return new ExternalIssueDetails
            {
                Issue = mappedIssue,
                Comments = mappedComments,
                Activity = BuildActivity(mappedIssue, post, comments ?? []),
            };
        }

        private HttpClient CreateClient(FiderSourceConfig config)
        {
            HttpClient client = m_httpClientFactory.CreateClient();
            client.BaseAddress = new Uri(EnsureTrailingSlash(config.BaseUrl));
            client.DefaultRequestHeaders.Accept.Clear();
            client.DefaultRequestHeaders.Accept.Add(
                new MediaTypeWithQualityHeaderValue("application/json"));

            if (!string.IsNullOrWhiteSpace(config.ApiKey))
            {
                client.DefaultRequestHeaders.Authorization =
                    new AuthenticationHeaderValue("Bearer", config.ApiKey);
            }
            else
            {
                client.DefaultRequestHeaders.Authorization = null;
            }

            return client;
        }

        private static ExternalIssue MapIssue(
            SourceDefinitionModel source,
            FiderSourceConfig config,
            FiderPostResponse issue)
        {
            string sourceColumn = issue.Status;
            DateTimeOffset? updatedAt = issue.Response?.RespondedAt ?? issue.CreatedAt;

            return new ExternalIssue
            {
                ExternalId = issue.Id.ToString(),
                SourceKey = source.Id.ToString(),
                IssueNumber = issue.Number.ToString(),
                Title = issue.Title,
                Description = issue.Description,
                Status = sourceColumn,
                SourceColumn = sourceColumn,
                BoardColumnId = GetMappedBoardColumn(config.ColumnMappings, sourceColumn),
                Url = BuildPostUrl(config.BaseUrl, issue.Number),
                Reporter = MapActor(issue.User),
                CreatedAt = issue.CreatedAt,
                UpdatedAt = updatedAt,
                Labels = issue.Tags
                    .Where(tag => !string.IsNullOrWhiteSpace(tag))
                    .ToArray(),
            };
        }

        private static ExternalIssueDetails CreateFallbackDetails(ExternalIssue issue)
        {
            return new ExternalIssueDetails
            {
                Issue = issue,
                Comments = [],
                Activity = BuildFallbackActivity(issue),
            };
        }

        private static IReadOnlyList<ExternalIssueComment> BuildComments(
            FiderPostResponse post,
            IReadOnlyList<FiderCommentResponse> comments)
        {
            List<ExternalIssueComment> mappedComments = [];

            if (!string.IsNullOrWhiteSpace(post.Response?.Text))
            {
                mappedComments.Add(new ExternalIssueComment
                {
                    Id = $"response:{post.Id}",
                    Kind = "response",
                    Author = MapActor(post.Response.User),
                    Body = post.Response.Text ?? string.Empty,
                    CreatedAt = post.Response.RespondedAt,
                    UpdatedAt = post.Response.RespondedAt,
                });
            }

            mappedComments.AddRange(comments.Select(comment => new ExternalIssueComment
            {
                Id = comment.Id.ToString(),
                Kind = "comment",
                Author = MapActor(comment.User),
                Body = comment.Content ?? string.Empty,
                CreatedAt = comment.CreatedAt,
                UpdatedAt = comment.EditedAt ?? comment.CreatedAt,
            }));

            return mappedComments
                .OrderBy(x => x.CreatedAt ?? DateTimeOffset.MinValue)
                .ToArray();
        }

        private static IReadOnlyList<ExternalIssueActivityEntry> BuildActivity(
            ExternalIssue issue,
            FiderPostResponse post,
            IReadOnlyList<FiderCommentResponse> comments)
        {
            List<ExternalIssueActivityEntry> activity = [];

            if (issue.CreatedAt != null)
            {
                activity.Add(new ExternalIssueActivityEntry
                {
                    Id = $"{issue.ExternalId}:created",
                    Type = "created",
                    Description = string.IsNullOrWhiteSpace(issue.Reporter?.Name)
                        ? "Post created"
                        : $"{issue.Reporter.Name} created this post",
                    CreatedAt = issue.CreatedAt,
                    Actor = issue.Reporter,
                });
            }

            if (post.Response?.RespondedAt != null)
            {
                activity.Add(new ExternalIssueActivityEntry
                {
                    Id = $"{issue.ExternalId}:responded",
                    Type = "responded",
                    Description = string.IsNullOrWhiteSpace(post.Response.User?.Name)
                        ? "Official response posted"
                        : $"{post.Response.User.Name} responded",
                    CreatedAt = post.Response.RespondedAt,
                    Actor = MapActor(post.Response.User),
                });
            }

            activity.AddRange(comments
                .Where(x => x.EditedAt != null)
                .Select(x => new ExternalIssueActivityEntry
                {
                    Id = $"comment:{x.Id}:edited",
                    Type = "comment-edited",
                    Description = string.IsNullOrWhiteSpace(x.EditedBy?.Name)
                        ? "Comment edited"
                        : $"{x.EditedBy.Name} edited a comment",
                    CreatedAt = x.EditedAt,
                    Actor = MapActor(x.EditedBy),
                }));

            return activity
                .OrderBy(x => x.CreatedAt ?? DateTimeOffset.MinValue)
                .ToArray();
        }

        private static IReadOnlyList<ExternalIssueActivityEntry> BuildFallbackActivity(ExternalIssue issue)
        {
            List<ExternalIssueActivityEntry> activity = [];

            if (issue.CreatedAt != null)
            {
                activity.Add(new ExternalIssueActivityEntry
                {
                    Id = $"{issue.ExternalId}:created",
                    Type = "created",
                    Description = string.IsNullOrWhiteSpace(issue.Reporter?.Name)
                        ? "Post created"
                        : $"{issue.Reporter.Name} created this post",
                    CreatedAt = issue.CreatedAt,
                    Actor = issue.Reporter,
                });
            }

            if (issue.UpdatedAt != null && issue.CreatedAt != issue.UpdatedAt)
            {
                activity.Add(new ExternalIssueActivityEntry
                {
                    Id = $"{issue.ExternalId}:updated",
                    Type = "updated",
                    Description = "Post updated",
                    CreatedAt = issue.UpdatedAt,
                    Actor = null,
                });
            }

            return activity;
        }

        private static ExternalIssueActor? MapActor(FiderUserResponse? user)
        {
            if (user == null || string.IsNullOrWhiteSpace(user.Name))
            {
                return null;
            }

            return new ExternalIssueActor
            {
                Name = user.Name,
                Username = null,
                ExternalUserId = user.Id.ToString(),
                ExternalUsername = null,
                ExternalDisplayName = user.Name,
            };
        }

        private static async Task<T?> TryGetFromJsonAsync<T>(
            HttpClient client,
            string requestUri,
            CancellationToken cancellationToken)
        {
            try
            {
                return await client.GetFromJsonAsync<T>(requestUri, cancellationToken);
            }
            catch (HttpRequestException)
            {
                return default;
            }
        }

        private static string BuildPostUrl(string baseUrl, int postNumber)
        {
            Uri rootUri = new Uri(EnsureTrailingSlash(baseUrl));
            return new Uri(rootUri, $"posts/{postNumber}").ToString();
        }

        private static string EnsureTrailingSlash(string value)
        {
            return value.EndsWith("/", StringComparison.Ordinal)
                ? value
                : $"{value}/";
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