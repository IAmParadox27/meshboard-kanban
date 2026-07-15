using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace Meshboard.Core.Config
{
    public static class ConfigBindings
    {
        public static IHostApplicationBuilder AddOptionsAndBind<TOptions>(this IHostApplicationBuilder builder, string sectionName) where TOptions : class
        {
            builder.Services.AddOptions<TOptions>()
                .Bind(builder.Configuration.GetSection(GetSectionName(sectionName)));
            
            return builder;
        }
        
        public static string GetSectionName(string sectionName)
        {
            string removeString = "Settings";
            if (sectionName.EndsWith(removeString))
            {
                return sectionName.Substring(0, sectionName.Length - removeString.Length);
            }
            
            return sectionName;
        }
    }
}