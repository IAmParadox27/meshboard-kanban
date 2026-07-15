using Meshboard.Core.Issues;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Meshboard.Api.Controllers
{
    [ApiController]
    [Authorize]
    [Route("[controller]")]
    public class IssuesController : ControllerBase
    {
        [HttpGet]
        public async Task<ActionResult<IReadOnlyList<ExternalIssue>>> GetIssues(
            [FromServices] IExternalIssueProvider externalIssueProvider,
            CancellationToken cancellationToken = default)
        {
            IReadOnlyList<ExternalIssue> issues = await externalIssueProvider.GetIssuesAsync(cancellationToken);
            return Ok(issues);
        }
    }
}