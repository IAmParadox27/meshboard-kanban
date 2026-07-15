namespace Meshboard.Plugin.Database
{
    public interface IDatabaseProviderRegistry
    {
        IDatabaseProviderPlugin GetRequired(string providerKey);

        IReadOnlyCollection<IDatabaseProviderPlugin> GetAll();
    }
}