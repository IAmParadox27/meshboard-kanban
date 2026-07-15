using System.Text.Json;
using Meshboard.Core.Domain;
using Meshboard.Core.Extensions;
using Meshboard.Core.Sources;
using Meshboard.Infrastructure.Database;
using Meshboard.Plugin.Sources;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Meshboard.Infrastructure.Sources
{
    public class SourceProvider : ISourceProvider
    {
        private readonly IEnumerable<IIssueSourcePlugin> m_plugins;
        private readonly MeshboardDbContext m_dbContext;

        public SourceProvider(IServiceProvider serviceProvider, MeshboardDbContext dbContext)
        {
            m_dbContext = dbContext;
            m_plugins = serviceProvider.GetPluginServices<IIssueSourcePlugin>();
        }
        
        public Task<IReadOnlyList<SourceSummary>> GetSourcesAsync(
            CancellationToken cancellationToken = default)
        {
            IReadOnlyList<SourceSummary> sources =
            [
            ];

            return Task.FromResult(sources);
        }
        
        public IReadOnlyList<SourceProviderDefinition> GetProviders()
        {
            return m_plugins
                .Select(x => x.GetDefinition())
                .OrderBy(x => x.DisplayName)
                .ToArray();
        }
        public async Task<IReadOnlyList<SourceDefinitionModel>> GetAllAsync(
            CancellationToken cancellationToken = default)
        {
            List<SourceDefinition> definitions = await m_dbContext
                .Set<SourceDefinition>()
                .OrderBy(x => x.Name)
                .ToListAsync(cancellationToken);

            return definitions
                .Select(Map)
                .ToArray();
        }

        public async Task<SourceDefinitionModel?> GetByIdAsync(
            Guid id,
            CancellationToken cancellationToken = default)
        {
            SourceDefinition? definition = await m_dbContext
                .Set<SourceDefinition>()
                .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

            return definition == null ? null : Map(definition);
        }

        public async Task<SourceDefinitionModel> CreateAsync(
            UpsertSourceDefinitionRequest request,
            CancellationToken cancellationToken = default)
        {
            SourceDefinition definition = new SourceDefinition
            {
                Id = Guid.NewGuid(),
                Name = request.Name,
                ProviderKey = request.ProviderKey,
                Enabled = request.Enabled,
                ConfigJson = JsonSerializer.Serialize(request.Config),
                CreatedAt = DateTimeOffset.UtcNow,
                UpdatedAt = DateTimeOffset.UtcNow,
            };m_dbContext.Set<SourceDefinition>().Add(definition);
            await m_dbContext.SaveChangesAsync(cancellationToken);

            return Map(definition);
        }

        public async Task<SourceDefinitionModel?> UpdateAsync(
            Guid id,
            UpsertSourceDefinitionRequest request,
            CancellationToken cancellationToken = default)
        {
            SourceDefinition? definition = await m_dbContext
                .Set<SourceDefinition>()
                .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

            if (definition == null)
            {
                return null;
            }

            definition.Name = request.Name;
            definition.ProviderKey = request.ProviderKey;
            definition.Enabled = request.Enabled;
            definition.ConfigJson = JsonSerializer.Serialize(request.Config);
            definition.UpdatedAt = DateTimeOffset.UtcNow;

            await m_dbContext.SaveChangesAsync(cancellationToken);
            return Map(definition);
        }

        public async Task<bool> DeleteAsync(
            Guid id,
            CancellationToken cancellationToken = default)
        {
            SourceDefinition? definition = await m_dbContext
                .Set<SourceDefinition>()
                .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

            if (definition == null)
            {
                return false;
            }

            m_dbContext.Set<SourceDefinition>().Remove(definition);
            await m_dbContext.SaveChangesAsync(cancellationToken);
            return true;
        }

        private static SourceDefinitionModel Map(SourceDefinition definition)
        {
            Dictionary<string, string>? config = JsonSerializer.Deserialize<Dictionary<string, string>>(definition.ConfigJson);

            return new SourceDefinitionModel
            {
                Id = definition.Id,
                Name = definition.Name,ProviderKey = definition.ProviderKey,
                Enabled = definition.Enabled,
                Config = config ?? new Dictionary<string, string>(),
                CreatedAt = definition.CreatedAt,
                UpdatedAt = definition.UpdatedAt,
            };
        }
    }
}