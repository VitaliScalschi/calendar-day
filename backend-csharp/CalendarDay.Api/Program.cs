using CalendarDay.Application.Validation;
using CalendarDay.Infrastructure.Auth;
using CalendarDay.Infrastructure;
using CalendarDay.Infrastructure.Persistence;
using CalendarDay.Infrastructure.Seed;
using FluentValidation;
using FluentValidation.AspNetCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddOpenApi();
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddValidatorsFromAssemblyContaining<CreateElectionDtoValidator>();
builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection(JwtOptions.SectionName));

var jwt = builder.Configuration.GetSection(JwtOptions.SectionName).Get<JwtOptions>() ?? new JwtOptions();
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

builder.Services.AddAuthorization();
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
            .AllowAnyMethod();
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
    }
    catch (Exception ex)
    {
        logger.LogWarning(ex, "Default user seed skipped because database is unavailable.");
    }
}

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();
app.UseCors("frontend");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.Run();
