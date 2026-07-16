using Meshboard.Core.Boards;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Meshboard.Api.Controllers
{
    [ApiController]
    [Authorize]
    [Route("[controller]")]
    public class BoardsController : ControllerBase
    {
        [HttpGet]
        public async Task<ActionResult<BoardsPageModel>> GetBoards(
            [FromServices] IBoardProvider boardProvider,
            CancellationToken cancellationToken = default)
        {
            IReadOnlyList<BoardDefinitionModel> boards = await boardProvider.GetAllAsync(cancellationToken);

            return Ok(new BoardsPageModel
            {
                Boards = boards,
            });
        }

        [HttpGet("{id:guid}")]
        public async Task<ActionResult<BoardDetailsModel>> GetBoard(
            Guid id,
            [FromServices] IBoardProvider boardProvider,
            CancellationToken cancellationToken = default)
        {
            BoardDetailsModel? board = await boardProvider.GetBoardAsync(id, cancellationToken);

            if (board == null)
            {
                return NotFound();
            }

            return Ok(board);
        }

        [HttpPost]
        public async Task<ActionResult<BoardDefinitionModel>> CreateBoard(
            [FromBody] UpsertBoardDefinitionRequest request,
            [FromServices] IBoardProvider boardProvider,
            CancellationToken cancellationToken = default)
        {
            BoardDefinitionModel created = await boardProvider.CreateAsync(request, cancellationToken);
            return Ok(created);
        }

        [HttpPut("{id:guid}")]
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

        [HttpDelete("{id:guid}")]public async Task<IActionResult> DeleteBoard(
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
    }
}