using Meshboard.Core.Config;
using Meshboard.Plugin.Fider.Config;
using Meshboard.Plugin.Library;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Meshboard.Plugin.Fider
{
    public class ServiceRegistrator : IPluginServiceRegistrator
    {
        public void RegisterServices(IServiceCollection services, IConfiguration configuration)
        {
            services.AddOptions<FiderSettings>().Bind(configuration.GetSection(ConfigBindings.GetSectionName(nameof(FiderSettings))));
        }
    }
}