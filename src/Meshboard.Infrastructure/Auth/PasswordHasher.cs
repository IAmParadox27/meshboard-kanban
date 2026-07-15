using Meshboard.Core.Auth;
using Meshboard.Core.Domain;
using Microsoft.AspNetCore.Identity;

namespace Meshboard.Infrastructure.Auth
{
    public sealed class PasswordHasher : IPasswordHasher
    {
        private readonly Microsoft.AspNetCore.Identity.IPasswordHasher<User> m_passwordHasher;

        public PasswordHasher()
        {
            m_passwordHasher = new Microsoft.AspNetCore.Identity.PasswordHasher<User>();
        }

        public string Hash(string password)
        {
            ArgumentException.ThrowIfNullOrWhiteSpace(password);

            User user = new User();

            return m_passwordHasher.HashPassword(user, password);
        }

        public bool Verify(string password, string passwordHash)
        {
            ArgumentException.ThrowIfNullOrWhiteSpace(password);
            ArgumentException.ThrowIfNullOrWhiteSpace(passwordHash);

            User user = new User();

            PasswordVerificationResult result = m_passwordHasher.VerifyHashedPassword(user, passwordHash, password);

            return result == PasswordVerificationResult.Success || result == PasswordVerificationResult.SuccessRehashNeeded;
        }
    }
}