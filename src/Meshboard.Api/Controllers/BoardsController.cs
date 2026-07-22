using Meshboard.Core.Boards;
using Meshboard.Core.Issues;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Meshboard.Api.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class BoardsController : ControllerBase
    {
        [HttpGet]
        [AllowAnonymous]
        public async Task<ActionResult<BoardsPageModel>> GetBoards(
            [FromServices] IBoardProvider boardProvider,
            CancellationToken cancellationToken = default)
        {
            bool isAuthenticated = User.Identity?.IsAuthenticated == true;
            bool isAdmin = User.IsInRole("Admin");

            IReadOnlyList<BoardDefinitionModel> boards = await boardProvider.GetAllAsync(cancellationToken);
            IReadOnlyList<BoardDefinitionModel> visibleBoards = boards
                .Where(board => CanViewBoard(board, isAuthenticated, isAdmin))
                .ToArray();

            return Ok(new BoardsPageModel
            {
                Boards = visibleBoards,
            });
        }

        [HttpGet("{id:guid}")]
        [AllowAnonymous]
        public async Task<ActionResult<BoardDetailsModel>> GetBoard(
            Guid id,
            [FromServices] IBoardProvider boardProvider,
            CancellationToken cancellationToken = default)
        {
            bool isAuthenticated = User.Identity?.IsAuthenticated == true;
            bool isAdmin = User.IsInRole("Admin");

            BoardDefinitionModel? boardDefinition = await boardProvider.GetByIdAsync(id, cancellationToken);

            if (boardDefinition == null || !CanViewBoard(boardDefinition, isAuthenticated, isAdmin))
            {
                return NotFound();
            }

            BoardDetailsModel? board = await boardProvider.GetBoardAsync(id, cancellationToken);

            if (board == null)
            {
                return NotFound();
            }

            return Ok(board);
        }

        [HttpGet("{id:guid}/issues/{sourceId:guid}/{detailsLookupKey}")]
        [AllowAnonymous]
        public async Task<ActionResult<ExternalIssueDetails>> GetBoardIssueDetails(
            Guid id,
            Guid sourceId,
            string detailsLookupKey,
            [FromServices] IBoardProvider boardProvider,
            [FromServices] IExternalIssueProvider externalIssueProvider,
            CancellationToken cancellationToken = default)
        {
            bool isAuthenticated = User.Identity?.IsAuthenticated == true;
            bool isAdmin = User.IsInRole("Admin");

            BoardDefinitionModel? boardDefinition = await boardProvider.GetByIdAsync(id, cancellationToken);

            if (boardDefinition == null || !CanViewBoard(boardDefinition, isAuthenticated, isAdmin))
            {
                return NotFound();
            }
            //
            // BoardDetailsModel? board = await boardProvider.GetBoardAsync(id, cancellationToken);
            //
            // if (board == null)
            // {
            //     return NotFound();
            // }
            //
            // bool issueIsOnBoard = board.Issues.Any(
            //     issue => string.Equals(issue.SourceKey, sourceId.ToString(), StringComparison.OrdinalIgnoreCase)
            //              && string.Equals(issue.DetailsLookupKey, detailsLookupKey, StringComparison.OrdinalIgnoreCase));
            //
            // if (!issueIsOnBoard)
            // {
            //     return NotFound();
            // }

            ExternalIssueDetails? details = await externalIssueProvider.GetIssueDetailsAsync(
                sourceId,
                detailsLookupKey,
                cancellationToken);

            if (details == null)
            {
                return NotFound();
            }

            return Ok(details);
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<BoardDefinitionModel>> CreateBoard(
            [FromBody] UpsertBoardDefinitionRequest request,
            [FromServices] IBoardProvider boardProvider,
            CancellationToken cancellationToken = default)
        {
            BoardDefinitionModel created = await boardProvider.CreateAsync(request, cancellationToken);
            return Ok(created);
        }

        [HttpPut("{id:guid}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<BoardDefinitionModel>> UpdateBoard(
            Guid id,
            [FromBody] UpsertBoardDefinitionRequest request,
            [FromServices] IBoardProvider boardProvider,
            CancellationToken cancellationToken = default)
        {
            BoardDefinitionModel? updated = await boardProvider.UpdateAsync(id, request, cancellationToken);

            if (updated == null)
            {
                return NotFound();
            }

            return Ok(updated);
        }

        [HttpDelete("{id:guid}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteBoard(
            Guid id,
            [FromServices] IBoardProvider boardProvider,
            CancellationToken cancellationToken = default)
        {
            bool deleted = await boardProvider.DeleteAsync(id, cancellationToken);

            if (!deleted)
            {
                return NotFound();
            }

            return NoContent();
        }

        [HttpPost("{id:guid}/issues")]
        [Authorize]
        public async Task<IActionResult> AddIssueToBoard(
            Guid id,
            [FromBody] BoardIssueAssignmentRequest request,
            [FromServices] IBoardProvider boardProvider,
            CancellationToken cancellationToken = default)
        {
            bool added = await boardProvider.AddIssueAsync(id, request, cancellationToken);

            if (!added)
            {
                return BadRequest();
            }

            return NoContent();
        }

        [HttpDelete("{id:guid}/issues")]
        [Authorize]
        public async Task<IActionResult> RemoveIssueFromBoard(
            Guid id,
            [FromBody] BoardIssueAssignmentRequest request,
            [FromServices] IBoardProvider boardProvider,
            CancellationToken cancellationToken = default)
        {
            bool removed = await boardProvider.RemoveIssueAsync(id, request, cancellationToken);

            if (!removed)
            {
                return NotFound();
            }

            return NoContent();
        }
        
        [HttpDelete("{id:guid}/clear")]
        [Authorize]
        public async Task<IActionResult> RemoveAllIssues(
            Guid id,
            [FromServices] IBoardProvider boardProvider,
            CancellationToken cancellationToken)
        {
            bool removed = await boardProvider.RemoveAllIssuesAsync(id, cancellationToken);

            if (!removed)
            {
                return NotFound();
            }

            return NoContent();
        }
        
        [HttpPost("{id:guid}/issues/move")]
        [Authorize]
        public async Task<IActionResult> MoveAllIssues(
            Guid id,
            [FromBody] MoveBoardIssuesRequest request,
            [FromServices] IBoardProvider boardProvider,
            CancellationToken cancellationToken = default)
        {
            bool moved = await boardProvider.MoveAllIssuesAsync(id, request, cancellationToken);

            if (!moved)
            {
                return BadRequest();
            }

            return NoContent();
        }

        private static bool CanViewBoard(
            BoardDefinitionModel board,
            bool isAuthenticated,
            bool isAdmin)
        {
            if (isAdmin)
            {
                return true;
            }

            if (!board.Enabled)
            {
                return false;
            }

            return board.IsPublic || isAuthenticated;
        }
    }
}