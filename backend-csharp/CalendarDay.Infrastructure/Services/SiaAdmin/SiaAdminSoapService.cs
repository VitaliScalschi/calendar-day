using System.Net.Http.Headers;
using System.Security;
using System.Text;
using System.Xml.Linq;
using CalendarDay.Application.Abstractions;
using CalendarDay.Application.Contracts.SiaAdmin;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace CalendarDay.Infrastructure.Services.SiaAdmin;

public class SiaAdminSoapService(
    HttpClient httpClient,
    IOptions<SiaAdminOptions> options,
    ILogger<SiaAdminSoapService> logger) : ISiaAdminService
{
    private static readonly XNamespace SoapNs = "http://schemas.xmlsoap.org/soap/envelope/";
    private readonly SiaAdminOptions _options = options.Value;

    public Task<SiaSessionInfoDto?> LoginAsync(SiaLoginRequestDto request, CancellationToken ct)
    {
        var body = $"""
                    <Login xmlns="http://tempuri.org/">
                      <userName>{Escape(request.UserName)}</userName>
                      <password>{Escape(request.Password)}</password>
                    </Login>
                    """;
        return SendForSessionInfoAsync("Login", body, "LoginResult", ct);
    }

    public Task<SiaSessionInfoDto?> GetSessionInfoAsync(string sessionToken, CancellationToken ct)
    {
        var body = $"""
                    <GetSessionInfo xmlns="http://tempuri.org/">
                      <sessionToken>{Escape(sessionToken)}</sessionToken>
                    </GetSessionInfo>
                    """;
        return SendForSessionInfoAsync("GetSessionInfo", body, "GetSessionInfoResult", ct);
    }

    public async Task<bool> IsValidTokenAsync(string sessionToken, CancellationToken ct)
    {
        var body = $"""
                    <IsValidToken xmlns="http://tempuri.org/">
                      <sessionToken>{Escape(sessionToken)}</sessionToken>
                    </IsValidToken>
                    """;
        var document = await SendAsync("IsValidToken", body, ct);
        var result = document.Descendants().FirstOrDefault(x => x.Name.LocalName == "IsValidTokenResult")?.Value;
        return bool.TryParse(result, out var parsed) && parsed;
    }

    public async Task LogoutAsync(string sessionToken, CancellationToken ct)
    {
        var body = $"""
                    <Logout xmlns="http://tempuri.org/">
                      <sessionToken>{Escape(sessionToken)}</sessionToken>
                    </Logout>
                    """;
        _ = await SendAsync("Logout", body, ct);
    }

    private async Task<SiaSessionInfoDto?> SendForSessionInfoAsync(string operation, string operationBody, string resultNodeName, CancellationToken ct)
    {
        var document = await SendAsync(operation, operationBody, ct);
        var resultNode = document.Descendants().FirstOrDefault(x => x.Name.LocalName == resultNodeName);
        return resultNode is null ? null : ParseSessionInfo(resultNode);
    }

    private async Task<XDocument> SendAsync(string operation, string operationBody, CancellationToken ct)
    {
        var payload = BuildEnvelope(operationBody);
        using var request = new HttpRequestMessage(HttpMethod.Post, _options.Endpoint)
        {
            Content = new StringContent(payload, Encoding.UTF8, "text/xml")
        };
        request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("text/xml"));
        request.Headers.Add("SOAPAction", $"\"http://tempuri.org/ISingleAccessPointService/{operation}\"");
        if (!string.IsNullOrWhiteSpace(_options.ApiToken))
        {
            request.Headers.TryAddWithoutValidation(_options.ApiTokenHeaderName, _options.ApiToken);
        }

        using var response = await httpClient.SendAsync(request, ct);
        var xml = await response.Content.ReadAsStringAsync(ct);

        if (!response.IsSuccessStatusCode)
        {
            throw new HttpRequestException(
                $"SIA Admin SOAP call '{operation}' failed with status {(int)response.StatusCode}. Body: {xml}");
        }

        var document = XDocument.Parse(xml);
        var fault = document.Descendants(SoapNs + "Fault").FirstOrDefault();
        if (fault is not null)
        {
            var faultText = fault.Descendants().FirstOrDefault(x => x.Name.LocalName is "faultstring" or "Text")?.Value
                            ?? "Unknown SOAP fault";
            logger.LogWarning("SIA Admin SOAP fault on {Operation}: {Fault}", operation, faultText);
            throw new InvalidOperationException($"SIA Admin SOAP fault: {faultText}");
        }

        return document;
    }

    private static string BuildEnvelope(string operationBody)
    {
        return $"""
                <?xml version="1.0" encoding="utf-8"?>
                <soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                               xmlns:xsd="http://www.w3.org/2001/XMLSchema"
                               xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
                  <soap:Body>
                    {operationBody}
                  </soap:Body>
                </soap:Envelope>
                """;
    }

    private static SiaSessionInfoDto ParseSessionInfo(XElement sessionInfoElement)
    {
        var userElement = sessionInfoElement.Elements().FirstOrDefault(x => x.Name.LocalName == "User");
        var user = userElement is null ? null : ParseUser(userElement);

        return new SiaSessionInfoDto(
            GetValue(sessionInfoElement, "Token"),
            ParseDateTime(sessionInfoElement, "LoginTime"),
            ParseDateTime(sessionInfoElement, "LastAccessTime"),
            ParseDateTime(sessionInfoElement, "LogoutTime"),
            user
        );
    }

    private static SiaUserInfoDto ParseUser(XElement userElement)
    {
        var roles = userElement.Elements()
            .FirstOrDefault(x => x.Name.LocalName == "Roles")
            ?.Elements()
            .Where(x => x.Name.LocalName == "Role")
            .Select(ParseRole)
            .ToList()
            ?? [];

        var applications = userElement.Elements()
            .FirstOrDefault(x => x.Name.LocalName == "Applications")
            ?.Elements()
            .Where(x => x.Name.LocalName == "Application")
            .Select(app => new SiaApplicationDto(
                GetValue(app, "Code"),
                GetValue(app, "Name"),
                GetValue(app, "Description"),
                GetValue(app, "AccessUrl")))
            .ToList()
            ?? [];

        return new SiaUserInfoDto(
            GetValue(userElement, "Login"),
            GetValue(userElement, "FirstName"),
            GetValue(userElement, "LastName"),
            GetValue(userElement, "Email"),
            GetValue(userElement, "UserId"),
            roles,
            applications
        );
    }

    private static SiaRoleDto ParseRole(XElement roleElement)
    {
        var transactions = roleElement.Elements()
            .FirstOrDefault(x => x.Name.LocalName == "Transactions")
            ?.Elements()
            .Where(x => x.Name.LocalName == "Transaction")
            .Select(t => new SiaTransactionDto(
                GetValue(t, "Code"),
                GetValue(t, "Name"),
                GetValue(t, "Description")))
            .ToList()
            ?? [];

        return new SiaRoleDto(
            GetValue(roleElement, "Name"),
            GetValue(roleElement, "Description"),
            ParseInt64(roleElement, "CircumscriptionId"),
            ParseInt64(roleElement, "ElectionId"),
            transactions
        );
    }

    private static DateTime? ParseDateTime(XElement parent, string field)
    {
        var value = GetValue(parent, field);
        return DateTime.TryParse(value, out var parsed) ? parsed : null;
    }

    private static long? ParseInt64(XElement parent, string field)
    {
        var value = GetValue(parent, field);
        return long.TryParse(value, out var parsed) ? parsed : null;
    }

    private static string? GetValue(XElement parent, string field)
    {
        return parent.Elements().FirstOrDefault(x => x.Name.LocalName == field)?.Value;
    }

    private static string Escape(string value)
    {
        return SecurityElement.Escape(value) ?? string.Empty;
    }
}
