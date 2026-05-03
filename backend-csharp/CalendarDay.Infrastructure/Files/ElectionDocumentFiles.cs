using System.IO;

namespace CalendarDay.Infrastructure.Files;

public static class ElectionDocumentFiles
{
    private static readonly HashSet<string> AllowedExtensions =
    [
        ".pdf",
        ".doc",
        ".docx",
        ".xls",
        ".xlsx",
        ".jpg",
        ".jpeg",
        ".png",
        ".gif",
        ".webp",
    ];

    public static bool IsAllowedExtension(string extension)
        => AllowedExtensions.Contains(extension.ToLowerInvariant());

    public static string GetUploadDirectory()
        => Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "elections");

    public static bool HasDocument(Guid electionId) => FindDocumentPath(electionId) is not null;

    public static string? FindDocumentPath(Guid electionId)
    {
        var dir = GetUploadDirectory();
        if (!Directory.Exists(dir))
        {
            return null;
        }

        foreach (var path in Directory.GetFiles(dir, $"{electionId}.*"))
        {
            if (IsAllowedExtension(Path.GetExtension(path)))
            {
                return path;
            }
        }

        return null;
    }

    public static void DeleteAllForElection(Guid electionId)
    {
        var dir = GetUploadDirectory();
        if (!Directory.Exists(dir))
        {
            return;
        }

        foreach (var path in Directory.GetFiles(dir, $"{electionId}.*"))
        {
            if (!IsAllowedExtension(Path.GetExtension(path)))
            {
                continue;
            }

            try
            {
                File.Delete(path);
            }
            catch (IOException)
            {
                // best-effort cleanup
            }
        }
    }
}
