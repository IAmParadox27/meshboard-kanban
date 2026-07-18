using System.ComponentModel.DataAnnotations;

namespace Meshboard.Core.Auth
{
    public sealed class UpsertUserSourceMappingRequest
    {
        [Required]
        [MaxLength(200)]
        public string ExternalUserId { get; set; } = string.Empty;

        [MaxLength(200)]
        public string? ExternalUsername { get; set; }

        [MaxLength(200)]
        public string? ExternalDisplayName { get; set; }
    }
}