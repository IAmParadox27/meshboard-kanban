using System.ComponentModel.DataAnnotations;

namespace Meshboard.Core.Auth
{
    public sealed class UpdateCurrentUserRequest
    {
        [Required]
        [MaxLength(200)]
        public string DisplayName { get; set; } = string.Empty;

        [EmailAddress]
        [MaxLength(320)]
        public string? Email { get; set; }
    }
}