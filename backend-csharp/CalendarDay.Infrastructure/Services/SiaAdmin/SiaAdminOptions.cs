namespace CalendarDay.Infrastructure.Services.SiaAdmin;

public class SiaAdminOptions
{
    public const string SectionName = "SiaAdminSoap";
    public string Endpoint { get; set; } = "https://siaadmin.cec.md/WebServices/SingleAccessPointService.svc";
    public int TimeoutSeconds { get; set; } = 30;
    public string? ApiToken { get; set; }
    public string ApiTokenHeaderName { get; set; } = "X-Api-Token";
    public List<string> AdminRoleKeywords { get; set; } = ["Administrator"];
    public List<string> EditorRoleKeywords { get; set; } = ["Operator", "Editor"];

    public bool SiaPreferLeastPrivilegedMappedRoleWhenMultiple { get; set; }

    public string SessionCookieName { get; set; } = "SAISE.Token";
}
