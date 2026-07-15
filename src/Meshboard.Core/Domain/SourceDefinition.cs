using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace Meshboard.Core.Domain
{
    [Table("SourceDefinitions")]
    [Index(nameof(Name), IsUnique = true)]
    public class SourceDefinition
    {
        [Key]
        public Guid Id { get; set; }
        
        public string Name { get; set; } = string.Empty;
        
        public string ProviderKey { get; set; } = string.Empty;
        
        public bool Enabled { get; set; } = true;
        
        public string ConfigJson { get; set; } = "{}";
        
        public DateTimeOffset CreatedAt { get; set; }
        
        public DateTimeOffset UpdatedAt { get; set; }
    }
}