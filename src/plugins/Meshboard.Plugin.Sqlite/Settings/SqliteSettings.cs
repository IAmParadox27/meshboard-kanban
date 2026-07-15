using Meshboard.Core.Config;

namespace Meshboard.Plugin.Sqlite.Settings
{
    public class SqliteSettings : PluginDatabaseSettings
    {
        public string DataSource { get; set; } = string.Empty;
    }
}