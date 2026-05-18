using System.Security.Cryptography;
using System.Text;
using CalendarDay.Application.Contracts.Auth;
using CalendarDay.Domain.Entities;
using CalendarDay.Infrastructure.Email;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace CalendarDay.Infrastructure.Services;

public partial class AuthService
{
    private const string ForgotPasswordGenericMessage =
        "Dacă există un cont cu acest email, veți primi în scurt timp un link pentru resetarea parolei.";

    public async Task<ForgotPasswordResponseDto> RequestPasswordResetAsync(
        ForgotPasswordRequestDto dto,
        string? clientIp,
        CancellationToken ct)
    {
        var email = dto.Email.Trim().ToLowerInvariant();

        if (!rateLimiter.TryAcquire(email, clientIp))
        {
            logger.LogWarning("Password reset rate limit exceeded for {Email} from {Ip}.", email, clientIp);
            return new ForgotPasswordResponseDto(ForgotPasswordGenericMessage);
        }

        var user = await db.Users.FirstOrDefaultAsync(u => u.Email == email && u.IsActive, ct);
        string? devResetLink = null;

        if (user is not null)
        {
            var now = DateTime.UtcNow;
            var pendingTokens = await db.PasswordResetTokens
                .Where(t => t.UserId == user.Id && t.UsedAtUtc == null)
                .ToListAsync(ct);

            foreach (var pending in pendingTokens)
            {
                pending.UsedAtUtc = now;
            }

            var rawToken = GeneratePasswordResetToken();
            var resetOptions = passwordResetOptions.Value;
            var lifetimeMinutes = Math.Clamp(resetOptions.TokenLifetimeMinutes, 15, 24 * 60);

            db.PasswordResetTokens.Add(new PasswordResetToken
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                TokenHash = HashPasswordResetToken(rawToken),
                ExpiresAtUtc = now.AddMinutes(lifetimeMinutes),
                CreatedAtUtc = now,
            });

            await db.SaveChangesAsync(ct);

            var baseUrl = resetOptions.FrontendBaseUrl.Trim().TrimEnd('/');
            var resetLink = $"{baseUrl}/reset-password?token={Uri.EscapeDataString(rawToken)}";

            var emailSent = await emailNotificationService.SendPasswordResetLinkAsync(
                email,
                resetLink,
                lifetimeMinutes,
                ct);

            if (!emailSent)
            {
                logger.LogWarning(
                    "Email resetare parolă netrimis către {Email}. Link (doar log server): {ResetLink}",
                    email,
                    resetLink);

                if (resetOptions.ExposeDevResetLinkWhenEmailDisabled)
                {
                    devResetLink = resetLink;
                }
            }
            if (emailSent)
            {
                logger.LogInformation("Email resetare parolă trimis către {Email}.", email);
            }
        }
        else
        {
            logger.LogInformation(
                "Cerere resetare parolă pentru {Email}: utilizator negăsit sau inactiv (răspuns generic).",
                email);
        }

        return new ForgotPasswordResponseDto(ForgotPasswordGenericMessage, devResetLink);
    }

    public async Task<ResetPasswordResponseDto> ResetPasswordAsync(
        ResetPasswordRequestDto dto,
        CancellationToken ct)
    {
        var tokenHash = HashPasswordResetToken(dto.Token.Trim());
        var now = DateTime.UtcNow;

        var resetToken = await db.PasswordResetTokens
            .Include(t => t.User)
            .FirstOrDefaultAsync(
                t => t.TokenHash == tokenHash
                    && t.UsedAtUtc == null
                    && t.ExpiresAtUtc > now,
                ct);

        if (resetToken?.User is null || !resetToken.User.IsActive)
        {
            throw new InvalidOperationException("Linkul de resetare este invalid sau a expirat.");
        }

        resetToken.User.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password);
        resetToken.User.UpdatedAtUtc = now;
        resetToken.UsedAtUtc = now;

        await db.SaveChangesAsync(ct);

        return new ResetPasswordResponseDto("Parola a fost actualizată. Vă puteți autentifica.");
    }

    private static string GeneratePasswordResetToken()
    {
        var bytes = RandomNumberGenerator.GetBytes(32);
        return Convert.ToBase64String(bytes)
            .TrimEnd('=')
            .Replace('+', '-')
            .Replace('/', '_');
    }

    private static string HashPasswordResetToken(string rawToken)
    {
        var hash = SHA256.HashData(Encoding.UTF8.GetBytes(rawToken));
        return Convert.ToHexString(hash);
    }
}
