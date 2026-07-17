using Meshboard.Core.Auth;
using Meshboard.Core.Domain;
using Microsoft.EntityFrameworkCore;

namespace Meshboard.Infrastructure.Database.Providers
{
    public class UserSourceMappingProvider : IUserSourceMappingProvider
    {
        private readonly MeshboardDbContext m_dbContext;

        public UserSourceMappingProvider(MeshboardDbContext dbContext)
        {
            m_dbContext = dbContext;
        }

        public async Task<IReadOnlyList<UserSourceMapping>> GetByUserIdAsync(
            Guid userId,
            CancellationToken cancellationToken = default)
        {
            return await m_dbContext
                .Set<UserSourceMapping>()
                .Include(x => x.Source)
                .Where(x => x.UserId == userId)
                .OrderBy(x => x.Source.Name)
                .ToArrayAsync(cancellationToken);
        }

        public async Task<UserSourceMapping> UpsertAsync(
            UserSourceMapping mapping,
            CancellationToken cancellationToken = default)
        {
            ArgumentNullException.ThrowIfNull(mapping);

            UserSourceMapping? existing = await m_dbContext
                .Set<UserSourceMapping>()
                .FirstOrDefaultAsync(
                    x => x.UserId == mapping.UserId && x.SourceId == mapping.SourceId,
                    cancellationToken);

            if (existing == null)
            {
                mapping.Id = mapping.Id == Guid.Empty ? Guid.NewGuid() : mapping.Id;
                mapping.CreatedAtUtc = DateTime.UtcNow;
                mapping.UpdatedAtUtc = DateTime.UtcNow;

                m_dbContext.Set<UserSourceMapping>().Add(mapping);
                await m_dbContext.SaveChangesAsync(cancellationToken);
                return mapping;
            }

            existing.ExternalUserId = mapping.ExternalUserId;
            existing.ExternalUsername = mapping.ExternalUsername;
            existing.ExternalDisplayName = mapping.ExternalDisplayName;
            existing.UpdatedAtUtc = DateTime.UtcNow;

            await m_dbContext.SaveChangesAsync(cancellationToken);
            return existing;
        }

        public async Task<bool> DeleteAsync(
            Guid userId,
            Guid sourceId,
            CancellationToken cancellationToken = default)
        {
            UserSourceMapping? existing = await m_dbContext
                .Set<UserSourceMapping>()
                .FirstOrDefaultAsync(
                    x => x.UserId == userId && x.SourceId == sourceId,
                    cancellationToken);

            if (existing == null)
            {
                return false;
            }

            m_dbContext.Set<UserSourceMapping>().Remove(existing);
            await m_dbContext.SaveChangesAsync(cancellationToken);
            return true;
        }
    }
}