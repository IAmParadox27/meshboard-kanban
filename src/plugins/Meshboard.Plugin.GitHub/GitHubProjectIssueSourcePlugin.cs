using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Web;
using Meshboard.Core.Issues;
using Meshboard.Core.Sources;
using Meshboard.Plugin.Sources;

namespace Meshboard.Plugin.GitHub
{
    public class GitHubProjectIssueSourcePlugin : IIssueSourcePlugin, IDirectIssueDetailsSourcePlugin 
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
            GitHubSourceConfig config = GetConfig(source);
            HttpClient client = CreateClient(config);

            IReadOnlyList<GitHubProjectResponse> issues = await GetProjectIssuesAsync(client, config, cancellationToken);

            return issues
                .Where(x => x.Issue?.PullRequest == null)
                .Select(x => MapIssue(source, config, x))
                .ToArray();
        }

        public async Task<ExternalIssueDetails?> GetIssueDetailsAsync(
            SourceDefinitionModel source,
            ExternalIssue issue,
            CancellationToken cancellationToken = default)
        {
            ExternalIssueDetails? details = await GetIssueDetailsAsync(
                source,
                issue.DetailsLookupKey,
                cancellationToken);

            return details ?? CreateFallbackDetails(issue);
        }
        
        public async Task<ExternalIssueDetails?> GetIssueDetailsAsync(
            SourceDefinitionModel source,
            string detailsLookupKey,
            CancellationToken cancellationToken = default)
        {
            GitHubSourceConfig config = GetConfig(source);
            HttpClient client = CreateClient(config);

            if (detailsLookupKey.StartsWith("http", StringComparison.OrdinalIgnoreCase))
            {
                detailsLookupKey = HttpUtility.UrlDecode(detailsLookupKey);
            }
            
            long? statusFieldId = await GetStatusFieldIdAsync(client, config, cancellationToken);
            string requestPath = AppendProjectItemFields(detailsLookupKey, statusFieldId);

            GitHubProjectResponse? projectIssue = await TryGetFromJsonAsync<GitHubProjectResponse>(
                client,
                requestPath,
                cancellationToken);

            if (projectIssue?.Issue == null || projectIssue.Issue.PullRequest != null)
            {
                return null;
            }

            IReadOnlyList<GitHubIssueCommentResponse> comments = await TryGetPagedFromJsonAsync<GitHubIssueCommentResponse>(
                client,
                AppendPerPage(projectIssue.Issue.CommentsUrl),
                cancellationToken);

            ExternalIssue mappedIssue = MapIssue(source, config, projectIssue);

            return new ExternalIssueDetails
            {
                Issue = mappedIssue,
                Comments = comments
                    .Select(MapComment)
                    .ToArray(),
                Activity = BuildActivity(mappedIssue, projectIssue.Issue, comments),
            };
        }
        
        private HttpClient CreateClient(GitHubSourceConfig config)
        {
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

            return client;
        }
        
        private static async Task<long?> GetStatusFieldIdAsync(
            HttpClient client,
            GitHubSourceConfig config,
            CancellationToken cancellationToken)
        {
            string fieldsRequestPath =
                $"users/{Uri.EscapeDataString(config.Owner)}/projectsV2/{Uri.EscapeDataString(config.ProjectId!)}/fields?per_page=100";

            List<GitHubFieldResponse>? fields = await TryGetFromJsonAsync<List<GitHubFieldResponse>>(
                client,
                fieldsRequestPath,
                cancellationToken);

            return fields?
                .FirstOrDefault(x => string.Equals(x.Name, config.StatusFieldName, StringComparison.OrdinalIgnoreCase))?
                .Id;
        }
        
        private static string AppendProjectItemFields(
            string itemUrl,
            long? statusFieldId)
        {
            if (string.IsNullOrWhiteSpace(itemUrl) || statusFieldId == null)
            {
                return itemUrl;
            }

            string separator = itemUrl.Contains('?', StringComparison.Ordinal) ? "&" : "?";
            return $"{itemUrl}{separator}fields[]={statusFieldId.Value}";
        }
        
        private static string GetDetailsLookupKey(GitHubProjectResponse project)
        {
            if (!string.IsNullOrWhiteSpace(project.ItemUrl))
            {
                return project.ItemUrl;
            }

            if (!string.IsNullOrWhiteSpace(project.Issue?.HtmlUrl))
            {
                return project.Issue.HtmlUrl;
            }

            return project.Issue?.Id.ToString() ?? string.Empty;
        }
        
        private static async Task<IReadOnlyList<GitHubProjectResponse>> GetProjectIssuesAsync(
            HttpClient client,
            GitHubSourceConfig config,
            CancellationToken cancellationToken)
        {
            long? statusFieldId = await GetStatusFieldIdAsync(
                client,
                config,
                cancellationToken);

            string requestPath =
                $"users/{Uri.EscapeDataString(config.Owner)}/projectsV2/{Uri.EscapeDataString(config.ProjectId!)}/items?per_page=100";

            if (statusFieldId != null)
            {
                requestPath += $"&fields[]={statusFieldId}";
            }

            IReadOnlyList<GitHubProjectResponse> issues = await TryGetPagedFromJsonAsync<GitHubProjectResponse>(
                client,
                requestPath,
                cancellationToken);

            return issues;
        }

        private static ExternalIssue MapIssue(
            SourceDefinitionModel source,
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
                DetailsLookupKey = GetDetailsLookupKey(project),
                SourceKey = source.Id.ToString(),
                IssueNumber = project.Issue?.Number.ToString() ?? "No issue number",
                Title = project.Issue?.Title ?? "No title",
                Description = project.Issue?.Body,
                Status = sourceColumn,
                SourceColumn = sourceColumn,
                BoardColumnId = GetMappedBoardColumn(config.ColumnMappings, sourceColumn),
                Url = project.Issue?.HtmlUrl ?? $"https://github.com/{config.Owner}/projects/{config.ProjectId}",
                Assignee = MapActor(project.Issue?.Assignee),
                Reporter = MapActor(project.Issue?.User),
                CreatedAt = project.Issue?.CreatedAt,
                UpdatedAt = project.Issue?.UpdatedAt,
                Labels = project.Issue?.Labels?
                    .Where(x => !string.IsNullOrWhiteSpace(x.Name))
                    .Select(x => x.Name)
                    .ToArray() ?? Array.Empty<string>(),
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

        private static IReadOnlyList<ExternalIssueActivityEntry> BuildActivity(
            ExternalIssue issue,
            GitHubIssueResponse githubIssue,
            IReadOnlyList<GitHubIssueCommentResponse> comments)
        {
            List<ExternalIssueActivityEntry> activity = [];

            if (issue.CreatedAt != null)
            {
                activity.Add(new ExternalIssueActivityEntry
                {
                    Id = $"{issue.ExternalId}:created",
                    Type = "created",
                    Description = string.IsNullOrWhiteSpace(issue.Reporter?.Name)
                        ? "Issue created"
                        : $"{issue.Reporter.Name} opened this issue",
                    CreatedAt = issue.CreatedAt,
                    Actor = issue.Reporter,
                });
            }

            if (githubIssue.ClosedAt != null)
            {
                activity.Add(new ExternalIssueActivityEntry
                {
                    Id = $"{issue.ExternalId}:closed",
                    Type = "closed",
                    Description = "Issue closed",
                    CreatedAt = githubIssue.ClosedAt,
                    Actor = null,
                });
            }

            if (issue.UpdatedAt != null
                && issue.CreatedAt != issue.UpdatedAt
                && githubIssue.ClosedAt != issue.UpdatedAt)
            {
                activity.Add(new ExternalIssueActivityEntry
                {
                    Id = $"{issue.ExternalId}:updated",
                    Type = "updated",
                    Description = "Issue updated",
                    CreatedAt = issue.UpdatedAt,
                    Actor = null,
                });
            }

            activity.AddRange(comments
                .Where(x => x.UpdatedAt > x.CreatedAt)
                .Select(x => new ExternalIssueActivityEntry
                {
                    Id = $"comment:{x.Id}:edited",
                    Type = "comment-edited",
                    Description = string.IsNullOrWhiteSpace(x.User?.Login)
                        ? "Comment edited"
                        : $"{x.User.Login} edited a comment",
                    CreatedAt = x.UpdatedAt,
                    Actor = MapActor(x.User),
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
                        ? "Issue created"
                        : $"{issue.Reporter.Name} opened this issue",
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
                    Description = "Issue updated",
                    CreatedAt = issue.UpdatedAt,
                    Actor = null,
                });
            }

            return activity;
        }

        private static ExternalIssueComment MapComment(GitHubIssueCommentResponse comment)
        {
            return new ExternalIssueComment
            {
                Id = comment.Id.ToString(),
                Kind = "comment",
                Author = MapActor(comment.User),
                Body = comment.Body ?? string.Empty,
                CreatedAt = comment.CreatedAt,
                UpdatedAt = comment.UpdatedAt,
            };
        }

        private static ExternalIssueActor? MapActor(GitHubUserResponse? user)
        {
            if (user == null || string.IsNullOrWhiteSpace(user.Login))
            {
                return null;
            }

            return new ExternalIssueActor
            {
                Name = user.Login,
                Username = user.Login,
                ExternalUserId = user.Id.ToString(),
                ExternalUsername = user.Login,
                ExternalDisplayName = user.Login,
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

        private static async Task<IReadOnlyList<T>> TryGetPagedFromJsonAsync<T>(
            HttpClient client,
            string? requestUri,
            CancellationToken cancellationToken)
        {
            if (string.IsNullOrWhiteSpace(requestUri))
            {
                return [];
            }

            List<T> items = [];
            string? nextRequestUri = requestUri;

            while (!string.IsNullOrWhiteSpace(nextRequestUri))
            {
                try
                {
                    using HttpResponseMessage response = await client.GetAsync(nextRequestUri, cancellationToken);

                    if (!response.IsSuccessStatusCode)
                    {
                        break;
                    }

                    List<T>? page = await response.Content.ReadFromJsonAsync<List<T>>(cancellationToken: cancellationToken);

                    if (page == null || page.Count == 0)
                    {
                        break;
                    }

                    items.AddRange(page);
                    nextRequestUri = GetNextPageUri(response.Headers);
                }
                catch (HttpRequestException)
                {
                    break;
                }
            }

            return items;
        }

        private static string? GetNextPageUri(HttpResponseHeaders headers)
        {
            if (!headers.TryGetValues("Link", out IEnumerable<string>? values))
            {
                return null;
            }

            foreach (string value in values)
            {
                foreach (string part in value.Split(','))
                {
                    string trimmed = part.Trim();

                    if (!trimmed.Contains("rel=\"next\"", StringComparison.OrdinalIgnoreCase))
                    {
                        continue;
                    }

                    int start = trimmed.IndexOf('<');
                    int end = trimmed.IndexOf('>');

                    if (start >= 0 && end > start)
                    {
                        return trimmed[(start + 1)..end];
                    }
                }
            }

            return null;
        }

        private static string? AppendPerPage(string? requestUri)
        {
            if (string.IsNullOrWhiteSpace(requestUri))
            {
                return null;
            }

            string separator = requestUri.Contains('?') ? "&" : "?";
            return $"{requestUri}{separator}per_page=100";
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