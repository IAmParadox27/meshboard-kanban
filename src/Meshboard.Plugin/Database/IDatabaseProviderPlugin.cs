using Microsoft.EntityFrameworkCore;

namespace Meshboard.Plugin.Database
{
    public interface IDatabaseProviderPlugin
    {
        string ProviderKey { get; }

        void Configure(DbContextOptionsBuilder optionsBuilder);
    }
}