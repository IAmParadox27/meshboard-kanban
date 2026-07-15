using Meshboard.Plugin.Database;
using Meshboard.Plugin.Sqlite.Settings;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace Meshboard.Plugin.Sqlite
{
    public class SqliteDatabaseProvider : IDatabaseProviderPlugin
    {
        private readonly SqliteSettings m_settings;
        
        public string ProviderKey => "sqlite";

        public SqliteDatabaseProvider(IOptions<SqliteSettings> settings)
        {
            m_settings = settings.Value;
        }
        
        public void Configure(DbContextOptionsBuilder optionsBuilder)
        {
            SqliteConnectionStringBuilder connectionStringBuilder = new SqliteConnectionStringBuilder
            {
                DataSource = m_settings.DataSource
            };
            
            optionsBuilder.UseSqlite(connectionStringBuilder.ToString());
        }
    }
}