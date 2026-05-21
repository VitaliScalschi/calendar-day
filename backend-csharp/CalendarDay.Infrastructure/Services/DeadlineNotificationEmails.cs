namespace CalendarDay.Infrastructure.Services;

internal static class DeadlineNotificationEmails
{
    private const char Separator = ';';

    public static string? Serialize(IEnumerable<string>? emails)
    {
        var normalized = NormalizeList(emails);
        return normalized.Count == 0 ? null : string.Join(Separator, normalized);
    }

    public static IReadOnlyList<string> Parse(string? stored)
    {
        if (string.IsNullOrWhiteSpace(stored)) return [];

        return stored
            .Split(Separator, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Where(e => !string.IsNullOrWhiteSpace(e))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();
    }

    public static IReadOnlyList<string> NormalizeList(IEnumerable<string>? emails) =>
        (emails ?? [])
            .Select(e => e.Trim())
            .Where(e => !string.IsNullOrWhiteSpace(e))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();
}
