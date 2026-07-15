using System.Runtime.Loader;
using Meshboard.Core.Config;
using Meshboard.Core.Extensions;
using Meshboard.Plugin.Database;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;

namespace Meshboard.Infrastructure.Database
{
    public class DatabaseProviderRegistry : IDatabaseProviderRegistry
    {
        private readonly Dictionary<string, IDatabaseProviderPlugin> m_plugins;

        public DatabaseProviderRegistry(IServiceProvider serviceProvider)
        {
            IEnumerable<IDatabaseProviderPlugin> plugins = serviceProvider.GetPluginServices<IDatabaseProviderPlugin>();
            
            m_plugins = plugins.ToDictionary(
                x => x.ProviderKey,
                StringComparer.OrdinalIgnoreCase);
        }

        public IDatabaseProviderPlugin GetRequired(string providerKey)
        {
            if (!m_plugins.TryGetValue(providerKey, out IDatabaseProviderPlugin? plugin))
            {
                throw new InvalidOperationException($"No database provider plugin registered for key '{providerKey}'.");
            }

            return plugin;
        }

        public IReadOnlyCollection<IDatabaseProviderPlugin> GetAll()
        {
            return m_plugins.Values.ToArray();
        }
    }

    public static class DatabaseExtensions
    {
        public static IHostApplicationBuilder AddMeshboardDatabase(this IHostApplicationBuilder builder)
        {
            builder.AddOptionsAndBind<DatabaseSettings>(nameof(DatabaseSettings));
            
            builder.Services.AddSingleton<IDatabaseProviderRegistry, DatabaseProviderRegistry>();
            
            builder.Services.AddDbContext<MeshboardDbContext>((services, options) =>
            {
                DatabaseSettings dbSettings = services.GetRequiredService<IOptions<DatabaseSettings>>().Value;
                IDatabaseProviderRegistry registry = services.GetRequiredService<IDatabaseProviderRegistry>();
                
                IDatabaseProviderPlugin plugin = registry.GetRequired(dbSettings.Provider);
                
                plugin.Configure(options);
            });
            
            return builder;
        }
    }
}