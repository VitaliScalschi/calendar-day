using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CalendarDay.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddDeadlineNotificationEmail : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "NotificationEmail",
                table: "Deadlines",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateOnly>(
                name: "NotificationSentOn",
                table: "Deadlines",
                type: "date",
                nullable: true);

            migrationBuilder.AddColumn<DateOnly>(
                name: "NotificationSentOn",
                table: "deadline_dates",
                type: "date",
                nullable: true);
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
