using Meshboard.Core.Boards;
using Meshboard.Core.Domain;
using Meshboard.Core.Issues;
using Meshboard.Infrastructure.Database;
using Microsoft.EntityFrameworkCore;

namespace Meshboard.Infrastructure.Boards
{
    public class BoardProvider : IBoardProvider
    {
        private readonly MeshboardDbContext m_dbContext;
        private readonly IExternalIssueProvider m_externalIssueProvider;

        public BoardProvider(
            MeshboardDbContext dbContext,
            IExternalIssueProvider externalIssueProvider)
        {
            m_dbContext = dbContext;
            m_externalIssueProvider = externalIssueProvider;
        }

        public async Task<IReadOnlyList<BoardDefinitionModel>> GetAllAsync(
            CancellationToken cancellationToken = default)
        {
            List<BoardDefinition> boards = await m_dbContext
                .Set<BoardDefinition>()
                .OrderBy(x => x.Name)
                .ToListAsync(cancellationToken);

            List<BoardSourceDefinition> boardSources = await m_dbContext
                .Set<BoardSourceDefinition>()
                .ToListAsync(cancellationToken);

            List<BoardColumnDefinition> boardColumns = await m_dbContext
                .Set<BoardColumnDefinition>()
                .OrderBy(x => x.SortOrder)
                .ThenBy(x => x.Title)
                .ToListAsync(cancellationToken);

            return boards
                .Select(x => Map(
                    x,
                    boardSources
                        .Where(y => y.BoardId == x.Id)
                        .Select(y => y.SourceId)
                        .ToArray(),
                    boardColumns
                        .Where(y => y.BoardId == x.Id)
                        .OrderBy(y => y.SortOrder)
                        .ThenBy(y => y.Title)
                        .ToArray()))
                .ToArray();
        }

        public async Task<BoardDefinitionModel?> GetByIdAsync(
            Guid id,
            CancellationToken cancellationToken = default)
        {
            BoardDefinition? board = await m_dbContext
                .Set<BoardDefinition>()
                .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

            if (board == null)
            {
                return null;
            }

            Guid[] sourceIds = await m_dbContext
                .Set<BoardSourceDefinition>()
                .Where(x => x.BoardId == id)
                .Select(x => x.SourceId)
                .ToArrayAsync(cancellationToken);

            BoardColumnDefinition[] columns = await m_dbContext
                .Set<BoardColumnDefinition>()
                .Where(x => x.BoardId == id)
                .OrderBy(x => x.SortOrder)
                .ThenBy(x => x.Title)
                .ToArrayAsync(cancellationToken);

            return Map(board, sourceIds, columns);
        }

        public async Task<BoardDefinitionModel> CreateAsync(
            UpsertBoardDefinitionRequest request,
            CancellationToken cancellationToken = default)
        {
            BoardDefinition board = new BoardDefinition
            {
                Id = Guid.NewGuid(),
                Name = request.Name,
                Mode = request.Mode,
                Enabled = request.Enabled,
                IsPublic = request.IsPublic,
                CreatedAt = DateTimeOffset.UtcNow,
                UpdatedAt = DateTimeOffset.UtcNow,
            };

            m_dbContext.Set<BoardDefinition>().Add(board);

            foreach (Guid sourceId in request.SourceIds.Distinct())
            {
                m_dbContext.Set<BoardSourceDefinition>().Add(new BoardSourceDefinition
                {
                    Id = Guid.NewGuid(),
                    BoardId = board.Id,
                    SourceId = sourceId,
                });
            }
            
            foreach (UpsertBoardColumnDefinitionRequest column in request.Columns)
            {
                m_dbContext.Set<BoardColumnDefinition>().Add(new BoardColumnDefinition
                {
                    Id = Guid.NewGuid(),
                    BoardId = board.Id,
                    ColumnId = column.ColumnId,
                    Title = column.Title,
                    SortOrder = column.SortOrder,
                });
            }
            
            await m_dbContext.SaveChangesAsync(cancellationToken);

            return Map(
                board,
                request.SourceIds.Distinct().ToArray(),
                request.Columns
                    .OrderBy(x => x.SortOrder)
                    .Select(x => new BoardColumnDefinition
                    {
                        Id = Guid.NewGuid(),
                        BoardId = board.Id,
                        ColumnId = x.ColumnId,
                        Title = x.Title,
                        SortOrder = x.SortOrder,
                    })
                    .ToArray());
        }

        public async Task<BoardDefinitionModel?> UpdateAsync(
            Guid id,
            UpsertBoardDefinitionRequest request,
            CancellationToken cancellationToken = default)
        {
            BoardDefinition? board = await m_dbContext
                .Set<BoardDefinition>()
                .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

            if (board == null)
            {
                return null;
            }

            board.Name = request.Name;
            board.Mode = request.Mode;
            board.Enabled = request.Enabled;
            board.IsPublic = request.IsPublic;
            board.UpdatedAt = DateTimeOffset.UtcNow;

            List<BoardSourceDefinition> existingSources = await m_dbContext.Set<BoardSourceDefinition>()
                .Where(x => x.BoardId == id)
                .ToListAsync(cancellationToken);

            m_dbContext.Set<BoardSourceDefinition>().RemoveRange(existingSources);

            foreach (Guid sourceId in request.SourceIds.Distinct())
            {
                m_dbContext.Set<BoardSourceDefinition>().Add(new BoardSourceDefinition
                {
                    Id = Guid.NewGuid(),
                    BoardId = id,
                    SourceId = sourceId,
                });
            }
            
            List<BoardColumnDefinition> existingColumns = await m_dbContext
                .Set<BoardColumnDefinition>()
                .Where(x => x.BoardId == id)
                .ToListAsync(cancellationToken);

            m_dbContext.Set<BoardColumnDefinition>().RemoveRange(existingColumns);

            foreach (UpsertBoardColumnDefinitionRequest column in request.Columns)
            {
                m_dbContext.Set<BoardColumnDefinition>().Add(new BoardColumnDefinition
                {
                    Id = Guid.NewGuid(),
                    BoardId = id,
                    ColumnId = column.ColumnId,
                    Title = column.Title,
                    SortOrder = column.SortOrder,
                });
            }
            
            await m_dbContext.SaveChangesAsync(cancellationToken);

            return Map(
                board,
                request.SourceIds.Distinct().ToArray(),
                request.Columns
                    .OrderBy(x => x.SortOrder)
                    .Select(x => new BoardColumnDefinition
                    {
                        Id = Guid.NewGuid(),
                        BoardId = board.Id,
                        ColumnId = x.ColumnId,
                        Title = x.Title,
                        SortOrder = x.SortOrder,
                    })
                    .ToArray());
        }

        public async Task<bool> DeleteAsync(
            Guid id,
            CancellationToken cancellationToken = default)
        {
            BoardDefinition? board = await m_dbContext
                .Set<BoardDefinition>()
                .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

            if (board == null)
            {
                return false;
            }

            m_dbContext.Set<BoardDefinition>().Remove(board);
            await m_dbContext.SaveChangesAsync(cancellationToken);
            return true;
        }

        public async Task<BoardDetailsModel?> GetBoardAsync(
            Guid id,
            CancellationToken cancellationToken = default)
        {
            BoardDefinitionModel? board = await GetByIdAsync(id, cancellationToken);

            if (board == null || !board.Enabled)
            {
                return null;
            }

            IReadOnlyList<ExternalIssue> allIssues = await m_externalIssueProvider.GetIssuesAsync(cancellationToken);
            IReadOnlyList<ExternalIssue> issues = board.Mode switch
            {
                BoardMode.DirectFromSources => await GetDirectBoardIssuesAsync(
                    board,
                    allIssues,cancellationToken),

                BoardMode.Curated => await GetCuratedBoardIssuesAsync(
                    board,
                    allIssues,
                    cancellationToken),

                BoardMode.Unassigned => await GetUnassignedBoardIssuesAsync(
                    board,
                    allIssues,
                    cancellationToken),

                _ => [],
            };

            return new BoardDetailsModel
            {
                Board = board,
                Issues = issues,
            };
        }

        public async Task<bool> AddIssueAsync(
            Guid boardId,
            BoardIssueAssignmentRequest request,
            CancellationToken cancellationToken = default)
        {
            BoardDefinition? board = await m_dbContext
                .Set<BoardDefinition>()
                .FirstOrDefaultAsync(x => x.Id == boardId, cancellationToken);

            if (board == null || board.Mode != BoardMode.Curated)
            {
                return false;
            }

            bool exists = await m_dbContext
                .Set<BoardIssueAssignment>()
                .AnyAsync(
                    x => x.BoardId == boardId
                         && x.SourceId == request.SourceId
                         && x.ExternalId == request.ExternalId,
                    cancellationToken);

            if (exists)
            {
                return true;
            }

            m_dbContext.Set<BoardIssueAssignment>().Add(new BoardIssueAssignment
            {
                Id = Guid.NewGuid(),
                BoardId = boardId,
                SourceId = request.SourceId,
                ExternalId = request.ExternalId,
                CreatedAt = DateTimeOffset.UtcNow,
            });

            await m_dbContext.SaveChangesAsync(cancellationToken);
            return true;
        }

        public async Task<bool> RemoveIssueAsync(
            Guid boardId,BoardIssueAssignmentRequest request,
            CancellationToken cancellationToken = default)
        {
            BoardIssueAssignment? assignment = await m_dbContext
                .Set<BoardIssueAssignment>()
                .FirstOrDefaultAsync(
                    x => x.BoardId == boardId
                         && x.SourceId == request.SourceId
                         && x.ExternalId == request.ExternalId,
                    cancellationToken);

            if (assignment == null)
            {
                return false;
            }

            m_dbContext.Set<BoardIssueAssignment>().Remove(assignment);
            await m_dbContext.SaveChangesAsync(cancellationToken);
            return true;
        }

        private async Task<IReadOnlyList<ExternalIssue>> GetDirectBoardIssuesAsync(
            BoardDefinitionModel board,
            IReadOnlyList<ExternalIssue> allIssues,
            CancellationToken cancellationToken)
        {
            HashSet<string> allowedSourceIds = board.SourceIds
                .Select(x => x.ToString())
                .ToHashSet(StringComparer.OrdinalIgnoreCase);

            return allIssues
                .Where(x => allowedSourceIds.Contains(x.SourceKey))
                .ToArray();
        }

        private async Task<IReadOnlyList<ExternalIssue>> GetCuratedBoardIssuesAsync(
            BoardDefinitionModel board,
            IReadOnlyList<ExternalIssue> allIssues,
            CancellationToken cancellationToken)
        {
            HashSet<string> assignedKeys = await m_dbContext
                .Set<BoardIssueAssignment>()
                .Where(x => x.BoardId == board.Id)
                .Select(x => $"{x.SourceId:N}:{x.ExternalId}")
                .ToHashSetAsync(cancellationToken);

            return allIssues
                .Where(x => assignedKeys.Contains(ToAssignmentKey(x.SourceKey, x.ExternalId)))
                .ToArray();
        }
        
        private async Task<IReadOnlyList<ExternalIssue>> GetUnassignedBoardIssuesAsync(
            BoardDefinitionModel board,
            IReadOnlyList<ExternalIssue> allIssues,
            CancellationToken cancellationToken)
        {
            HashSet<string> allowedSourceIds = board.SourceIds
                .Select(x => x.ToString())
                .ToHashSet(StringComparer.OrdinalIgnoreCase);

            IReadOnlyList<ExternalIssue> sourceScopedIssues = allIssues
                .Where(x => allowedSourceIds.Contains(x.SourceKey))
                .ToArray();
            
            Guid[] curatedBoardIds = await m_dbContext
                .Set<BoardDefinition>()
                .Where(x => x.Enabled && x.Mode == BoardMode.Curated)
                .Select(x => x.Id)
                .ToArrayAsync(cancellationToken);

            HashSet<string> assignedKeys = await m_dbContext
                .Set<BoardIssueAssignment>()
                .Where(x => curatedBoardIds.Contains(x.BoardId))
                .Select(x => $"{x.SourceId:N}:{x.ExternalId}")
                .ToHashSetAsync(cancellationToken);

            return sourceScopedIssues
                .Where(x => !assignedKeys.Contains(ToAssignmentKey(x.SourceKey, x.ExternalId)))
                .ToArray();
        }

        private static string ToAssignmentKey(string sourceKey, string externalId)
        {
            return $"{sourceKey.Replace("-", string.Empty, StringComparison.OrdinalIgnoreCase)}:{externalId}";
        }

        private static BoardDefinitionModel Map(
            BoardDefinition board,
            IReadOnlyList<Guid> sourceIds,
            IReadOnlyList<BoardColumnDefinition> columns)
        {
            return new BoardDefinitionModel
            {
                Id = board.Id,
                Name = board.Name,
                Mode = board.Mode,
                Enabled = board.Enabled,
                IsPublic = board.IsPublic,
                SourceIds = sourceIds,
                Columns = columns
                    .OrderBy(x => x.SortOrder)
                    .ThenBy(x => x.Title)
                    .Select(x => new BoardColumnDefinitionModel
                    {
                        ColumnId = x.ColumnId,
                        Title = x.Title,
                        SortOrder = x.SortOrder,
                    })
                    .ToArray(),
                CreatedAt = board.CreatedAt,
                UpdatedAt = board.UpdatedAt,
            };
        }
        
        public async Task<bool> RemoveAllIssuesAsync(
            Guid boardId,
            CancellationToken cancellationToken = default)
        {
            BoardDefinition? board = await m_dbContext
                .Set<BoardDefinition>()
                .FirstOrDefaultAsync(x => x.Id == boardId, cancellationToken);

            if (board == null || board.Mode != BoardMode.Curated)
            {
                return false;
            }

            List<BoardIssueAssignment> assignments = await m_dbContext
                .Set<BoardIssueAssignment>()
                .Where(x => x.BoardId == boardId)
                .ToListAsync(cancellationToken);

            m_dbContext.Set<BoardIssueAssignment>().RemoveRange(assignments);
            await m_dbContext.SaveChangesAsync(cancellationToken);
            return true;
        }
        
        public async Task<bool> MoveAllIssuesAsync(
            Guid boardId,
            MoveBoardIssuesRequest request,
            CancellationToken cancellationToken = default)
        {
            if (boardId == request.TargetBoardId)
            {
                return true;
            }

            BoardDefinition? sourceBoard = await m_dbContext
                .Set<BoardDefinition>()
                .FirstOrDefaultAsync(x => x.Id == boardId, cancellationToken);

            BoardDefinition? targetBoard = await m_dbContext
                .Set<BoardDefinition>()
                .FirstOrDefaultAsync(x => x.Id == request.TargetBoardId, cancellationToken);

            if (sourceBoard == null
                || targetBoard == null
                || sourceBoard.Mode != BoardMode.Curated
                || targetBoard.Mode != BoardMode.Curated)
            {
                return false;
            }

            List<BoardIssueAssignment> sourceAssignments = await m_dbContext
                .Set<BoardIssueAssignment>()
                .Where(x => x.BoardId == boardId)
                .ToListAsync(cancellationToken);

            if (sourceAssignments.Count == 0)
            {
                return true;
            }

            HashSet<string> targetKeys = await m_dbContext
                .Set<BoardIssueAssignment>()
                .Where(x => x.BoardId == request.TargetBoardId)
                .Select(x => ToAssignmentKey(x.SourceId, x.ExternalId))
                .ToHashSetAsync(cancellationToken);

            foreach (BoardIssueAssignment assignment in sourceAssignments)
            {
                string key = ToAssignmentKey(assignment.SourceId, assignment.ExternalId);

                if (targetKeys.Contains(key))
                {
                    continue;
                }

                m_dbContext.Set<BoardIssueAssignment>().Add(new BoardIssueAssignment
                {
                    Id = Guid.NewGuid(),
                    BoardId = request.TargetBoardId,
                    SourceId = assignment.SourceId,
                    ExternalId = assignment.ExternalId,
                    CreatedAt = DateTimeOffset.UtcNow,
                });
            }

            m_dbContext.Set<BoardIssueAssignment>().RemoveRange(sourceAssignments);
            await m_dbContext.SaveChangesAsync(cancellationToken);
            return true;
        }
        
        private static string ToAssignmentKey(Guid sourceId, string externalId)
        {
            return $"{sourceId:N}:{externalId}";
        }
    }
}