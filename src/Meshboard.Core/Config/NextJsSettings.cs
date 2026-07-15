namespace Meshboard.Core.Config
{
    public class NextJsSettings
    {
        public bool Enabled { get; set; }
        public int Port { get; set; }
        public string Path { get; set; } = null!;
        public string StartupScript { get; set; } = null!;
    }
}