using Meshboard.Core.Sources;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Meshboard.Api.Controllers
{
    [ApiController]
    [Authorize]
    [Route("[controller]")]
    public class SourcesController : ControllerBase
    {
        [HttpGet]
        public async Task<ActionResult<IReadOnlyList<SourceSummary>>> GetSources(
            [FromServices] ISourceProvider sourceProvider,
            CancellationToken cancellationToken)
        {
            SourcesPageModel response = new SourcesPageModel
            {
                Providers = sourceProvider.GetProviders(),
                Sources = await sourceProvider.GetAllAsync(cancellationToken),
            };
            
            return Ok(response);
        }
        [HttpPost]
        public async Task<ActionResult<SourceDefinitionModel>> CreateSource(
            [FromBody] UpsertSourceDefinitionRequest request,
            [FromServices] ISourceProvider sourceProvider,
            CancellationToken cancellationToken = default)
        {
            SourceDefinitionModel created = await sourceProvider.CreateAsync(request, cancellationToken);
            return Ok(created);
        }

        [HttpPut("{id:guid}")]
        public async Task<ActionResult<SourceDefinitionModel>> UpdateSource(
            Guid id,
            [FromBody] UpsertSourceDefinitionRequest request,
            [FromServices] ISourceProvider sourceProvider,
            CancellationToken cancellationToken = default)
        {
            SourceDefinitionModel? updated = await sourceProvider.UpdateAsync(id, request, cancellationToken);

            if (updated == null)
            {
                return NotFound();
            }

            return Ok(updated);
        }

        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> DeleteSource(
            Guid id,
            [FromServices] ISourceProvider sourceProvider,
            CancellationToken cancellationToken = default)
        {
            bool deleted = await sourceProvider.DeleteAsync(id, cancellationToken);

            if (!deleted)
            {
                return NotFound();
            }

            return NoContent();
        }
    }
}