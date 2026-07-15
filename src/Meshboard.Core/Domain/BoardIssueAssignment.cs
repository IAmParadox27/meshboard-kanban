using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace Meshboard.Core.Domain
{
    [Table("BoardIssueAssignments")]
    [Index(nameof(BoardId), nameof(SourceId), nameof(ExternalId), IsUnique = true)]
    public class BoardIssueAssignment
    {
        [Key]
        public Guid Id { get; set; }

        public Guid BoardId { get; set; }

        public Guid SourceId { get; set; }

        public string ExternalId { get; set; } = string.Empty;

        public DateTimeOffset CreatedAt { get; set; }

        [ForeignKey(nameof(BoardId))]
        public BoardDefinition? Board { get; set; }

        [ForeignKey(nameof(SourceId))]
        public SourceDefinition? Source { get; set; }
    }
}