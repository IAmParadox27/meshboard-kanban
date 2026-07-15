using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Meshboard.Plugin.Library
{
    public interface IPluginServiceRegistrator
    {
        void RegisterServices(IServiceCollection services, IConfiguration configuration);
    }

    public interface IPluginHasDatabase
    {
        Type GetDatabaseSettingsType();
    }
}