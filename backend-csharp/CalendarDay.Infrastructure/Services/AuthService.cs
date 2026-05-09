using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using CalendarDay.Application.Abstractions;
using CalendarDay.Application.Contracts.Auth;
using CalendarDay.Domain.Entities;
using CalendarDay.Infrastructure.Auth;
using CalendarDay.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace CalendarDay.Infrastructure.Services;

public class AuthService(
    CalendarDayDbContext db,
    IOptions<JwtOptions> jwtOptions) : IAuthService
{
    public async Task<LoginResponseDto?> LoginAsync(LoginRequestDto dto, CancellationToken ct)
    {
        var email = dto.Email.Trim().ToLowerInvariant();
        var user = await db.Users
            .Include(x => x.UserRoles)
            .ThenInclude(x => x.Role)
            .FirstOrDefaultAsync(x => x.Email == email, ct);
        if (user is null || !user.IsActive) return null;

        var passwordOk = BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash);
        if (!passwordOk) return null;

        var jwt = jwtOptions.Value;
        var tokenHandler = new JwtSecurityTokenHandler();
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.SecretKey));

        var roles = user.UserRoles
            .Select(ur => ur.Role.Name)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();
        if (roles.Count == 0)
        {
            roles.Add(AppRoles.Viewer);
        }

        static string PrimaryRole(IEnumerable<string> userRoles)
        {
            var roleSet = userRoles.ToHashSet(StringComparer.OrdinalIgnoreCase);
            if (roleSet.Contains(AppRoles.Admin)) return AppRoles.Admin;
            if (roleSet.Contains(AppRoles.Editor)) return AppRoles.Editor;
            return AppRoles.Viewer;
        }

        var token = tokenHandler.CreateToken(new SecurityTokenDescriptor
        {
            Issuer = jwt.Issuer,
            Audience = jwt.Audience,
            Expires = DateTime.UtcNow.AddMinutes(jwt.ExpirationMinutes),
            Subject = new ClaimsIdentity(
            [
                new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                new Claim(JwtRegisteredClaimNames.Email, user.Email),
                ..roles.Select(role => new Claim(ClaimTypes.Role, role))
            ]),
            SigningCredentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256)
        });

        return new LoginResponseDto(
            tokenHandler.WriteToken(token),
            new AuthUserDto(user.Id, user.Email, PrimaryRole(roles))
        );
    }
}
