using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace Meshboard.Core.Domain
{
    [Index(nameof(UserId), nameof(SourceId), IsUnique = true)]
    [Index(nameof(SourceId), nameof(ExternalUserId))]
    [Table("UserSourceMappings")]
    public sealed class UserSourceMapping
    {
        [Key]
        public Guid Id { get; set; }

        public Guid UserId { get; set; }

        public Guid SourceId { get; set; }

        [Required]
        [MaxLength(200)]
        public string ExternalUserId { get; set; } = string.Empty;

        [MaxLength(200)]
        public string? ExternalUsername { get; set; }

        [MaxLength(200)]
        public string? ExternalDisplayName { get; set; }

        public DateTime CreatedAtUtc { get; set; }

        public DateTime UpdatedAtUtc { get; set; }

        [ForeignKey(nameof(UserId))]
        public User User { get; set; } = null!;

        [ForeignKey(nameof(SourceId))]
        public SourceDefinition Source { get; set; } = null!;
    }
}