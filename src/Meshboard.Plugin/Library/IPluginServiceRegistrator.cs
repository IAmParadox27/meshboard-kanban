using Microsoft.Extensions.DependencyInjection;

namespace Meshboard.Plugin.Library
{
    public interface IPluginServiceRegistrator
    {
        void RegisterServices(IServiceCollection services);
    }

    public interface IPluginHasDatabase
    {
        Type GetDatabaseSettingsType();
    }
}