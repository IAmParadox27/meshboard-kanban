using System.Diagnostics;
using Meshboard.Core.Config;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Meshboard.Api.Services
{
    public sealed class NextJsHostedService : IHostedService, IDisposable
    {
        private readonly ILogger<NextJsHostedService> m_logger;
        private Process? m_process;
        private readonly NextJsSettings m_settings;

        public NextJsHostedService(ILogger<NextJsHostedService> logger, IOptions<NextJsSettings> options)
        {
            m_logger = logger;
            m_settings = options.Value;
        }

        public Task StartAsync(CancellationToken cancellationToken)
        {
            if (!m_settings.Enabled)
            {
                return Task.CompletedTask;
            }
            
            string nextPath = m_settings.Path;
            
            if (!Path.IsPathRooted(m_settings.Path))
            {
                nextPath = Path.Combine(
                    AppContext.BaseDirectory,
                    m_settings.Path
                );
            }
            
            string[] startupArgs = m_settings.StartupScript.Split(' ');
            ProcessStartInfo startInfo = new ProcessStartInfo
            {
                FileName = startupArgs.First(),
                Arguments = $"\"{string.Join(' ', startupArgs.Skip(1))}\"",
                WorkingDirectory = nextPath,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };

            startInfo.Environment["NODE_ENV"] = "development";
            startInfo.Environment["PORT"] = m_settings.Port.ToString();
            startInfo.Environment["HOSTNAME"] = "127.0.0.1";

            m_process = new Process
            {
                StartInfo = startInfo,
                EnableRaisingEvents = true
            };

            m_process.OutputDataReceived += (_, e) =>
            {
                if (!string.IsNullOrWhiteSpace(e.Data))
                    m_logger.LogInformation("[next] {Line}", e.Data);
            };

            m_process.ErrorDataReceived += (_, e) =>
            {
                if (!string.IsNullOrWhiteSpace(e.Data))
                    m_logger.LogError("[next] {Line}", e.Data);
            };

            m_process.Exited += (_, _) =>
            {
                m_logger.LogWarning("Next.js process exited with code {ExitCode}", m_process.ExitCode);
            };

            m_process.Start();
            m_process.BeginOutputReadLine();
            m_process.BeginErrorReadLine();

            m_logger.LogInformation("Started Next.js process with PID {Pid}", m_process.Id);

            return Task.CompletedTask;
        }

        public async Task StopAsync(CancellationToken cancellationToken)
        {
            if (m_process is null || m_process.HasExited)
            {
                return;
            }

            m_logger.LogInformation("Stopping Next.js process...");

            try
            {
                m_process.Kill(entireProcessTree: true);
                await m_process.WaitForExitAsync(cancellationToken);
            }
            catch (Exception ex)
            {
                m_logger.LogWarning(ex, "Failed to stop Next.js process cleanly.");
            }
        }

        public void Dispose()
        {
            m_process?.Dispose();
        }
    }
}