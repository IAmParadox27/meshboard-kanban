using System.Reflection;
using System.Runtime.Loader;

namespace Meshboard.Infrastructure.Plugins
{
    public sealed class PluginLoadContext : AssemblyLoadContext
    {
        private readonly AssemblyDependencyResolver m_resolver;
        private readonly HashSet<string> m_sharedAssemblies;

        public PluginLoadContext(
            string pluginAssemblyPath,
            params string[] sharedAssemblies)
            : base(isCollectible: true)
        {
            m_resolver = new AssemblyDependencyResolver(pluginAssemblyPath);
            m_sharedAssemblies = new HashSet<string>(
                sharedAssemblies,
                StringComparer.OrdinalIgnoreCase);
        }

        protected override Assembly? Load(AssemblyName assemblyName)
        {
            if (assemblyName.Name is not null &&
                m_sharedAssemblies.Contains(assemblyName.Name))
            {
                return null;
            }

            string? path = m_resolver.ResolveAssemblyToPath(assemblyName);

            return path is null
                ? null
                : LoadFromAssemblyPath(path);
        }

        protected override nint LoadUnmanagedDll(string unmanagedDllName)
        {
            string? path =
                m_resolver.ResolveUnmanagedDllToPath(unmanagedDllName);

            return path is null
                ? nint.Zero
                : LoadUnmanagedDllFromPath(path);
        }
    }
}