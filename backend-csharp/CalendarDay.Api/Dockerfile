FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY ["backend-csharp/CalendarDay.Api/CalendarDay.Api.csproj", "backend-csharp/CalendarDay.Api/"]
COPY ["backend-csharp/CalendarDay.Application/CalendarDay.Application.csproj", "backend-csharp/CalendarDay.Application/"]
COPY ["backend-csharp/CalendarDay.Domain/CalendarDay.Domain.csproj", "backend-csharp/CalendarDay.Domain/"]
COPY ["backend-csharp/CalendarDay.Infrastructure/CalendarDay.Infrastructure.csproj", "backend-csharp/CalendarDay.Infrastructure/"]
RUN dotnet restore "backend-csharp/CalendarDay.Api/CalendarDay.Api.csproj"

COPY . .
RUN dotnet publish "backend-csharp/CalendarDay.Api/CalendarDay.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "CalendarDay.Api.dll"]
