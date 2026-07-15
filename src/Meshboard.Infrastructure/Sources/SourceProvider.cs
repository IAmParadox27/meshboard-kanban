using Meshboard.Core.Sources;

namespace Meshboard.Infrastructure.Sources
{
    public class SourceProvider : ISourceProvider
    {
        public Task<IReadOnlyList<SourceSummary>> GetSourcesAsync(
            CancellationToken cancellationToken = default)
        {
            IReadOnlyList<SourceSummary> sources =
            [
                new SourceSummary
                {
                    Id = "github",
                    Name = "GitHub",
                    Kind = "github",
                    Enabled = true,
                    ProxyMode = "two-way",
                    Status = "healthy",
                    LastSyncAt = DateTimeOffset.UtcNow.AddMinutes(-18),
                    LinkedItemsCount = 142,
                    Description = "Issues mirrored from the main repository."
                },
                new SourceSummary
                {
                    Id = "fider",
                    Name = "Fider",
                    Kind = "fider",
                    Enabled = true,
                    ProxyMode = "import-only",
                    Status = "warning",
                    LastSyncAt = DateTimeOffset.UtcNow.AddHours(-2),
                    LinkedItemsCount = 37,
                    Description = "Community feature requests."
                },
                new SourceSummary
                {
                    Id = "internal",
                    Name = "Internal",
                    Kind = "internal",
                    Enabled = true,
                    ProxyMode = "export-only",
                    Status = "healthy",
                    LastSyncAt = null,
                    LinkedItemsCount = 12,
                    Description = "Meshboard-native work items."
                }
            ];

            return Task.FromResult(sources);
        }
    }
}