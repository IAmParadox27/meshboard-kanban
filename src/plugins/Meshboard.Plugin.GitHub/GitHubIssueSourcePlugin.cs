using System.Net.Http.Json;
using Meshboard.Core.Issues;
using Meshboard.Core.Sources;
using Meshboard.Plugin.Sources;

namespace Meshboard.Plugin.GitHub
{
    public class GitHubIssueSourcePlugin : IIssueSourcePlugin
    {
        // Temp URL for testing
        private const string c_issuesPath = "repos/IAmParadox27/jellyfin-plugin-home-sections/issues";

        private readonly HttpClient m_httpClient;

        public string SourceKey => "github";

        public GitHubIssueSourcePlugin(HttpClient httpClient)
        {
            m_httpClient = httpClient;
            
            m_httpClient.BaseAddress = new Uri("https://api.github.com/");
            m_httpClient.DefaultRequestHeaders.Add("User-Agent", "Meshboard.Plugin.GitHub");
            m_httpClient.DefaultRequestHeaders.Add("Accept", "application/vnd.github+json");
        }

        public async Task<IReadOnlyList<ExternalIssue>> GetIssuesAsync(
            CancellationToken cancellationToken = default)
        {
            List<GitHubIssueResponse>? issues = await m_httpClient.GetFromJsonAsync<List<GitHubIssueResponse>>(
                c_issuesPath,
                cancellationToken);

            if (issues == null)
            {
                return [];
            }

            return issues
                .Where(x => x.PullRequest == null)
                .Select(x => new ExternalIssue
                {
                    ExternalId = x.Id.ToString(),
                    IssueNumber = x.Number.ToString(),
                    SourceKey = SourceKey,
                    Title = x.Title,
                    Description = x.Body,
                    Status = x.State,
                    Url = x.HtmlUrl,
                    Assignee = x.Assignee?.Login,
                    Reporter = x.User?.Login,
                    CreatedAt = x.CreatedAt,
                    UpdatedAt = x.UpdatedAt,
                    Labels = x.Labels
                        .Select(label => label.Name)
                        .ToArray()
                })
                .ToArray();
        }
    }
}