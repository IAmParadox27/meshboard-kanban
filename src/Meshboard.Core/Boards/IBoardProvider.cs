namespace Meshboard.Core.Boards
{
    public interface IBoardProvider
    {
        Task<IReadOnlyList<BoardDefinitionModel>> GetAllAsync(
            CancellationToken cancellationToken = default);

        Task<BoardDefinitionModel?> GetByIdAsync(
            Guid id,
            CancellationToken cancellationToken = default);

        Task<BoardDefinitionModel> CreateAsync(
            UpsertBoardDefinitionRequest request,
            CancellationToken cancellationToken = default);

        Task<BoardDefinitionModel?> UpdateAsync(
            Guid id,
            UpsertBoardDefinitionRequest request,
            CancellationToken cancellationToken = default);

        Task<bool> DeleteAsync(
            Guid id,
            CancellationToken cancellationToken = default);

        Task<BoardDetailsModel?> GetBoardAsync(
            Guid id,
            CancellationToken cancellationToken = default);

        Task<bool> AddIssueAsync(
            Guid boardId,
            BoardIssueAssignmentRequest request,
            CancellationToken cancellationToken = default);

        Task<bool> RemoveIssueAsync(
            Guid boardId,
            BoardIssueAssignmentRequest request,
            CancellationToken cancellationToken = default);
        
        Task<bool> RemoveAllIssuesAsync(
            Guid boardId,
            CancellationToken cancellationToken = default);
    }
}