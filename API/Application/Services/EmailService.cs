using Application.Services;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Configuration;
using MimeKit;

public class EmailService : IEmailService
{
    private readonly IConfiguration _configuration;

    public EmailService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public async Task SendEmailAsync(string toEmail, string subject, string htmlMessage)
    {
        if (string.IsNullOrWhiteSpace(toEmail))
            throw new ArgumentNullException(nameof(toEmail));

        // Ler configurações do appsettings
        var fromEmail = _configuration["EmailSettings:FromEmail"] ?? "no-reply@example.com";
        var smtpServer = _configuration["EmailSettings:SmtpServer"];
        var portStr = _configuration["EmailSettings:Port"];
        var username = _configuration["EmailSettings:Username"];
        var password = _configuration["EmailSettings:Password"];
        var enableSslStr = _configuration["EmailSettings:EnableSsl"];
        var enableSsl = !string.IsNullOrWhiteSpace(enableSslStr) && bool.Parse(enableSslStr);

        // Construir a mensagem
        var emailMessage = new MimeMessage();
        emailMessage.From.Add(new MailboxAddress("Meu Sistema", fromEmail));
        emailMessage.To.Add(new MailboxAddress("", toEmail));
        emailMessage.Subject = subject;
        emailMessage.Body = new TextPart("html") { Text = htmlMessage };

        // Se SMTP não estiver configurado, logar e sair (modo dev)
        if (string.IsNullOrWhiteSpace(smtpServer) || !int.TryParse(portStr, out var port))
        {
            Console.WriteLine("[EmailService] SMTP não configurado ou porta inválida — modo desenvolvimento.");
            Console.WriteLine($"Para: {toEmail}\nAssunto: {subject}\nCorpo:\n{htmlMessage}");
            return;
        }

        // Envio real via SMTP
        using var client = new SmtpClient();
        try
        {
            // Conectar com STARTTLS se necessário (mais compatível com porta 587/Gmail)
            var socketOptions = enableSsl ? SecureSocketOptions.StartTls : SecureSocketOptions.None;
            await client.ConnectAsync(smtpServer, port, socketOptions);

            if (!string.IsNullOrWhiteSpace(username) && !string.IsNullOrWhiteSpace(password))
            {
                await client.AuthenticateAsync(username, password);
            }

            await client.SendAsync(emailMessage);
            Console.WriteLine($"[EmailService] Email enviado para {toEmail} via {smtpServer}:{port}");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[EmailService] Erro ao enviar email: {ex.Message}");
            throw;
        }
        finally
        {
            try { await client.DisconnectAsync(true); } catch { }
        }
    }
}
