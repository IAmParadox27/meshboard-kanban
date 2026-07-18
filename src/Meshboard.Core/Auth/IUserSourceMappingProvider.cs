using Meshboard.Core.Domain;

namespace Meshboard.Core.Auth
{
    public interface IUserSourceMappingProvider
    {
        Task<IReadOnlyList<UserSourceMapping>> GetByUserIdAsync(
            Guid userId,
            CancellationToken cancellationToken = default);

        Task<IReadOnlyList<UserSourceMapping>> GetBySourceIdsAsync(
            IReadOnlyCollection<Guid> sourceIds,
            CancellationToken cancellationToken = default);

        Task<UserSourceMapping> UpsertAsync(
            UserSourceMapping mapping,
            CancellationToken cancellationToken = default);

        Task<bool> DeleteAsync(
            Guid userId,
            Guid sourceId,
            CancellationToken cancellationToken = default);
    }
}