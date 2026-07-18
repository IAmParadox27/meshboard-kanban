using System.ComponentModel.DataAnnotations;

namespace Meshboard.Core.Auth
{
    public sealed class UpdateUserRequest
    {
        [Required]
        [MaxLength(200)]
        public string DisplayName { get; set; } = string.Empty;

        [EmailAddress]
        [MaxLength(320)]
        public string? Email { get; set; }

        public bool IsActive { get; set; }

        public bool IsAdmin { get; set; }
    }
}