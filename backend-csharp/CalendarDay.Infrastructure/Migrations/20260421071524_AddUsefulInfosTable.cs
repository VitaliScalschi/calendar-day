using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CalendarDay.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddUsefulInfosTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "UsefulInfos",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Title = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: false),
                    Slug = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Content = table.Column<string>(type: "text", nullable: false),
                    Icon = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    Status = table.Column<bool>(type: "boolean", nullable: false),
                    Order = table.Column<int>(type: "integer", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UsefulInfos", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_UsefulInfos_Order",
                table: "UsefulInfos",
                column: "Order");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "UsefulInfos");
        }
    }
}
