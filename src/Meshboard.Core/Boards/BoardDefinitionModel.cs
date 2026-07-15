namespace Meshboard.Core.Boards
{
    public class BoardDefinitionModel
    {
        public Guid Id { get; set; }

        public string Name { get; set; } = string.Empty;

        public BoardMode Mode { get; set; }

        public bool Enabled { get; set; }

        public IReadOnlyList<Guid> SourceIds { get; set; } = [];

        public DateTimeOffset CreatedAt { get; set; }

        public DateTimeOffset UpdatedAt { get; set; }
    }
}