using Meshboard.Core.Auth;
using Meshboard.Core.Domain;
using Microsoft.EntityFrameworkCore;

namespace Meshboard.Infrastructure.Database.Providers
{
    public class UserProvider : IUserProvider
    {
        private readonly MeshboardDbContext m_dbContext;

        public UserProvider(MeshboardDbContext dbContext)
        {
            m_dbContext = dbContext;
        }

        public async Task<User?> GetByIdAsync(
            Guid id,
            CancellationToken cancellationToken = default)
        {
            return await m_dbContext
                .Set<User>()
                .Include(x => x.ExternalLogins)
                .Include(x => x.SourceMappings)
                .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        }

        public async Task<User?> GetByUsernameAsync(
            string username,
            CancellationToken cancellationToken = default)
        {
            ArgumentException.ThrowIfNullOrWhiteSpace(username);

            return await m_dbContext
                .Set<User>()
                .Include(x => x.ExternalLogins)
                .FirstOrDefaultAsync(
                    x => x.Username == username,
                    cancellationToken);
        }

        public async Task<User?> GetByExternalLoginAsync(
            string issuer,
            string subject,
            CancellationToken cancellationToken = default)
        {
            ArgumentException.ThrowIfNullOrWhiteSpace(issuer);
            ArgumentException.ThrowIfNullOrWhiteSpace(subject);

            return await m_dbContext
                .Set<User>()
                .Include(x => x.ExternalLogins)
                .FirstOrDefaultAsync(
                    x => x.ExternalLogins.Any(y =>
                        y.Issuer == issuer
                        && y.Subject == subject),
                    cancellationToken);
        }

        public async Task UpdateAsync(
            User user,
            CancellationToken cancellationToken = default)
        {
            ArgumentNullException.ThrowIfNull(user);

            m_dbContext
                .Set<User>()
                .Update(user);

            await m_dbContext.SaveChangesAsync(cancellationToken);
        }

        public async Task<User> CreateAsync(User user, CancellationToken cancellationToken = default)
        {
            ArgumentNullException.ThrowIfNull(user);

            m_dbContext
                .Set<User>()
                .Add(user);

            await m_dbContext.SaveChangesAsync(cancellationToken);

            return user;
        }
    }
}