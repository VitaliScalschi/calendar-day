using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using CalendarDay.Application.Abstractions;
using CalendarDay.Application.Contracts.Auth;
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
        var user = await db.Users.FirstOrDefaultAsync(x => x.Email == email, ct);
        if (user is null || !user.IsActive) return null;

        var passwordOk = BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash);
        if (!passwordOk) return null;

        var jwt = jwtOptions.Value;
        var tokenHandler = new JwtSecurityTokenHandler();
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.SecretKey));

        var token = tokenHandler.CreateToken(new SecurityTokenDescriptor
        {
            Issuer = jwt.Issuer,
            Audience = jwt.Audience,
            Expires = DateTime.UtcNow.AddMinutes(jwt.ExpirationMinutes),
            Subject = new ClaimsIdentity(
            [
                new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                new Claim(JwtRegisteredClaimNames.Email, user.Email),
                new Claim(ClaimTypes.Role, user.Role.ToString())
            ]),
            SigningCredentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256)
        });

        return new LoginResponseDto(
            tokenHandler.WriteToken(token),
            new AuthUserDto(user.Id, user.Email, user.Role)
        );
    }
}
