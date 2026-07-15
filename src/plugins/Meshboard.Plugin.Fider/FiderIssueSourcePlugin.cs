using System.Net.Http.Json;
using Meshboard.Core.Issues;
using Meshboard.Plugin.Fider.Config;
using Meshboard.Plugin.Sources;
using Microsoft.Extensions.Options;

namespace Meshboard.Plugin.Fider
{
    public class FiderIssueSourcePlugin : IIssueSourcePlugin
    {
        private const string c_postsPath = "api/v1/posts?view=all&limit=100";

        private readonly HttpClient m_httpClient;

        public string SourceKey => "fider";

        public FiderIssueSourcePlugin(HttpClient httpClient, IOptions<FiderSettings> settings)
        {
            m_httpClient = httpClient;
            
            m_httpClient.BaseAddress = new Uri(settings.Value.BaseUrl);
            m_httpClient.DefaultRequestHeaders.Add("Accept", "application/json");
            
            m_httpClient.DefaultRequestHeaders.Authorization =
                new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", settings.Value.ApiKey);
        }

        public async Task<IReadOnlyList<ExternalIssue>> GetIssuesAsync(
            CancellationToken cancellationToken = default)
        {
            List<FiderPostResponse>? posts = await m_httpClient.GetFromJsonAsync<List<FiderPostResponse>>(
                c_postsPath,
                cancellationToken);

            if (posts == null)
            {
                return [];
            }

            return posts
                .Select(MapPostToIssue)
                .Where(x => x.Status != "declined")
                .ToArray();
        }

        private ExternalIssue MapPostToIssue(FiderPostResponse post)
        {
            return new ExternalIssue
            {
                ExternalId = post.Id.ToString(),
                IssueNumber = post.Number.ToString(),
                SourceKey = SourceKey,
                Title = post.Title,
                Description = BuildDescription(post),
                Status = MapStatus(post.Status),
                Url = BuildPostUrl(post.Number),
                Assignee = null,
                Reporter = post.User?.Name,
                CreatedAt = post.CreatedAt,
                UpdatedAt = post.Response?.RespondedAt ?? post.CreatedAt,
                Labels = post.Tags
                    .Where(x => !string.IsNullOrWhiteSpace(x))
                    .ToArray(),
            };
        }

        private string BuildDescription(FiderPostResponse post)
        {
            string description = post.Description ?? string.Empty;string responseText = post.Response?.Text ?? string.Empty;

            if (string.IsNullOrWhiteSpace(responseText))
            {
                return description;
            }

            if (string.IsNullOrWhiteSpace(description))
            {
                return $"## Official response{Environment.NewLine}{Environment.NewLine}{responseText}";
            }

            return
                $"{description}{Environment.NewLine}{Environment.NewLine}---{Environment.NewLine}{Environment.NewLine}## Official response{Environment.NewLine}{Environment.NewLine}{responseText}";
        }

        private string BuildPostUrl(int postNumber)
        {
            if (m_httpClient.BaseAddress == null)
            {
                return string.Empty;
            }

            return new Uri(m_httpClient.BaseAddress, $"posts/{postNumber}").ToString();
        }

        private string MapStatus(string status)
        {
            return status.ToLowerInvariant() switch
            {
                "planned" => "planned",
                "started" => "in-progress",
                "completed" => "done",
                "declined" => "declined",
                _ => "open",
            };
        }
    }
}