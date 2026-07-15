using System.Security.Claims;
using Meshboard.Core.Domain;

namespace Meshboard.Core.Auth
{
    public interface IUserLoginService
    {
        Task<UserAuthenticationResult> ValidateCredentialsAsync(
            string username,
            string password,
            CancellationToken cancellationToken = default);

        Task<UserAuthenticationResult> ValidateOidcLoginAsync(
            string issuer,
            string subject,
            ClaimsPrincipal externalPrincipal,
            CancellationToken cancellationToken = default);

        ClaimsPrincipal CreatePrincipal(User user);
    }
}