namespace Meshboard.Core.Auth
{
    public class CurrentUserModel
    {
        public required Guid Id { get; set; }

        public required string Username { get; set; }

        public required string DisplayName { get; set; }

        public string? Email { get; set; }

        public bool IsAdmin { get; set; }

        public required IReadOnlyList<UserSourceMappingModel> SourceMappings { get; set; }
    }

    public class UserSourceMappingModel
    {
        public required Guid SourceId { get; set; }

        public required string SourceName { get; set; }

        public required string ProviderKey { get; set; }

        public required string ExternalUserId { get; set; }

        public string? ExternalUsername { get; set; }

        public string? ExternalDisplayName { get; set; }
    }

    public class UsersPageModel
    {
        public required IReadOnlyList<UserListItemModel> Users { get; set; }
    }

    public class UserListItemModel
    {
        public required Guid Id { get; set; }

        public required string Username { get; set; }

        public required string DisplayName { get; set; }

        public string? Email { get; set; }

        public bool IsActive { get; set; }

        public bool IsAdmin { get; set; }

        public DateTime CreatedAtUtc { get; set; }

        public DateTime? LastLoginAtUtc { get; set; }
    }
}