using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace Meshboard.Core.Domain
{
    [Index(nameof(Provider), nameof(Issuer), nameof(Subject), IsUnique = true)]
    [Index(nameof(UserId))]
    [Table("UserExternalLogins")]
    public sealed class UserExternalLogin
    {
        [Key]
        public Guid Id { get; set; }

        public Guid UserId { get; set; }

        [Required]
        [MaxLength(50)]
        public string Provider { get; set; } = string.Empty;

        [Required]
        [MaxLength(500)]
        public string Issuer { get; set; } = string.Empty;

        [Required]
        [MaxLength(500)]
        public string Subject { get; set; } = string.Empty;

        [MaxLength(320)]
        public string? Email { get; set; }

        [MaxLength(200)]
        public string? DisplayName { get; set; }

        public DateTime LinkedAtUtc { get; set; }

        [ForeignKey(nameof(UserId))]
        public User User { get; set; } = null!;
    }
}