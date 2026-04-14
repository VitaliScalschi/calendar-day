using CalendarDay.Application.Abstractions;
using CalendarDay.Infrastructure.Persistence;
using CalendarDay.Infrastructure.Seed;
using CalendarDay.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

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
        services.AddScoped<SeedFromJsonService>();
        services.AddScoped<DefaultUsersSeedService>();
        services.AddScoped<ResponsibleOptionsSeedService>();

        return services;
    }
}
