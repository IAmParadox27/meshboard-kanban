using System.Security.Claims;
using Meshboard.Api.Conventions;
using Meshboard.Api.Middleware;
using Meshboard.Api.Services;
using Meshboard.Core.Auth;
using Meshboard.Core.Config;
using Meshboard.Core.Domain;
using Meshboard.Core.Issues;
using Meshboard.Core.Sources;
using Meshboard.Infrastructure.Auth;
using Meshboard.Infrastructure.Database;
using Meshboard.Infrastructure.Database.Providers;
using Meshboard.Infrastructure.Issues;
using Meshboard.Infrastructure.Sources;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.OpenIdConnect;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace Meshboard.Api
{
    class Program
    {
        public static void Main(string[] args)
        {
            WebApplicationBuilder builder = WebApplication.CreateBuilder(args);

            builder.Configuration
                .AddJsonFile("config.json", true, false)
                .AddJsonFile($"config.{builder.Environment.EnvironmentName}.json", true, false)
                .AddEnvironmentVariables("MESHBOARD_");
            
            // Bind options in
            builder.AddOptionsAndBind<AuthSettings>(nameof(AuthSettings));
            builder.AddOptionsAndBind<PluginSettings>(nameof(PluginSettings));
            builder.AddOptionsAndBind<NextJsSettings>(nameof(NextJsSettings));
            
            // Add services to the container.
            builder.Services.AddControllers(o =>
            {
                o.Conventions.Insert(0, new ApiRoutePrefixConvention("api"));
            });
            
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen();
            
            builder.Services.AddRouting(o =>
            {
                o.LowercaseUrls = true;
                o.LowercaseQueryStrings = true;
            });
            
            builder.Services
                .AddDataProtection()
                .SetApplicationName("Meshboard")
                .PersistKeysToFileSystem(new DirectoryInfo(Path.Combine(Directory.GetCurrentDirectory(), "DataProtection-Keys")));

            builder.Services
                .AddReverseProxy()
                .LoadFromConfig(builder.Configuration.GetSection("ReverseProxy")); // TODO: Come back to this
            
            AuthenticationBuilder authBuilder = builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme);
                
            authBuilder.AddCookie(o =>
            {
                o.Cookie.Name = builder.Environment.IsDevelopment() ? "MeshboardAuth" : "__Host-MeshboardAuth";
                o.Cookie.HttpOnly = true;
                o.Cookie.SecurePolicy = builder.Environment.IsDevelopment() ? CookieSecurePolicy.SameAsRequest : CookieSecurePolicy.Always;
                o.Cookie.SameSite = SameSiteMode.Lax;

                o.LoginPath = "/api/auth/login";
                o.LogoutPath = "/api/auth/logout";
            
                o.SlidingExpiration = true;
                o.ExpireTimeSpan = TimeSpan.FromHours(8); // TODO: Make this configurable
            });
                
            AuthSettings? authSettings = builder.Configuration.GetSection(ConfigBindings.GetSectionName(nameof(AuthSettings))).Get<AuthSettings>();

            if (authSettings?.Oidc != null)
            {
                authBuilder.AddOpenIdConnect(authSettings.Oidc.Scheme, options =>
                {
                    options.SignInScheme = CookieAuthenticationDefaults.AuthenticationScheme;
                    options.Authority = authSettings.Oidc.Authority;
                    options.ClientId = authSettings.Oidc.ClientId;
                    options.ClientSecret = authSettings.Oidc.ClientSecret;
                    options.CallbackPath = authSettings.Oidc.CallbackPath ?? "/api/auth/callback";
                    
                    foreach (string scope in (authSettings.Oidc.Scope ?? string.Empty).Split(' '))
                    {
                        options.Scope.Add(scope);
                    }
                    
                    options.ResponseType = "code";
                    options.SaveTokens = true;
                    options.GetClaimsFromUserInfoEndpoint = true;

                    options.Events = new OpenIdConnectEvents()
                    {
                        OnTokenValidated = async context =>
                        {
                            IUserLoginService userLoginService = context.HttpContext.RequestServices
                                .GetRequiredService<IUserLoginService>();

                            string? issuer = context.Principal?.FindFirst("iss")?.Value
                                             ?? context.SecurityToken?.Issuer;

                            string? subject = context.Principal?.FindFirst("sub")?.Value
                                              ?? context.Principal?.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                            if (string.IsNullOrWhiteSpace(issuer) || string.IsNullOrWhiteSpace(subject))
                            {
                                context.Fail("Missing required identity claims.");
                                return;
                            }

                            UserAuthenticationResult result = await userLoginService.ValidateOidcLoginAsync(
                                issuer,
                                subject,
                                context.Principal!);

                            if (!result.Success || result.User is null)
                            {
                                context.Fail(result.FailureReason ?? "User is not allowed to sign in.");
                                return;
                            }

                            context.Principal = userLoginService.CreatePrincipal(result.User);
                        }
                    };
                });
            }

            builder.Services.AddAuthorization();
            
            builder.Services.AddHttpClient();
            
            builder.Services.AddScoped<IUserLoginService, UserLoginService>();
            builder.Services.AddScoped<IPasswordHasher, PasswordHasher>();

            // Data providers
            builder.Services.AddScoped<IUserProvider, UserProvider>();
            builder.Services.AddScoped<ISourceProvider, SourceProvider>();
            builder.Services.AddScoped<IExternalIssueProvider, ExternalIssueProvider>();

            builder.DetectAndInstallPlugins();
            builder.AddMeshboardDatabase();
            
            // Hosted services
            builder.Services.AddHostedService<NextJsHostedService>();
            
            WebApplication app = builder.Build();

            // Configure the HTTP request pipeline.
            app.UseSwagger(o =>
            {
                o.RouteTemplate = "api/swagger/{documentName}/swagger.json";
            });
            app.UseSwaggerUI(o =>
            {
                o.SwaggerEndpoint("/api/swagger/v1/swagger.json", "Meshboard API v1");
                o.RoutePrefix = "api/swagger";
            });
            
            app.UseRouting();
            
            app.UseAuthentication();
            app.UseAuthorization();

            app.MapControllers();

            app.MapWhen(context => !context.Request.Path.StartsWithSegments("/api"), nextApp =>
            {
                nextApp.UseRouting();
                nextApp.UseEndpoints(endpoints =>
                {
                    endpoints.MapReverseProxy();
                });
            });
        
            using (IServiceScope scope = app.Services.CreateScope())
            {
                MeshboardDbContext dbContext = scope.ServiceProvider.GetRequiredService<MeshboardDbContext>();

                dbContext.Database.EnsureCreated();
            }
            
            app.Run();
        }
    }
}