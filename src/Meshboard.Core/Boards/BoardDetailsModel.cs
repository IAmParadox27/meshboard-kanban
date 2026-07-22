using Meshboard.Core.Issues;

namespace Meshboard.Core.Boards
{
    public class BoardDetailsModel
    {
        public required BoardDefinitionModel Board { get; set; }

        public required IReadOnlyList<BoardIssueSummaryModel> Issues { get; set; }
    }
}