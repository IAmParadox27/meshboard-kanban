using System.Security.Claims;
using Meshboard.Core.Auth;
using Meshboard.Core.Config;
using Meshboard.Core.Domain;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.Extensions.Options;

namespace Meshboard.Infrastructure.Auth
{
    public class UserLoginService : IUserLoginService
    {
        private readonly IUserProvider m_userProvider;
        private readonly IPasswordHasher m_passwordHasher;
        private readonly AuthSettings m_authSettings;

        public UserLoginService(
            IUserProvider userProvider,
            IPasswordHasher passwordHasher,
            IOptions<AuthSettings> authSettings)
        {
            m_userProvider = userProvider;
            m_passwordHasher = passwordHasher;
            m_authSettings = authSettings.Value;
        }

        public async Task<UserAuthenticationResult> ValidateCredentialsAsync(
            string username,
            string password,
            CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(username))
            {
                return UserAuthenticationResult.Failed("Username is required.");
            }

            if (string.IsNullOrWhiteSpace(password))
            {
                return UserAuthenticationResult.Failed("Password is required.");
            }

            User? user = await m_userProvider.GetByUsernameAsync(
                username,
                cancellationToken);

            if (user == null)
            {
                return UserAuthenticationResult.Failed("Invalid username or password.");
            }

            if (!user.IsActive)
            {
                return UserAuthenticationResult.Failed("User account is disabled.");
            }

            if (string.IsNullOrWhiteSpace(user.PasswordHash))
            {
                return UserAuthenticationResult.Failed("User does not have local password authentication enabled.");
            }

            bool passwordValid = m_passwordHasher.Verify(
                password,
                user.PasswordHash);

            if (!passwordValid)
            {
                return UserAuthenticationResult.Failed("Invalid username or password.");
            }

            return UserAuthenticationResult.Succeeded(user);
        }

        public async Task<UserAuthenticationResult> ValidateOidcLoginAsync(
            string issuer, string subject,
            ClaimsPrincipal externalPrincipal,
            CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(issuer))
            {
                return UserAuthenticationResult.Failed("OIDC issuer is required.");
            }

            if (string.IsNullOrWhiteSpace(subject))
            {
                return UserAuthenticationResult.Failed("OIDC subject is required.");
            }

            User? user = await m_userProvider.GetByExternalLoginAsync(
                issuer,
                subject,
                cancellationToken);

            if (user == null)
            {
                // TODO: Create a new user if settings allow it
                if (m_authSettings.Oidc?.AutoCreateUser ?? false)
                {
                    bool isAdmin = externalPrincipal.FindAll("groups").Any(x => x.Value == m_authSettings.Oidc?.AdminGroup);
                    Guid userId = Guid.NewGuid();
                    user = await m_userProvider.CreateAsync(
                        new User
                        {
                            Username = externalPrincipal.FindFirst("preferred_username")?.Value ?? externalPrincipal.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? Guid.NewGuid().ToString("N"),
                            CreatedAtUtc = DateTime.UtcNow,
                            Email = externalPrincipal.FindFirst(ClaimTypes.Email)?.Value,
                            DisplayName = externalPrincipal.FindFirst(ClaimTypes.Name)?.Value ?? externalPrincipal.FindFirst("name")?.Value ?? subject,
                            Id = userId,
                            IsActive = true,
                            IsAdmin = isAdmin,
                            PasswordHash = "this is not a valid hash :)",
                            ExternalLogins = new List<UserExternalLogin>
                            {
                                new UserExternalLogin
                                {
                                    Issuer = issuer,
                                    Subject = subject,
                                    Email = externalPrincipal.FindFirst(ClaimTypes.Email)?.Value,
                                    DisplayName = externalPrincipal.FindFirst(ClaimTypes.Name)?.Value ?? externalPrincipal.FindFirst("name")?.Value ?? subject,
                                    Id = Guid.NewGuid(),
                                    LinkedAtUtc = DateTime.UtcNow,
                                    Provider = m_authSettings.Oidc.Scheme,
                                    UserId = userId
                                }
                            }
                        },
                        cancellationToken);
                }
                else
                {
                    return UserAuthenticationResult.Failed("No local Meshboard user is linked to this OIDC account.");
                }
            }

            if (!user.IsActive)
            {
                return UserAuthenticationResult.Failed("User account is disabled.");
            }

            UserExternalLogin? externalLogin = user.ExternalLogins
                .FirstOrDefault(x =>
                    string.Equals(x.Issuer, issuer, StringComparison.OrdinalIgnoreCase)
                    && string.Equals(x.Subject, subject, StringComparison.Ordinal));

            if (externalLogin != null)
            {
                string? email = externalPrincipal.FindFirst(ClaimTypes.Email)?.Value
                                ?? externalPrincipal.FindFirst("email")?.Value;

                string? displayName = externalPrincipal.FindFirst(ClaimTypes.Name)?.Value
                                      ?? externalPrincipal.FindFirst("name")?.Value
                                      ?? externalPrincipal.FindFirst("preferred_username")?.Value;

                bool changed = false;

                if (!string.Equals(externalLogin.Email, email, StringComparison.Ordinal))
                {
                    externalLogin.Email = email;
                    changed = true;
                }

                if (!string.Equals(externalLogin.DisplayName, displayName, StringComparison.Ordinal))
                {
                    externalLogin.DisplayName = displayName;
                    changed = true;
                }

                if (changed)
                {
                    await m_userProvider.UpdateAsync(
                        user,
                        cancellationToken);
                }
            }

            return UserAuthenticationResult.Succeeded(user);
        }

        public ClaimsPrincipal CreatePrincipal(User user)
        {
            List<Claim> claims =
            [
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Name, user.Username)
            ];

            if (!string.IsNullOrWhiteSpace(user.Email))
            {
                claims.Add(new Claim(ClaimTypes.Email, user.Email));
            }

            if (!string.IsNullOrWhiteSpace(user.DisplayName))
            {
                claims.Add(new Claim("display_name", user.DisplayName));
            }

            if (user.IsAdmin)
            {
                claims.Add(new Claim(ClaimTypes.Role, "Admin"));
            }

            ClaimsIdentity identity = new ClaimsIdentity(
                claims,
                CookieAuthenticationDefaults.AuthenticationScheme);

            return new ClaimsPrincipal(identity);
        }
    }
}
