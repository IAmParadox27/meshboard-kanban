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
            IReadOnlyList<SourceSummary> sources = await sourceProvider.GetSourcesAsync(cancellationToken);
            return Ok(sources);
        }
    }
}