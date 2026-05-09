namespace CalendarDay.Domain.Entities;

public static class AppRoles
{
    public const string Admin = "Admin";
    public const string Editor = "Editor";
    public const string Viewer = "Viewer";

    public static readonly string[] All = [Admin, Editor, Viewer];
}
