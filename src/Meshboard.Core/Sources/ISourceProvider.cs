namespace Meshboard.Core.Sources
{
    public interface ISourceProvider
    {
        Task<IReadOnlyList<SourceSummary>> GetSourcesAsync(
            CancellationToken cancellationToken = default);
        
        IReadOnlyList<SourceProviderDefinition> GetProviders();
        
        Task<IReadOnlyList<SourceDefinitionModel>> GetAllAsync(
            CancellationToken cancellationToken = default);

        Task<SourceDefinitionModel?> GetByIdAsync(
            Guid id,
            CancellationToken cancellationToken = default);

        Task<SourceDefinitionModel> CreateAsync(
            UpsertSourceDefinitionRequest request,
            CancellationToken cancellationToken = default);

        Task<SourceDefinitionModel?> UpdateAsync(
            Guid id,
            UpsertSourceDefinitionRequest request,
            CancellationToken cancellationToken = default);

        Task<bool> DeleteAsync(
            Guid id,
            CancellationToken cancellationToken = default);
    }
}