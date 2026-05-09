using System.Security.Claims;
using System.Text;
using System.Text.Json;
using CalendarDay.Application.Abstractions;

namespace CalendarDay.Api.Middleware;

public class AuditLogMiddleware(RequestDelegate next)
{
    private static readonly HashSet<string> SensitiveKeys = new(StringComparer.OrdinalIgnoreCase)
    {
        "password",
        "passwordHash",
        "token",
        "refreshToken",
        "accessToken",
        "authorization",
        "secret",
        "file"
    };

    public async Task InvokeAsync(HttpContext context, IAuditLogsService auditLogsService)
    {
        var details = await BuildRequestDetailsAsync(context);
        await next(context);

        var path = context.Request.Path.Value ?? string.Empty;
        if (!path.StartsWith("/api", StringComparison.OrdinalIgnoreCase))
        {
            return;
        }

        var endpoint = context.GetEndpoint()?.DisplayName ?? path;
        var method = context.Request.Method;
        var statusCode = context.Response.StatusCode;
        var ipAddress = context.Connection.RemoteIpAddress?.ToString();
        var username =
            context.User.FindFirstValue(ClaimTypes.Email) ??
            context.User.FindFirstValue("email") ??
            context.User.Identity?.Name;
        var action = BuildActionLabel(method, path);

        try
        {
            await auditLogsService.LogAsync(
                username,
                action,
                details,
                path,
                method,
                statusCode,
                ipAddress,
                context.RequestAborted);
        }
        catch
        {
            // do not block request lifecycle if audit persistence fails
        }
    }

    private static async Task<string?> BuildRequestDetailsAsync(HttpContext context)
    {
        var request = context.Request;
        var method = request.Method.ToUpperInvariant();
        if (method is "GET" or "HEAD" or "OPTIONS")
        {
            return BuildQueryDetails(request);
        }

        var bodyDetails = await BuildBodyDetailsAsync(request);
        var queryDetails = BuildQueryDetails(request);

        if (string.IsNullOrWhiteSpace(bodyDetails))
        {
            return queryDetails;
        }

        if (string.IsNullOrWhiteSpace(queryDetails))
        {
            return bodyDetails;
        }

        return $"{bodyDetails}; query: {queryDetails}";
    }

    private static string? BuildQueryDetails(HttpRequest request)
    {
        if (request.Query.Count == 0)
        {
            return null;
        }

        var parts = request.Query
            .Where(x => !SensitiveKeys.Contains(x.Key))
            .Select(x => $"{x.Key}={string.Join(",", x.Value.Select(v => v ?? string.Empty))}")
            .ToArray();

        if (parts.Length == 0)
        {
            return null;
        }

        return Crop($"query: {string.Join("; ", parts)}");
    }

    private static async Task<string?> BuildBodyDetailsAsync(HttpRequest request)
    {
        if (request.ContentLength is null or 0)
        {
            return null;
        }

        if (request.ContentType?.Contains("application/json", StringComparison.OrdinalIgnoreCase) != true)
        {
            return Crop($"content-type: {request.ContentType}");
        }

        request.EnableBuffering();

        using var reader = new StreamReader(request.Body, Encoding.UTF8, detectEncodingFromByteOrderMarks: false, leaveOpen: true);
        var body = await reader.ReadToEndAsync();
        request.Body.Position = 0;

        if (string.IsNullOrWhiteSpace(body))
        {
            return null;
        }

        try
        {
            using var doc = JsonDocument.Parse(body);
            var values = new List<string>();
            if (doc.RootElement.ValueKind == JsonValueKind.Object)
            {
                foreach (var prop in doc.RootElement.EnumerateObject())
                {
                    if (SensitiveKeys.Contains(prop.Name))
                    {
                        continue;
                    }

                    values.Add($"{prop.Name}={ShortValue(prop.Value)}");
                }
            }
            else
            {
                values.Add($"body={ShortValue(doc.RootElement)}");
            }

            return values.Count == 0 ? null : Crop(string.Join("; ", values));
        }
        catch
        {
            return Crop("body: [invalid-json]");
        }
    }

    private static string ShortValue(JsonElement value)
    {
        return value.ValueKind switch
        {
            JsonValueKind.String => value.GetString() ?? string.Empty,
            JsonValueKind.Number => value.ToString(),
            JsonValueKind.True => "true",
            JsonValueKind.False => "false",
            JsonValueKind.Null => "null",
            JsonValueKind.Array => $"array({value.GetArrayLength()})",
            JsonValueKind.Object => "object",
            _ => value.ToString()
        };
    }

    private static string Crop(string value, int maxLength = 3900)
    {
        if (value.Length <= maxLength)
        {
            return value;
        }

        return value[..maxLength] + "...";
    }

    private static string BuildActionLabel(string method, string path)
    {
        var operation = method.ToUpperInvariant() switch
        {
            "POST" => "Adăugare",
            "PUT" => "Modificare",
            "PATCH" => "Modificare",
            "DELETE" => "Ștergere",
            "GET" => "Vizualizare",
            _ => method.ToUpperInvariant()
        };

        var resource = ResolveResourceName(path);
        return $"{operation} {resource}";
    }

    private static string ResolveResourceName(string path)
    {
        var cleanPath = path.Trim().Trim('/');
        if (string.IsNullOrWhiteSpace(cleanPath))
        {
            return "Sistem";
        }

        var segments = cleanPath.Split('/', StringSplitOptions.RemoveEmptyEntries);
        var resourceSegment = segments.Length >= 2 && segments[0].Equals("api", StringComparison.OrdinalIgnoreCase)
            ? segments[1]
            : segments[0];

        return resourceSegment.ToLowerInvariant() switch
        {
            "users" => "Utilizatori",
            "audit-logs" => "Audit Logs",
            "usefulinfos" => "Informații utile",
            "deadlines" => "Termene",
            "elections" => "Programe",
            "regulations" => "Regulamente",
            "auth" => "Autentificare",
            _ => resourceSegment
        };
    }
}
