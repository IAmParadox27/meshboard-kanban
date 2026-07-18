using System.Security.Claims;
using Meshboard.Core.Auth;
using Meshboard.Core.Domain;
using Meshboard.Core.Sources;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
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

        [HttpPut("me")]
        public async Task<ActionResult<CurrentUserModel>> UpdateCurrentUser(
            [FromBody] UpdateCurrentUserRequest request,
            [FromServices] IUserProvider userProvider,
            [FromServices] IUserSourceMappingProvider userSourceMappingProvider,
            CancellationToken cancellationToken = default)
        {
            User? user = await GetCurrentUserAsync(userProvider, cancellationToken);

            if (user == null)
            {
                return Unauthorized();
            }

            user.DisplayName = request.DisplayName.Trim();
            user.Email = string.IsNullOrWhiteSpace(request.Email)
                ? null
                : request.Email.Trim();

            await userProvider.UpdateAsync(user, cancellationToken);

            CurrentUserModel model = await BuildCurrentUserModelAsync(
                user,
                userSourceMappingProvider,
                cancellationToken);

            return Ok(model);
        }

        [HttpPut("me/source-mappings/{sourceId:guid}")]
        public async Task<ActionResult<UserSourceMappingModel>> UpsertCurrentUserSourceMapping(
            Guid sourceId,
            [FromBody] UpsertUserSourceMappingRequest request,
            [FromServices] IUserProvider userProvider,
            [FromServices] IUserSourceMappingProvider userSourceMappingProvider,
            [FromServices] ISourceProvider sourceProvider,
            CancellationToken cancellationToken = default)
        {
            User? user = await GetCurrentUserAsync(userProvider, cancellationToken);

            if (user == null)
            {
                return Unauthorized();
            }

            SourceDefinitionModel? source = await sourceProvider.GetByIdAsync(sourceId, cancellationToken);

            if (source == null)
            {
                return NotFound();
            }

            UserSourceMapping mapping = await userSourceMappingProvider.UpsertAsync(
                new UserSourceMapping
                {
                    UserId = user.Id,
                    SourceId = sourceId,
                    ExternalUserId = request.ExternalUserId.Trim(),
                    ExternalUsername = string.IsNullOrWhiteSpace(request.ExternalUsername)
                        ? null
                        : request.ExternalUsername.Trim(),
                    ExternalDisplayName = string.IsNullOrWhiteSpace(request.ExternalDisplayName)
                        ? null
                        : request.ExternalDisplayName.Trim(),
                },
                cancellationToken);

            return Ok(new UserSourceMappingModel
            {
                SourceId = source.Id,
                SourceName = source.Name,
                ProviderKey = source.ProviderKey,
                ExternalUserId = mapping.ExternalUserId,
                ExternalUsername = mapping.ExternalUsername,
                ExternalDisplayName = mapping.ExternalDisplayName,
            });
        }

        [HttpDelete("me/source-mappings/{sourceId:guid}")]
        public async Task<IActionResult> DeleteCurrentUserSourceMapping(
            Guid sourceId,
            [FromServices] IUserProvider userProvider,
            [FromServices] IUserSourceMappingProvider userSourceMappingProvider,
            CancellationToken cancellationToken = default)
        {
            User? user = await GetCurrentUserAsync(userProvider, cancellationToken);

            if (user == null)
            {
                return Unauthorized();
            }

            bool deleted = await userSourceMappingProvider.DeleteAsync(
                user.Id,
                sourceId,
                cancellationToken);

            if (!deleted)
            {
                return NotFound();
            }

            return NoContent();
        }

        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<UsersPageModel>> GetUsers(
            [FromServices] IUserProvider userProvider,
            CancellationToken cancellationToken = default)
        {
            IReadOnlyList<User> users = await userProvider.GetAllAsync(cancellationToken);

            return Ok(new UsersPageModel
            {
                Users = users
                    .Select(MapUser)
                    .ToArray(),
            });
        }

        [HttpPut("{id:guid}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<UserListItemModel>> UpdateUser(
            Guid id,
            [FromBody] UpdateUserRequest request,
            [FromServices] IUserProvider userProvider,
            CancellationToken cancellationToken = default)
        {
            User? user = await userProvider.GetByIdAsync(id, cancellationToken);

            if (user == null)
            {
                return NotFound();
            }

            if (user.IsAdmin && !request.IsAdmin)
            {
                int adminCount = (await userProvider.GetAllAsync(cancellationToken))
                    .Count(x => x.IsAdmin);

                if (adminCount <= 1)
                {
                    return Problem(
                        title: "Cannot remove the final admin",
                        detail: "Meshboard must always have at least one admin user.",
                        statusCode: StatusCodes.Status400BadRequest);
                }
            }

            user.DisplayName = request.DisplayName.Trim();
            user.Email = string.IsNullOrWhiteSpace(request.Email)
                ? null
                : request.Email.Trim();
            user.IsActive = request.IsActive;
            user.IsAdmin = request.IsAdmin;

            await userProvider.UpdateAsync(user, cancellationToken);

            return Ok(MapUser(user));
        }

        private async Task<User?> GetCurrentUserAsync(
            IUserProvider userProvider,
            CancellationToken cancellationToken)
        {
            string? userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (!Guid.TryParse(userIdValue, out Guid userId))
            {
                return null;
            }

            return await userProvider.GetByIdAsync(userId, cancellationToken);
        }

        private static UserListItemModel MapUser(User user)
        {
            return new UserListItemModel
            {
                Id = user.Id,
                Username = user.Username,
                DisplayName = user.DisplayName,
                Email = user.Email,
                IsActive = user.IsActive,
                IsAdmin = user.IsAdmin,
                CreatedAtUtc = user.CreatedAtUtc,
                LastLoginAtUtc = user.LastLoginAtUtc,
            };
        }

        private static async Task<CurrentUserModel> BuildCurrentUserModelAsync(
            User user,
            IUserSourceMappingProvider userSourceMappingProvider,
            CancellationToken cancellationToken)
        {
            IReadOnlyList<UserSourceMapping> mappings = await userSourceMappingProvider.GetByUserIdAsync(
                user.Id,
                cancellationToken);

            return new CurrentUserModel
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
            };
        }
    }
}