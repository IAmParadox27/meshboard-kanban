namespace Meshboard.Core.Boards
{
    public class BoardsPageModel
    {
        public required IReadOnlyList<BoardDefinitionModel> Boards { get; set; }
    }
}