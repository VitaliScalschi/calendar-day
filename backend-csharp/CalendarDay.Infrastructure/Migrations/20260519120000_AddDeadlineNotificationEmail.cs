using CalendarDay.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CalendarDay.Infrastructure.Migrations
{
    /// <inheritdoc />
    [DbContext(typeof(CalendarDayDbContext))]
    [Migration("20260519120000_AddDeadlineNotificationEmail")]
    public partial class AddDeadlineNotificationEmail : Migration
    {
        /// <summary>
        /// SQL idempotent (IF NOT EXISTS) — vezi nota din AddDocumentsTableAndRegulationDocumentLink.
        /// </summary>
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                ALTER TABLE "Deadlines" ADD COLUMN IF NOT EXISTS "NotificationEmail" text NULL;
                ALTER TABLE "Deadlines" ADD COLUMN IF NOT EXISTS "NotificationSentOn" date NULL;
                ALTER TABLE deadline_dates ADD COLUMN IF NOT EXISTS "NotificationSentOn" date NULL;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "NotificationEmail",
                table: "Deadlines");

            migrationBuilder.DropColumn(
                name: "NotificationSentOn",
                table: "Deadlines");

            migrationBuilder.DropColumn(
                name: "NotificationSentOn",
                table: "deadline_dates");
        }
    }
}
