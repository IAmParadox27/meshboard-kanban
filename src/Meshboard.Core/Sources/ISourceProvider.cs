namespace Meshboard.Core.Sources
{
    public interface ISourceProvider
    {
        Task<IReadOnlyList<SourceSummary>> GetSourcesAsync(
            CancellationToken cancellationToken = default);
    }
}