using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace Meshboard.Core.Domain
{
    [Index(nameof(Username), IsUnique = true)]
    [Index(nameof(Email))]
    [Table("Users")]
    public sealed class User
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string Username { get; set; } = string.Empty;

        [MaxLength(512)]
        public string? PasswordHash { get; set; }

        [MaxLength(320)]
        public string? Email { get; set; }

        [Required]
        [MaxLength(200)]
        public string DisplayName { get; set; } = string.Empty;

        public bool IsActive { get; set; }

        public bool IsAdmin { get; set; }

        public DateTime CreatedAtUtc { get; set; }

        public DateTime? LastLoginAtUtc { get; set; }

        [InverseProperty(nameof(UserExternalLogin.User))]
        public List<UserExternalLogin> ExternalLogins { get; set; } = [];

        [InverseProperty(nameof(UserSourceMapping.User))]
        public List<UserSourceMapping> SourceMappings { get; set; } = [];
    }
}