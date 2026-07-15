using System.Security.Claims;
using Meshboard.Core.Auth;
using Meshboard.Core.Config;
using Meshboard.Core.Domain;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace Meshboard.Api.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class AuthController : ControllerBase
    {
        [HttpPost("login")]
        [AllowAnonymous]
        public async Task<IActionResult> Login([FromBody] LocalLoginRequest request,
            [FromServices] IUserLoginService userLoginService,
            CancellationToken cancellationToken = default)
        {
            UserAuthenticationResult result = await userLoginService.ValidateCredentialsAsync(
                request.Username,
                request.Password,
                cancellationToken);

            if (!result.Success || result.User == null)
            {
                return Unauthorized();
            }

            ClaimsPrincipal principal = userLoginService.CreatePrincipal(result.User);

            await HttpContext.SignInAsync(
                CookieAuthenticationDefaults.AuthenticationScheme,
                principal);

            return Ok();
        }
        
        [HttpGet("login/oidc")]
        [AllowAnonymous]
        public IActionResult LoginOidc([FromServices] IOptions<AuthSettings> authSettings)
        {
            if (authSettings.Value.Oidc is null)
            {
                return Problem(title: "OIDC authentication is unavailable",
                    detail: "OIDC has not been configured for this server.",
                    statusCode: StatusCodes.Status503ServiceUnavailable);
            }
            
            AuthenticationProperties properties = new AuthenticationProperties
            {
                RedirectUri = "/"
            };
            
            return Challenge(properties, authSettings.Value.Oidc.Scheme);
        }
    }
}