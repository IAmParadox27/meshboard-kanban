using System.Diagnostics;
using System.Reflection;
using System.Runtime.Loader;
using Meshboard.Core.Config;
using Meshboard.Infrastructure.Plugins;
using Meshboard.Plugin.Database;
using Meshboard.Plugin.Library;
using Meshboard.Plugin.Sources;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace Meshboard.Api.Middleware
{
    public static class PluginInstaller
    {
        private static List<AssemblyLoadContext> s_pluginContexts = new List<AssemblyLoadContext>();
        
        public static IHostApplicationBuilder DetectAndInstallPlugins(this IHostApplicationBuilder builder)
        {
            PluginSettings pluginSettings = builder.Configuration.Get<PluginSettings>() ?? new PluginSettings();
            
            DirectoryInfo pluginsDirectory = new DirectoryInfo(pluginSettings.InstallDirectory);
            if (!pluginsDirectory.Exists)
            {
                return builder;
            }

            string?[] sharedAssemblies = new HashSet<string?>(AssemblyLoadContext.Default.Assemblies.Select(x => x.GetName().Name)).ToArray();
            foreach (DirectoryInfo plugin in pluginsDirectory.GetDirectories())
            {
                FileInfo pluginAssembly = plugin.GetFiles($"{plugin.Name}.dll", SearchOption.TopDirectoryOnly).Single();
                PluginLoadContext pluginContext = new PluginLoadContext(pluginAssembly.FullName, sharedAssemblies.ToArray());

                pluginContext.LoadFromAssemblyPath(pluginAssembly.FullName);
                
                s_pluginContexts.Add(pluginContext);
            }
            
            Type[] pluginTypes = new[]
            {
                typeof(IDatabaseProviderPlugin),
                typeof(IIssueSourcePlugin),
            };

            Type[] concreteTypes = AssemblyLoadContext.All.SelectMany(x => x.Assemblies)
                .SelectMany(x => x.GetTypes())
                .Where(x => !x.IsAbstract && !x.IsInterface)
                .ToArray();
            
            IEnumerable<IPluginServiceRegistrator> registrators = concreteTypes
                .Where(x => typeof(IPluginServiceRegistrator).IsAssignableFrom(x))
                .Select(Activator.CreateInstance)
                .Cast<IPluginServiceRegistrator>();

            foreach (IPluginServiceRegistrator registrator in registrators)
            {
                registrator.RegisterServices(builder.Services, builder.Configuration);
                
                if (registrator is IPluginHasDatabase pluginHasDatabase)
                {
                    Type dbSettingsType = pluginHasDatabase.GetDatabaseSettingsType();

                    if (!dbSettingsType.IsAssignableTo(typeof(PluginDatabaseSettings)))
                    {
                        throw new InvalidOperationException($"Database settings type {dbSettingsType.FullName} is not assignable to {typeof(PluginDatabaseSettings).FullName}.");
                    }

                    MethodInfo addOptionsMethodInfo = typeof(OptionsServiceCollectionExtensions)
                        .GetMethods()
                        .Single(x =>
                            x.Name == nameof(OptionsServiceCollectionExtensions.AddOptions)
                            && x.IsGenericMethodDefinition
                            && x.GetParameters().Length == 1);

                    MethodInfo bindMethodInfo = typeof(OptionsBuilderConfigurationExtensions)
                        .GetMethods()
                        .Single(x =>
                            x.Name == nameof(OptionsBuilderConfigurationExtensions.Bind)
                            && x.IsGenericMethodDefinition
                            && x.GetParameters().Length == 2);
                    
                    MethodInfo genericAddOptionsMethodInfo = addOptionsMethodInfo.MakeGenericMethod(dbSettingsType);

                    object? optionsBuilder = genericAddOptionsMethodInfo.Invoke(null, [builder.Services]);

                    if (optionsBuilder != null)
                    {
                        MethodInfo genericBindMethodInfo = bindMethodInfo.MakeGenericMethod(dbSettingsType);
                        
                        genericBindMethodInfo.Invoke(null, [
                            optionsBuilder, 
                            builder.Configuration.GetSection($"{ConfigBindings.GetSectionName(nameof(DatabaseSettings))}:{ConfigBindings.GetSectionName(dbSettingsType.Name)}")
                        ]);
                    }
                }
            }
            
            IEnumerable<Type> plugins = concreteTypes.Where(x => pluginTypes.Any(x.IsAssignableTo));
            
            foreach (Type plugin in plugins)
            {
                foreach (Type interfaceType in pluginTypes)
                {
                    if (plugin.IsAssignableTo(interfaceType))
                    {
                        // The service registrator might already have handled this for us, just ignore the ones that are already registered.
                        bool serviceRegistered = (new[] { ServiceLifetime.Scoped, ServiceLifetime.Singleton, ServiceLifetime.Transient })
                            .Any(x => builder.Services.Contains(new ServiceDescriptor(interfaceType, plugin, x)));
                        
                        if (!serviceRegistered)
                        {
                            builder.Services.AddKeyedSingleton(interfaceType, interfaceType.Name, plugin);
                        }
                    }
                }
            }

            return builder;
        }
    }
}