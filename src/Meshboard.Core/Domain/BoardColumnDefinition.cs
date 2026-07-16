using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace Meshboard.Core.Domain
{
    [Table("BoardColumnDefinitions")]
    [Index(nameof(BoardId), nameof(ColumnId), IsUnique = true)]
    [Index(nameof(BoardId), nameof(SortOrder))]
    public class BoardColumnDefinition
    {
        [Key]
        public Guid Id { get; set; }

        public Guid BoardId { get; set; }

        public string ColumnId { get; set; } = string.Empty;

        public string Title { get; set; } = string.Empty;

        public int SortOrder { get; set; }

        [ForeignKey(nameof(BoardId))]
        public BoardDefinition? Board { get; set; }
    }
}