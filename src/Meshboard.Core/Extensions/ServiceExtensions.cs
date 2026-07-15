using Microsoft.Extensions.DependencyInjection;

namespace Meshboard.Core.Extensions
{
    public static class ServiceExtensions
    {
        public static IEnumerable<TService> GetPluginServices<TService>(this IServiceProvider serviceProvider)
        {
            return serviceProvider.GetKeyedServices<TService>(typeof(TService).Name);
        }
    }
}