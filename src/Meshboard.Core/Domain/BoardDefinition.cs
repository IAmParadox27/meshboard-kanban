using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Meshboard.Core.Boards;
using Microsoft.EntityFrameworkCore;

namespace Meshboard.Core.Domain
{
    [Table("BoardDefinitions")]
    [Index(nameof(Name), IsUnique = true)]
    public class BoardDefinition
    {
        [Key]
        public Guid Id { get; set; }

        public string Name { get; set; } = string.Empty;

        public BoardMode Mode { get; set; }

        public bool Enabled { get; set; } = true;
        
        public bool IsPublic { get; set; } = false;

        public DateTimeOffset CreatedAt { get; set; }

        public DateTimeOffset UpdatedAt { get; set; }
    }
}