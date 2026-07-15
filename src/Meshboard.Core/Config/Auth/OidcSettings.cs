namespace Meshboard.Core.Config.Auth
{
    public class OidcSettings
    {
        public string Scheme { get; set; }
        
        public string Authority { get; set; }
        
        public string ClientId { get; set; }
        
        public string ClientSecret { get; set; }
        
        public string? CallbackPath { get; set; }
        
        public string? Scope { get; set; } = "openid profile email";
        
        public string? AdminGroup { get; set; } = "admin";
        
        public string? UserGroup { get; set; } = "*";

        public bool AutoCreateUser { get; set; } = true;
    }
}