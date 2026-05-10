using System.IdentityModel.Tokens.Jwt;
using System.Security.Cryptography;
using System.Security.Claims;
using System.Text;
using CalendarDay.Application.Abstractions;
using CalendarDay.Application.Contracts.Auth;
using CalendarDay.Application.Contracts.SiaAdmin;
using CalendarDay.Domain.Entities;
using CalendarDay.Infrastructure.Auth;
using CalendarDay.Infrastructure.Persistence;
using CalendarDay.Infrastructure.Services.SiaAdmin;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace CalendarDay.Infrastructure.Services;

public class AuthService(
    CalendarDayDbContext db,
    IOptions<JwtOptions> jwtOptions,
    ISiaAdminService siaAdminService,
    IOptions<SiaAdminOptions> siaOptions,
    ILogger<AuthService> logger) : IAuthService
{
    public async Task<LoginResponseDto?> LoginAsync(LoginRequestDto dto, CancellationToken ct)
    {
        var email = dto.Email.Trim().ToLowerInvariant();
        var user = await db.Users
            .Include(x => x.UserRoles)
            .ThenInclude(x => x.Role)
            .FirstOrDefaultAsync(x => x.Email == email, ct);
        if (user is not null && user.IsActive)
        {
            var passwordOk = BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash);
            if (passwordOk)
            {
                var roles = user.UserRoles
                    .Select(ur => ur.Role.Name)
                    .Distinct(StringComparer.OrdinalIgnoreCase)
                    .ToList();
                if (roles.Count == 0)
                {
                    roles.Add(AppRoles.Viewer);
                }

                return BuildLoginResponse(user.Id, user.Email, roles, siaLeastPrivilegedForPrimary: false);
            }
        }

        // Fallback to external SIA login when local credentials are missing/invalid.
        try
        {
            var siaSession = await siaAdminService.LoginAsync(
                new SiaLoginRequestDto(dto.Email.Trim(), dto.Password),
                ct);

            if (siaSession?.User is null)
            {
                return null;
            }

            var externalRoles = MapRolesFromSia(siaSession, siaOptions.Value);
            var identityEmail = string.IsNullOrWhiteSpace(siaSession.User.Email)
                ? dto.Email.Trim().ToLowerInvariant()
                : siaSession.User.Email.Trim().ToLowerInvariant();
            var userId = CreateDeterministicGuid($"sia:{identityEmail}");

            return BuildLoginResponse(userId, identityEmail, externalRoles, siaLeastPrivilegedForPrimary: siaOptions.Value.SiaPreferLeastPrivilegedMappedRoleWhenMultiple);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "SIA login failed for {Email}.", dto.Email);
            return null;
        }
    }

    public async Task<LoginResponseDto?> ExchangeSiaSessionAsync(string sessionToken, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(sessionToken))
        {
            return null;
        }

        try
        {
            var siaSession = await siaAdminService.GetSessionInfoAsync(sessionToken.Trim(), ct);
            if (siaSession?.User is null)
            {
                return null;
            }

            var externalRoles = MapRolesFromSia(siaSession, siaOptions.Value);
            var identityEmail = string.IsNullOrWhiteSpace(siaSession.User.Email)
                ? (siaSession.User.Login?.Trim().ToLowerInvariant() ?? string.Empty)
                : siaSession.User.Email.Trim().ToLowerInvariant();
            if (string.IsNullOrEmpty(identityEmail))
            {
                return null;
            }

            var userId = CreateDeterministicGuid($"sia:{identityEmail}");
            return BuildLoginResponse(userId, identityEmail, externalRoles, siaLeastPrivilegedForPrimary: siaOptions.Value.SiaPreferLeastPrivilegedMappedRoleWhenMultiple);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "SIA session exchange failed.");
            return null;
        }
    }

    private LoginResponseDto BuildLoginResponse(Guid userId, string email, IReadOnlyCollection<string> userRoles, bool siaLeastPrivilegedForPrimary)
    {
        var jwt = jwtOptions.Value;
        var tokenHandler = new JwtSecurityTokenHandler();
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.SecretKey));
        var roles = userRoles.Count == 0 ? [AppRoles.Viewer] : userRoles.Distinct(StringComparer.OrdinalIgnoreCase).ToArray();
        var primary = ResolvePrimaryRole(roles, siaLeastPrivilegedForPrimary);

        var token = tokenHandler.CreateToken(new SecurityTokenDescriptor
        {
            Issuer = jwt.Issuer,
            Audience = jwt.Audience,
            Expires = DateTime.UtcNow.AddMinutes(jwt.ExpirationMinutes),
            Subject = new ClaimsIdentity(
            [
                new Claim(JwtRegisteredClaimNames.Sub, userId.ToString()),
                new Claim(JwtRegisteredClaimNames.Email, email),
                ..roles.Select(role => new Claim(ClaimTypes.Role, role)),
                new Claim("calday_primary", primary)
            ]),
            SigningCredentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256)
        });

        return new LoginResponseDto(
            tokenHandler.WriteToken(token),
            new AuthUserDto(userId, email, primary)
        );
    }

    private static string ResolvePrimaryRole(IReadOnlyCollection<string> userRoles, bool leastPrivilegedWhenMultipleAppRoles)
    {
        var hasAdmin = userRoles.Any(r => string.Equals(r, AppRoles.Admin, StringComparison.OrdinalIgnoreCase));
        var hasEditor = userRoles.Any(r => string.Equals(r, AppRoles.Editor, StringComparison.OrdinalIgnoreCase));
        var hasViewer = userRoles.Any(r => string.Equals(r, AppRoles.Viewer, StringComparison.OrdinalIgnoreCase));
        var tierCount = (hasAdmin ? 1 : 0) + (hasEditor ? 1 : 0) + (hasViewer ? 1 : 0);

        if (leastPrivilegedWhenMultipleAppRoles && tierCount >= 2)
        {
            if (hasViewer) return AppRoles.Viewer;
            if (hasEditor) return AppRoles.Editor;
            return AppRoles.Admin;
        }

        var roleSet = userRoles.ToHashSet(StringComparer.OrdinalIgnoreCase);
        if (roleSet.Contains(AppRoles.Admin)) return AppRoles.Admin;
        if (roleSet.Contains(AppRoles.Editor)) return AppRoles.Editor;
        return AppRoles.Viewer;
    }

    private static IReadOnlyCollection<string> MapRolesFromSia(SiaSessionInfoDto session, SiaAdminOptions options)
    {
        var mapped = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var adminRoleKeywords = options.AdminRoleKeywords
            .Where(x => !string.IsNullOrWhiteSpace(x))
            .Select(x => x.Trim())
            .ToArray();
        var editorRoleKeywords = options.EditorRoleKeywords
            .Where(x => !string.IsNullOrWhiteSpace(x))
            .Select(x => x.Trim())
            .ToArray();

        foreach (var role in session.User?.Roles ?? [])
        {
            var roleName = role.Name?.Trim() ?? string.Empty;
            if (adminRoleKeywords.Any(keyword => roleName.Contains(keyword, StringComparison.OrdinalIgnoreCase)))
            {
                mapped.Add(AppRoles.Admin);
                continue;
            }

            if (editorRoleKeywords.Any(keyword => roleName.Contains(keyword, StringComparison.OrdinalIgnoreCase)))
            {
                mapped.Add(AppRoles.Editor);
            }
        }

        if (mapped.Count == 0)
        {
            mapped.Add(AppRoles.Viewer);
        }

        return mapped.ToArray();
    }

    private static Guid CreateDeterministicGuid(string source)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(source));
        var guidBytes = new byte[16];
        Array.Copy(bytes, guidBytes, 16);
        return new Guid(guidBytes);
    }
}
