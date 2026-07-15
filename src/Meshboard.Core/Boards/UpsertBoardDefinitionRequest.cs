namespace Meshboard.Core.Boards
{
    public class UpsertBoardDefinitionRequest
    {
        public string Name { get; set; } = string.Empty;

        public BoardMode Mode { get; set; }

        public bool Enabled { get; set; } = true;

        public IReadOnlyList<Guid> SourceIds { get; set; } = [];
    }
}