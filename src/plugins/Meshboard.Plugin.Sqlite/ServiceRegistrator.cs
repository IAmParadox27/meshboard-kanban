using Meshboard.Plugin.Library;
using Meshboard.Plugin.Sqlite.Settings;
using Microsoft.Extensions.DependencyInjection;

namespace Meshboard.Plugin.Sqlite
{
    public class ServiceRegistrator : IPluginServiceRegistrator, IPluginHasDatabase
    {
        public void RegisterServices(IServiceCollection services)
        {
        }

        public Type GetDatabaseSettingsType()
        {
            return typeof(SqliteSettings);
        }
    }
}