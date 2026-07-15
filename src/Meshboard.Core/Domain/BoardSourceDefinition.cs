using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace Meshboard.Core.Domain
{
    [Table("BoardSourceDefinitions")]
    [Index(nameof(BoardId), nameof(SourceId), IsUnique = true)]
    public class BoardSourceDefinition
    {
        [Key]
        public Guid Id { get; set; }

        public Guid BoardId { get; set; }

        public Guid SourceId { get; set; }

        [ForeignKey(nameof(BoardId))]
        public BoardDefinition? Board { get; set; }

        [ForeignKey(nameof(SourceId))]
        public SourceDefinition? Source { get; set; }
    }
}