namespace Meshboard.Core.Domain
{
    public sealed class UserAuthenticationResult
    {
        public bool Success { get; }

        public User? User { get; }

        public string? FailureReason { get; }

        private UserAuthenticationResult(bool success, User? user, string? failureReason)
        {
            Success = success;
            User = user;
            FailureReason = failureReason;
        }

        public static UserAuthenticationResult Succeeded(User user)
        {
            return new UserAuthenticationResult(true, user, null);
        }

        public static UserAuthenticationResult Failed(string failureReason)
        {
            return new UserAuthenticationResult(false, null, failureReason);
        }
    }
}