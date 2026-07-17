using System.Security.Claims;
using Meshboard.Core.Auth;
using Meshboard.Core.Domain;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Meshboard.Api.Controllers
{
    [ApiController]
    [Authorize]
    [Route("[controller]")]
    public class UsersController : ControllerBase
    {
        [HttpGet("me")]
        public async Task<ActionResult<CurrentUserModel>> GetCurrentUser(
            [FromServices] IUserProvider userProvider,
            [FromServices] IUserSourceMappingProvider userSourceMappingProvider,
            CancellationToken cancellationToken = default)
        {
            string? userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (!Guid.TryParse(userIdValue, out Guid userId))
            {
                return Unauthorized();
            }

            User? user = await userProvider.GetByIdAsync(userId, cancellationToken);

            if (user == null)
            {
                return Unauthorized();
            }

            IReadOnlyList<UserSourceMapping> mappings = await userSourceMappingProvider.GetByUserIdAsync(
                userId,
                cancellationToken);

            return Ok(new CurrentUserModel
            {
                Id = user.Id,
                Username = user.Username,
                DisplayName = user.DisplayName,
                Email = user.Email,
                IsAdmin = user.IsAdmin,
                SourceMappings = mappings
                    .Select(x => new UserSourceMappingModel
                    {
                        SourceId = x.SourceId,
                        SourceName = x.Source.Name,
                        ProviderKey = x.Source.ProviderKey,
                        ExternalUserId = x.ExternalUserId,
                        ExternalUsername = x.ExternalUsername,
                        ExternalDisplayName = x.ExternalDisplayName,
                    })
                    .ToArray(),
            });
        }
    }
}