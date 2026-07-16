namespace Meshboard.Core.Boards
{
    public class BoardColumnDefinitionModel
    {
        public string ColumnId { get; set; } = string.Empty;

        public string Title { get; set; } = string.Empty;

        public int SortOrder { get; set; }
    }
}