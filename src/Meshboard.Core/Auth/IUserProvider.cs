using Meshboard.Core.Domain;

namespace Meshboard.Core.Auth
{
    public interface IUserProvider
    {
        Task<User?> GetByUsernameAsync(
            string username,
            CancellationToken cancellationToken = default);

        Task<User?> GetByExternalLoginAsync(
            string issuer,
            string subject,
            CancellationToken cancellationToken = default);

        Task UpdateAsync(
            User user,
            CancellationToken cancellationToken = default);

        Task<User> CreateAsync(
            User user,
            CancellationToken cancellationToken = default
        );
    }
}