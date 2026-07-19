namespace Meshboard.Core.Boards
{
    public class UpsertBoardDefinitionRequest
    {
        public string Name { get; set; } = string.Empty;

        public BoardMode Mode { get; set; }

        public bool Enabled { get; set; } = true;

        public bool IsPublic { get; set; } = false;

        public IReadOnlyList<Guid> SourceIds { get; set; } = [];
        
        public IReadOnlyList<UpsertBoardColumnDefinitionRequest> Columns { get; set; } = [];
    }
}