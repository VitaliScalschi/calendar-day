using CalendarDay.Application.Abstractions;
using CalendarDay.Infrastructure.Persistence;
using CalendarDay.Infrastructure.Seed;
using CalendarDay.Infrastructure.Services;
using CalendarDay.Infrastructure.Services.SiaAdmin;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace CalendarDay.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<CalendarDayDbContext>(options =>
            options.UseNpgsql(configuration.GetConnectionString("DefaultConnection")));

        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IElectionsService, ElectionsService>();
        services.AddScoped<IDeadlinesService, DeadlinesService>();
        services.AddScoped<IRegulationsService, RegulationsService>();
        services.AddScoped<IUsersService, UsersService>();
        services.AddScoped<IAuditLogsService, AuditLogsService>();
        services.AddScoped<IUsefulInfosService, UsefulInfosService>();
        services.Configure<SiaAdminOptions>(configuration.GetSection(SiaAdminOptions.SectionName));
        services.AddHttpClient<ISiaAdminService, SiaAdminSoapService>((sp, client) =>
        {
            var soapOptions = sp.GetRequiredService<IOptions<SiaAdminOptions>>().Value;
            client.Timeout = TimeSpan.FromSeconds(Math.Max(5, soapOptions.TimeoutSeconds));
        });
        services.AddScoped<SeedFromJsonService>();
        services.AddScoped<DefaultUsersSeedService>();
        services.AddScoped<ResponsibleOptionsSeedService>();

        return services;
    }
}
