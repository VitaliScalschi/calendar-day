using CalendarDay.Application.Validation;
using CalendarDay.Infrastructure.Auth;
using CalendarDay.Infrastructure;
using CalendarDay.Infrastructure.Persistence;
using CalendarDay.Infrastructure.Seed;
using CalendarDay.Api.Middleware;
using FluentValidation;
using FluentValidation.AspNetCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

if (builder.Environment.IsDevelopment())
{
    builder.Configuration.AddJsonFile(
        "appsettings.Development.local.json",
        optional: true,
        reloadOnChange: true);
}

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddOpenApi();
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddValidatorsFromAssemblyContaining<CreateElectionDtoValidator>();
builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection(JwtOptions.SectionName));

var jwt = builder.Configuration.GetSection(JwtOptions.SectionName).Get<JwtOptions>() ?? new JwtOptions();
if (string.IsNullOrWhiteSpace(jwt.SecretKey) || jwt.SecretKey.Length < 32)
{
    throw new InvalidOperationException(
        "Jwt:SecretKey is missing or too short. Set JWT_SECRET_KEY in .env (minimum 32 characters) " +
        "and start with: docker compose -f docker-compose.prod.yml --env-file .env up -d");
}

var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.SecretKey));

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateIssuerSigningKey = true,
            ValidateLifetime = true,
            ValidIssuer = jwt.Issuer,
            ValidAudience = jwt.Audience,
            IssuerSigningKey = signingKey
        };
    });

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminOnly", policy => policy.RequireRole("Admin", "SuperAdmin"));
    options.AddPolicy("EditorOrAdmin", policy => policy.RequireRole("Admin", "SuperAdmin", "Editor"));
});
var configuredOrigins = builder.Configuration.GetValue<string>("Cors:AllowedOrigins");
var allowedOrigins = string.IsNullOrWhiteSpace(configuredOrigins)
    ? ["http://localhost:5173", "http://localhost:5174"]
    : configuredOrigins.Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries);
builder.Services.AddCors(options =>
{
    options.AddPolicy("frontend", policy =>
    {
        policy
            .WithOrigins(allowedOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("Startup");
    try
    {
        var dbContext = scope.ServiceProvider.GetRequiredService<CalendarDayDbContext>();
        await dbContext.Database.MigrateAsync();

        var defaultUsersSeed = scope.ServiceProvider.GetRequiredService<DefaultUsersSeedService>();
        await defaultUsersSeed.EnsureDefaultUsersAsync();

        var responsibleOptionsSeed = scope.ServiceProvider.GetRequiredService<ResponsibleOptionsSeedService>();
        await responsibleOptionsSeed.EnsureDefaultResponsibleOptionsAsync();
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Database migration or seed failed at startup.");
        if (!app.Environment.IsDevelopment())
        {
            throw;
        }
    }
}

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseMiddleware<ExceptionHandlingMiddleware>();
app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseCors("frontend");
app.UseAuthentication();
app.UseMiddleware<AuditLogMiddleware>();
app.UseAuthorization();
app.MapControllers();
app.Run();
