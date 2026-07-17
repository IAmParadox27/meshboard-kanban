namespace Meshboard.Core.Sources
{
    public class SourceCapabilitiesModel
    {
        public bool CanReadDetails { get; set; }

        public bool CanComment { get; set; }

        public bool CanMoveIssue { get; set; }

        public bool CanAssignUser { get; set; }

        public bool CanCreateIssue { get; set; }
    }
}