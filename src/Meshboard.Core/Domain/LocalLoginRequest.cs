using System.ComponentModel.DataAnnotations;

namespace Meshboard.Core.Domain
{
    public sealed class LocalLoginRequest
    {
        [Required] 
        public string Username { get; set; } = string.Empty;

        [Required] 
        public string Password { get; set; } = string.Empty;

        public bool RememberMe { get; set; }

        public string? ReturnUrl { get; set; }
    }
}